import { useState, useCallback } from 'react'
import { blogStreamingService } from '@/lib/streaming/blogService'

interface BlogSection {
    type: 'heading' | 'description' | 'main'
    content: string
    isComplete: boolean
}


export function useBlogStream() {
    const [blogId, setBlogId] = useState<number | null>(null)
    const [sections, setSections] = useState(new Map<string, BlogSection>())
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const startStream = useCallback(
        async (title: string, content: string) => {
            setBlogId(null)
            setSections(new Map())
            setError(null)
            setIsStreaming(true)

            await blogStreamingService.startStream(
                '/blog/posts/create-stream',
                { title, content },
                {
                    onBlogCreated: (id) => setBlogId(id),
                    onChunk: (type, chunk) => {
                        setSections((prev) => {
                            const newMap = new Map(prev)
                            const existing = newMap.get(type)
                            const newContent = (existing?.content || '') + chunk
                            newMap.set(type, {
                                type: type as 'heading' | 'description',
                                content: newContent,
                                isComplete: false,
                            })
                            return newMap
                        })
                    },
                    onSectionComplete: (type, content) => {
                        setSections((prev) => {
                            const newMap = new Map(prev)
                            const existing = newMap.get(type)
                            // Keep accumulated content if longer, otherwise use complete
                            const finalContent = existing && existing.content.length > content.length
                                ? existing.content
                                : content
                            newMap.set(type, {
                                type: type as 'heading' | 'description',
                                content: finalContent,
                                isComplete: true,
                            })
                            return newMap
                        })
                    },
                    onComplete: () => setIsStreaming(false),
                    onError: (err) => {
                        setError(err)
                        setIsStreaming(false)
                    },
                }
            )
        },
        []
    )

    const stopStream = useCallback(() => {
        blogStreamingService.stopStream()
        setIsStreaming(false)
    }, [])

    return {
        blogId,
        sections,
        isStreaming,
        error,
        startStream,
        stopStream,
    }
}
