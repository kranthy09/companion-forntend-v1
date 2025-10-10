import { useCallback } from 'react'
import { useBlogStream } from './useBlogStream'

export function useBlogCreation() {
    const stream = useBlogStream()

    const createBlog = useCallback(
        async (title: string, content: string) => {
            await stream.startStream(title, content)
        },
        [stream]
    )

    return {
        ...stream,
        createBlog,
    }
}