interface BlogCreateFormProps {
    title: string
    content: string
    onTitleChange: (value: string) => void
    onContentChange: (value: string) => void
    onSubmit: () => void
    isDisabled: boolean
}

export function BlogCreateForm({
    title,
    content,
    onTitleChange,
    onContentChange,
    onSubmit,
    isDisabled,
}: BlogCreateFormProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Enter your blog title..."
                    disabled={isDisabled}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     transition-colors"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                </label>
                <textarea
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    placeholder="Write your blog content here..."
                    rows={14}
                    disabled={isDisabled}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     font-mono text-sm resize-y transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                    {content.length} characters • {content.split(/\s+/).filter(Boolean).length} words
                </p>
            </div>

            <button
                onClick={onSubmit}
                disabled={isDisabled || !title.trim() || !content.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white
                   font-semibold py-3 px-4 rounded-lg
                   disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors duration-200 shadow-sm"
            >
                {isDisabled ? (
                    <span className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12" cy="12" r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        <span>Creating...</span>
                    </span>
                ) : (
                    '✨ Create Blog with AI'
                )}
            </button>
        </div>
    )
}