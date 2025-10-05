// src/hooks/useSummaryStreaming.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { CookieManager } from '@/lib/cookies'

interface StreamConfig {
    onStart?: (taskId: string) => void
    onChunk?: (chunk: string) => void
    onComplete?: (fullText: string, taskId: string) => void
    onError?: (error: string) => void
}

interface SSEData {
    task_id?: string
    chunk?: string
    done?: boolean
    full_text?: string
    error?: string
}

export function useSummaryStreaming(
    noteId: number,
    config: StreamConfig = {}
) {
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamedContent, setStreamedContent] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [taskId, setTaskId] = useState<string | null>(null)

    const abortControllerRef = useRef<AbortController | null>(null)
    const contentRef = useRef('')

    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => cleanup()
    }, [cleanup])

    const processSSEStream = async (
        body: ReadableStream<Uint8Array>
    ): Promise<void> => {
        const reader = body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let currentTaskId = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    const trimmed = line.trim()
                    if (!trimmed || !trimmed.startsWith('data: ')) continue

                    try {
                        const data: SSEData = JSON.parse(trimmed.slice(6))

                        // Handle task_id
                        if (data.task_id) {
                            currentTaskId = data.task_id
                            setTaskId(data.task_id)
                            config.onStart?.(data.task_id)
                        }

                        // Handle chunk
                        if (data.chunk) {
                            contentRef.current += data.chunk
                            setStreamedContent(prev => prev + data.chunk)
                            config.onChunk?.(data.chunk)
                        }

                        // Handle completion
                        if (data.done) {
                            const finalContent =
                                data.full_text || contentRef.current
                            setStreamedContent(finalContent)
                            setIsStreaming(false)
                            config.onComplete?.(
                                finalContent,
                                currentTaskId || taskId || ''
                            )
                            return
                        }

                        // Handle error
                        if (data.error) {
                            setError(data.error)
                            setIsStreaming(false)
                            config.onError?.(data.error)
                            return
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE line:', trimmed)
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }

    const startStreaming = useCallback(async () => {
        if (isStreaming) return

        setIsStreaming(true)
        setStreamedContent('')
        setError(null)
        setTaskId(null)
        contentRef.current = ''
        cleanup()

        abortControllerRef.current = new AbortController()

        try {
            const csrfToken = CookieManager.getCSRFToken()
            const baseUrl = process.env.NEXT_PUBLIC_API_URL!

            const response = await fetch(
                `${baseUrl}/ollama/summary/stream`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken || '',
                    },
                    body: JSON.stringify({ note_id: noteId }),
                    signal: abortControllerRef.current.signal,
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(
                    `HTTP ${response.status}: ${errorText || response.statusText}`
                )
            }

            if (!response.body) {
                throw new Error('No response body')
            }

            await processSSEStream(response.body)
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                const errMsg = err.message || 'Failed to start streaming'
                setError(errMsg)
                config.onError?.(errMsg)
            }
            setIsStreaming(false)
            cleanup()
        }
    }, [noteId, isStreaming, config, cleanup, processSSEStream])

    const stopStreaming = useCallback(() => {
        cleanup()
        setIsStreaming(false)
    }, [cleanup])

    const clearContent = useCallback(() => {
        setStreamedContent('')
        setError(null)
        setTaskId(null)
        contentRef.current = ''
    }, [])

    return {
        isStreaming,
        streamedContent,
        error,
        taskId,
        startStreaming,
        stopStreaming,
        clearContent,
    }
}