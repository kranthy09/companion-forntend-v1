// src/types/streaming.ts

export interface SSEChunk {
    task_id?: string
    status?: 'started' | 'processing' | 'complete'
    chunk?: string
    done?: boolean
    full_text?: string
    error?: string
}

export interface StreamConfig {
    onStart?: (taskId: string) => void
    onChunk?: (chunk: string) => void
    onComplete?: (fullText: string, taskId: string) => void
    onError?: (error: string) => void
}

export interface UseStreamingReturn {
    isStreaming: boolean
    content: string
    error: string | null
    taskId: string | null
    startStream: () => Promise<void>
    stopStream: () => void
    clearContent: () => void
}