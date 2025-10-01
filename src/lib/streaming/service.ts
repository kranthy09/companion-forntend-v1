// src/lib/streaming/service.ts
import { CookieManager } from '@/lib/cookies'
import type { SSEChunk, StreamConfig } from '@/types/streaming'

export class StreamingService {
    private abortController: AbortController | null = null

    async startStream(
        endpoint: string,
        noteId: number,
        config: StreamConfig
    ): Promise<void> {
        this.abortController = new AbortController()
        const csrfToken = CookieManager.getCSRFToken()
        const baseUrl = process.env.NEXT_PUBLIC_API_URL!

        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken || '',
                },
                body: JSON.stringify({ note_id: noteId }),
                signal: this.abortController.signal,
            })

            if (!response.ok) {
                throw new Error(`Stream failed: ${response.statusText}`)
            }

            if (!response.body) {
                throw new Error('No response body')
            }

            await this.processStream(response.body, config)
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                config.onError?.(error.message || 'Stream failed')
            }
        }
    }

    private async processStream(
        body: ReadableStream<Uint8Array>,
        config: StreamConfig
    ): Promise<void> {
        const reader = body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let taskId: string | null = null

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                // Decode immediately to get chunks faster
                const chunk = decoder.decode(value, { stream: true })
                buffer += chunk

                // Process line by line (SSE format: "data: {json}\n\n")
                const lines = buffer.split('\n')

                // Keep incomplete line in buffer
                if (!buffer.endsWith('\n')) {
                    buffer = lines.pop() || ''
                } else {
                    buffer = ''
                }

                for (const line of lines) {
                    const trimmed = line.trim()
                    if (!trimmed || !trimmed.startsWith('data: ')) continue

                    try {
                        const data: SSEChunk = JSON.parse(trimmed.slice(6))

                        if (data.task_id) {
                            taskId = data.task_id
                            config.onStart?.(data.task_id)
                        }

                        if (data.chunk) {
                            config.onChunk?.(data.chunk)
                        }

                        if (data.done) {
                            if (data.error) {
                                config.onError?.(data.error)
                            } else if (data.full_text && taskId) {
                                config.onComplete?.(data.full_text, taskId)
                            }
                            return
                        }

                        if (data.error) {
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

    stopStream(): void {
        this.abortController?.abort()
        this.abortController = null
    }

    isStreaming(): boolean {
        return this.abortController !== null
    }
}

export const streamingService = new StreamingService()