'use client'

import { useState } from 'react'
import { useBlogCreation } from '@/hooks/useBlogCreation'
import { BlogCreateForm } from '@/components/features/blog/BlogCreateForm'
import { AIGenerationDisplay } from '@/components/features/blog/AIGenerationDIsplay'

export default function CreateBlogPage() {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const { blogId, sections, isStreaming, error, createBlog } = useBlogCreation()

    const heading = sections.get('heading')
    const description = sections.get('description')
    const main = sections.get('main')


    const handleCreate = () => {
        if (title.trim() && content.trim()) {
            createBlog(title, content)
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Create Blog Post</h1>

            <BlogCreateForm
                title={title}
                content={content}
                onTitleChange={setTitle}
                onContentChange={setContent}
                onSubmit={handleCreate}
                isDisabled={isStreaming}
            />

            {(isStreaming || blogId) && (
                <AIGenerationDisplay
                    isStreaming={isStreaming}
                    blogId={blogId}
                    heading={heading?.content || ''}
                    headingComplete={heading?.isComplete || false}
                    description={description?.content || ''}
                    descriptionComplete={description?.isComplete || false}
                    main={main?.content || ''}
                    mainComplete={main?.isComplete || false}
                    error={error}
                />
            )}
        </div>
    )
}
