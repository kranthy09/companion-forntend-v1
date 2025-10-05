// src/lib/streaming/summary-service.ts
import { getCSRFToken } from '@/lib/cookies'

interface SummaryStreamChunk {
    chunk?: string
    done?: boolean
    summary_id?: number
    error?: string
}

interface SummaryStreamConfig {
    onChunk?: (chunk: string) => void
    onComplete?: (summaryId: number) => void
    onError?: (error: string) => void
}

export class SummaryStreamingService {
    private abortController: AbortController | null = null

    async generateSummary(
        noteId: number,
        config: SummaryStreamConfig
    ): Promise<void> {
        this.abortController = new AbortController()
        const csrfToken = getCSRFToken()
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

        try {
            const response = await fetch(`${baseUrl}/ollama/summary/stream`, {
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
                throw new Error(`Request failed: ${response.statusText}`)
            }

            if (!response.body) {
                throw new Error('No response body')
            }

            await this.processStream(response.body, config)
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                config.onError?.(error.message || 'Failed to generate summary')
            }
        }
    }

    private async processStream(
        body: ReadableStream<Uint8Array>,
        config: SummaryStreamConfig
    ): Promise<void> {
        const reader = body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data: ')) continue

                    try {
                        const data: SummaryStreamChunk = JSON.parse(line.slice(6))

                        if (data.chunk) {
                            config.onChunk?.(data.chunk)
                        }

                        if (data.done && data.summary_id) {
                            config.onComplete?.(data.summary_id)
                            return
                        }

                        if (data.error) {
                            config.onError?.(data.error)
                            return
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE line:', line)
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }

    stop(): void {
        this.abortController?.abort()
        this.abortController = null
    }
}