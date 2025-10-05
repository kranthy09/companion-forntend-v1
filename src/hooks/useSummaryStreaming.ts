// src/hooks/useSummaryStreaming.ts
import { useState, useRef, useCallback } from 'react'
import { SummaryStreamingService } from '@/lib/streaming/summary-service'

export function useSummaryStreaming(noteId: number) {
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamedContent, setStreamedContent] = useState('')
    const [error, setError] = useState<string | null>(null)
    const serviceRef = useRef(new SummaryStreamingService())

    const startStreaming = useCallback(async () => {
        setIsStreaming(true)
        setStreamedContent('')
        setError(null)

        await serviceRef.current.generateSummary(noteId, {
            onChunk: (chunk) => {
                setStreamedContent((prev) => prev + chunk)
            },
            onComplete: () => {
                setIsStreaming(false)
            },
            onError: (err) => {
                setError(err)
                setIsStreaming(false)
                setStreamedContent('')
            },
        })
    }, [noteId])

    const stopStreaming = useCallback(() => {
        serviceRef.current.stop()
        setIsStreaming(false)
    }, [])

    const clearContent = useCallback(() => {
        setStreamedContent('')
        setError(null)
    }, [])

    return {
        isStreaming,
        streamedContent,
        error,
        startStreaming,
        stopStreaming,
        clearContent,
    }
}