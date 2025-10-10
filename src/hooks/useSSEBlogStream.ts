// ============================================================
// src/hooks/useSSEBlogStream.ts
// ============================================================
import { useState, useRef, useCallback } from 'react'

interface BlogSection {
    type: 'heading' | 'description'
    content: string
    isComplete: boolean
}

interface BlogStreamState {
    blogId: number | null
    sections: Map<string, BlogSection>
    error: string | null
    isStreaming: boolean
}

interface BlogStreamEvent {
    type: string
    id?: number
    stage?: string
    content?: string
    heading?: string
    description?: string
    msg?: string
}

interface StreamOptions {
    onBlogCreated?: (id: number) => void
    onSectionStart?: (type: string) => void
    onSectionComplete?: (type: string, content: string) => void
    onComplete?: (state: BlogStreamState) => void
    onError?: (error: string) => void
}

export function useSSEBlogStream() {
    const [state, setState] = useState<BlogStreamState>({
        blogId: null,
        sections: new Map(),
        error: null,
        isStreaming: false,
    })

    const abortRef = useRef<AbortController | null>(null)
    const sectionsRef = useRef(new Map<string, BlogSection>())

    const updateSection = useCallback(
        (type: 'heading' | 'description', content: string, done = false) => {
            sectionsRef.current.set(type, {
                type,
                content,
                isComplete: done,
            })
            setState((prev) => ({
                ...prev,
                sections: new Map(sectionsRef.current),
            }))
        },
        []
    )

    const startStream = useCallback(
        async (
            url: string,
            body: { title: string; content: string },
            options: StreamOptions = {}
        ) => {
            abortRef.current?.abort()
            abortRef.current = new AbortController()

            sectionsRef.current.clear()
            setState({
                blogId: null,
                sections: new Map(),
                error: null,
                isStreaming: true,
            })

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(body),
                    signal: abortRef.current.signal,
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }

                const reader = response.body!.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

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
                                    setState((prev) => ({ ...prev, blogId: event.id! }))
                                    options.onBlogCreated?.(event.id!)
                                    break

                                case 'start':
                                    options.onSectionStart?.(event.stage!)
                                    break

                                case 'heading_chunk':
                                    const currHeading = sectionsRef.current.get('heading')
                                    updateSection(
                                        'heading',
                                        (currHeading?.content || '') + event.content,
                                        false
                                    )
                                    break

                                case 'heading_done':
                                    updateSection('heading', event.heading!, true)
                                    options.onSectionComplete?.('heading', event.heading!)
                                    break

                                case 'description_chunk':
                                    const currDesc = sectionsRef.current.get('description')
                                    updateSection(
                                        'description',
                                        (currDesc?.content || '') + event.content,
                                        false
                                    )
                                    break

                                case 'description_done':
                                    updateSection('description', event.description!, true)
                                    options.onSectionComplete?.(
                                        'description',
                                        event.description!
                                    )
                                    break

                                case 'complete':
                                    setState((prev) => {
                                        const finalState = { ...prev, isStreaming: false }
                                        options.onComplete?.(finalState)
                                        return finalState
                                    })
                                    break

                                case 'error':
                                    throw new Error(event.msg || 'Stream error')
                            }
                        } catch (e) {
                            console.error('Parse error:', e)
                        }
                    }
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return

                const error = err.message || 'Stream failed'
                setState((prev) => ({
                    ...prev,
                    error,
                    isStreaming: false,
                }))
                options.onError?.(error)
            }
        },
        [updateSection]
    )

    const stopStream = useCallback(() => {
        abortRef.current?.abort()
        setState((prev) => ({ ...prev, isStreaming: false }))
    }, [])

    return {
        ...state,
        startStream,
        stopStream,
        getSection: (type: 'heading' | 'description') =>
            state.sections.get(type),
    }
}
