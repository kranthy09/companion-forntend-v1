// src/lib/streaming/qa-service.ts
import { CookieManager } from '@/lib/cookies'
import type { QuestionStreamChunk } from '@/types/questions'

interface QAStreamConfig {
    onChunk?: (chunk: string) => void
    onComplete?: (fullAnswer: string) => void
    onError?: (error: string) => void
}

export class QAStreamingService {
    private abortController: AbortController | null = null

    async askQuestion(
        noteId: number,
        questionText: string,
        config: QAStreamConfig
    ): Promise<void> {
        this.abortController = new AbortController()
        const csrfToken = CookieManager.getCSRFToken()
        const baseUrl = process.env.NEXT_PUBLIC_API_URL!

        try {
            const response = await fetch(`${baseUrl}/ollama/ask`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken || '',
                },
                body: JSON.stringify({
                    note_id: noteId,
                    question_text: questionText,
                }),
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
                config.onError?.(error.message || 'Failed to get answer')
            }
        }
    }

    private async processStream(
        body: ReadableStream<Uint8Array>,
        config: QAStreamConfig
    ): Promise<void> {
        const reader = body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                buffer += chunk

                const lines = buffer.split('\n')
                if (!buffer.endsWith('\n')) {
                    buffer = lines.pop() || ''
                } else {
                    buffer = ''
                }

                for (const line of lines) {
                    const trimmed = line.trim()
                    if (!trimmed || !trimmed.startsWith('data: ')) continue

                    try {
                        const data: QuestionStreamChunk = JSON.parse(trimmed.slice(6))

                        if (data.chunk) {
                            config.onChunk?.(data.chunk)
                        }

                        if (data.done) {
                            if (data.error) {
                                config.onError?.(data.error)
                            } else if (data.full_answer) {
                                config.onComplete?.(data.full_answer)
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

    stop(): void {
        this.abortController?.abort()
        this.abortController = null
    }
}