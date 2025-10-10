import { CookieManager } from '@/lib/cookies'

interface BlogStreamEvent {
    type: string
    id?: number
    stage?: string
    content?: string
    heading?: string
    description?: string
    task?: string
    msg?: string
}

interface BlogStreamConfig {
    onBlogCreated?: (id: number) => void
    onSectionStart?: (stage: string) => void
    onChunk?: (type: string, content: string) => void
    onSectionComplete?: (type: string, content: string) => void
    onComplete?: () => void
    onError?: (error: string) => void
}

export class BlogStreamingService {
    private abortController: AbortController | null = null

    async startStream(
        endpoint: string,
        data: { title: string; content: string },
        config: BlogStreamConfig
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
                body: JSON.stringify(data),
                signal: this.abortController.signal,
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            await this.processStream(response.body!, config)
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                config.onError?.(error.message || 'Stream failed')
            }
        }
    }

    private async processStream(
        body: ReadableStream<Uint8Array>,
        config: BlogStreamConfig
    ): Promise<void> {
        const reader = body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data: ')) continue

                    try {
                        const event: BlogStreamEvent = JSON.parse(line.slice(6))

                        switch (event.type) {
                            case 'blog_created':
                                config.onBlogCreated?.(event.id!)
                                break
                            case 'start':
                                config.onSectionStart?.(event.stage!)
                                break
                            case 'heading_chunk':
                                config.onChunk?.('heading', event.content!)
                                break
                            case 'heading_done':
                                config.onSectionComplete?.('heading', event.heading!)
                                break
                            case 'description_chunk':
                                config.onChunk?.('description', event.content!)
                                break
                            case 'description_done':
                                config.onSectionComplete?.('description', event.description!)
                                break
                            case 'main_chunk':
                                config.onChunk?.('main', event.content!)
                                break
                            case 'main_done':
                                config.onSectionComplete?.('main', event.content!)
                                break
                            case 'complete':
                                config.onComplete?.()
                                return
                            case 'error':
                                config.onError?.(event.msg!)
                                return
                        }
                    } catch (e) {
                        console.warn('Parse error:', e)
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

export const blogStreamingService = new BlogStreamingService()
