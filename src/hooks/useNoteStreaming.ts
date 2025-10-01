// src/hooks/useNoteStreaming.ts
import { useState, useCallback, useRef } from 'react'
import { StreamingService } from '@/lib/streaming'
import type { UseStreamingReturn, StreamConfig } from '@/types/streaming'

export function useNoteStreaming(
    noteId: number,
    config: StreamConfig = {}
): UseStreamingReturn {
    const [isStreaming, setIsStreaming] = useState(false)
    const [content, setContent] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [taskId, setTaskId] = useState<string | null>(null)

    const serviceRef = useRef(new StreamingService())

    const startStream = useCallback(async () => {
        if (isStreaming) return

        setIsStreaming(true)
        setContent('')
        setError(null)
        setTaskId(null)

        await serviceRef.current.startStream('/ollama/enhance/stream', noteId, {
            onStart: (id) => {
                setTaskId(id)
                config.onStart?.(id)
            },
            onChunk: (chunk) => {
                setContent(prev => prev + chunk)
                config.onChunk?.(chunk)
            },
            onComplete: (fullText, id) => {
                setContent(fullText)
                setIsStreaming(false)
                config.onComplete?.(fullText, id)
            },
            onError: (err) => {
                setError(err)
                setIsStreaming(false)
                config.onError?.(err)
            }
        })
    }, [noteId, isStreaming, config])

    const stopStream = useCallback(() => {
        serviceRef.current.stopStream()
        setIsStreaming(false)
    }, [])

    const clearContent = useCallback(() => {
        setContent('')
        setError(null)
        setTaskId(null)
    }, [])

    return {
        isStreaming,
        content,
        error,
        taskId,
        startStream,
        stopStream,
        clearContent,
    }
}