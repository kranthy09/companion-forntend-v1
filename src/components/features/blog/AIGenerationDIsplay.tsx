import ReactMarkdown from 'react-markdown'
interface AIGenerationDisplayProps {
    isStreaming: boolean
    blogId: number | null
    heading: string
    headingComplete: boolean
    description: string
    descriptionComplete: boolean
    main: string
    mainComplete: boolean
    error: string | null
}

export function AIGenerationDisplay({
    isStreaming,
    blogId,
    heading,
    headingComplete,
    description,
    descriptionComplete,
    main,
    mainComplete,
    error,
}: AIGenerationDisplayProps) {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                    🤖 AI Generation
                </h2>
                {isStreaming && (
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                        <span className="text-sm font-medium text-blue-600">
                            Processing...
                        </span>
                    </div>
                )}
            </div>

            {blogId && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <div className="flex items-center">
                        <span className="text-green-800 font-medium">
                            ✓ Blog post created successfully (ID: {blogId})
                        </span>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="bg-white rounded-lg p-5 border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                            AI Heading
                        </span>
                        {isStreaming && !headingComplete && (
                            <div className="flex items-center space-x-1">
                                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"
                                    style={{ animationDelay: '0ms' }} />
                                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"
                                    style={{ animationDelay: '150ms' }} />
                                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"
                                    style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                        {headingComplete && (
                            <span className="text-green-600 text-sm">✓ Complete</span>
                        )}
                    </div>
                    <div className="min-h-[60px]">
                        {heading ? (
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{heading}</ReactMarkdown>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic animate-pulse">
                                Generating heading...
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-purple-700 uppercase tracking-wide">
                            AI Description
                        </span>
                        {isStreaming && heading && !descriptionComplete && (
                            <div className="flex items-center space-x-1">
                                <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce"
                                    style={{ animationDelay: '0ms' }} />
                                <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce"
                                    style={{ animationDelay: '150ms' }} />
                                <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce"
                                    style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                        {descriptionComplete && (
                            <span className="text-green-600 text-sm">✓ Complete</span>
                        )}
                    </div>
                    <div className="min-h-[80px]">
                        {description ? (
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{description}</ReactMarkdown>
                            </div>
                        ) : heading ? (
                            <p className="text-gray-400 italic animate-pulse">
                                Generating description...
                            </p>
                        ) : (
                            <p className="text-gray-300 italic">
                                Waiting for heading to complete...
                            </p>
                        )}
                    </div>

                </div>
            </div>

            {description && (
                <div className="bg-white rounded-lg p-5 border-2 border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-green-700 uppercase">
                            Main Content
                        </span>
                        {isStreaming && descriptionComplete && !mainComplete && (
                            <div className="flex space-x-1">
                                <div className="h-2 w-2 bg-green-600 rounded-full animate-bounce" />
                                <div className="h-2 w-2 bg-green-600 rounded-full animate-bounce"
                                    style={{ animationDelay: '150ms' }} />
                                <div className="h-2 w-2 bg-green-600 rounded-full animate-bounce"
                                    style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                        {mainComplete && <span className="text-green-600 text-sm">✓</span>}
                    </div>
                    <div className="min-h-[200px]">
                        {main ? (
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{main}</ReactMarkdown>
                            </div>
                        ) : descriptionComplete ? (
                            <p className="text-gray-400 italic animate-pulse">
                                Generating main content...
                            </p>
                        ) : (
                            <p className="text-gray-300 italic">Waiting...</p>
                        )}
                    </div>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-start">
                        <span className="text-red-800">
                            <strong>Error:</strong> {error}
                        </span>
                    </div>
                </div>
            )}


        </div>
    )
}