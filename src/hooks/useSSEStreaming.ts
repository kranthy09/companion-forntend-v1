// src/hooks/useSSEStream.ts
import { useState, useRef, useCallback, useEffect } from "react"

export interface StreamCallbacks {
    onStart?: (taskId?: string) => void
    onChunk?: (chunk: string) => void
    onComplete?: (fullText: string, taskId?: string) => void
    onError?: (error: string) => void
    onReconnect?: (attempt: number) => void
    onReconnectSuccess?: () => void
}

interface StreamOptions extends StreamCallbacks {
    method?: "GET" | "POST"
    headers?: Record<string, string>
    body?: any
    parseJSON?: boolean
    autoReconnect?: boolean
    maxRetries?: number
    retryDelay?: number // ms
}

interface SSEData {
    task_id?: string
    chunk?: string
    done?: boolean
    full_text?: string
    error?: string
}

export function useSSEStream() {
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamedContent, setStreamedContent] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [taskId, setTaskId] = useState<string | null>(null)

    const abortControllerRef = useRef<AbortController | null>(null)
    const contentRef = useRef("")
    const reconnectCountRef = useRef(0)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
    }, [])

    useEffect(() => cleanup, [cleanup])

    const processStream = useCallback(
        async (body: ReadableStream<Uint8Array>, opts: StreamOptions) => {
            const reader = body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""

            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split("\n")
                    buffer = lines.pop() || ""

                    for (const line of lines) {
                        const trimmed = line.trim()
                        if (!trimmed || !trimmed.startsWith("data: ")) continue

                        try {
                            const data: SSEData = JSON.parse(trimmed.slice(6))

                            if (data.task_id) {
                                setTaskId(data.task_id)
                                opts.onStart?.(data.task_id)
                            }

                            if (data.chunk) {
                                contentRef.current += data.chunk
                                setStreamedContent((prev) => prev + data.chunk)
                                opts.onChunk?.(data.chunk)
                            }

                            if (data.done) {
                                const finalText = data.full_text || contentRef.current
                                setIsStreaming(false)
                                opts.onComplete?.(finalText, data.task_id)
                                return
                            }

                            if (data.error) {
                                setError(data.error)
                                setIsStreaming(false)
                                opts.onError?.(data.error)
                                return
                            }
                        } catch (err) {
                            console.warn("Failed to parse SSE line:", trimmed)
                        }
                    }
                }
            } finally {
                reader.releaseLock()
            }
        },
        []
    )

    const startStreaming = useCallback(
        async (url: string, options: StreamOptions = {}) => {
            if (isStreaming) return

            const {
                method = "POST",
                headers = {},
                body,
                parseJSON = true,
                autoReconnect = true,
                maxRetries = 3,
                retryDelay = 2000,
            } = options

            setIsStreaming(true)
            setError(null)
            setStreamedContent("")
            setTaskId(null)
            contentRef.current = ""
            reconnectCountRef.current = 0
            cleanup()

            const doFetch = async (): Promise<void> => {
                abortControllerRef.current = new AbortController()

                try {
                    const response = await fetch(url, {
                        method,
                        headers: {
                            "Content-Type": "application/json",
                            ...headers,
                        },
                        credentials: "include",
                        body: method === "POST" ? JSON.stringify(body) : undefined,
                        signal: abortControllerRef.current.signal,
                    })

                    if (!response.ok) {
                        const errText = await response.text()
                        throw new Error(`HTTP ${response.status}: ${errText || response.statusText}`)
                    }

                    if (!response.body) throw new Error("No response body")
                    await processStream(response.body, options)
                    options.onReconnectSuccess?.()
                } catch (err: any) {
                    if (err.name === "AbortError") return

                    const errMsg = err.message || "Streaming failed"
                    setError(errMsg)
                    options.onError?.(errMsg)
                    setIsStreaming(false)

                    // Handle auto-reconnect
                    if (autoReconnect && reconnectCountRef.current < maxRetries) {
                        reconnectCountRef.current++
                        const attempt = reconnectCountRef.current
                        console.warn(`Reconnect attempt ${attempt} in ${retryDelay}ms`)
                        options.onReconnect?.(attempt)
                        reconnectTimeoutRef.current = setTimeout(doFetch, retryDelay)
                        return
                    }

                    cleanup()
                }
            }

            await doFetch()
        },
        [isStreaming, cleanup, processStream]
    )

    const stopStreaming = useCallback(() => {
        cleanup()
        setIsStreaming(false)
    }, [cleanup])

    return {
        isStreaming,
        streamedContent,
        error,
        taskId,
        startStreaming,
        stopStreaming,
    }
}
