// src/components/features/notes/streaming-display.tsx
'use client'
import { Sparkles, StopCircle, X, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface StreamingDisplayProps {
    isStreaming: boolean
    content: string
    error: string | null
    taskId: string | null
    onStop: () => void
    onClear: () => void
}

export function StreamingDisplay({
    isStreaming,
    content,
    error,
    taskId,
    onStop,
    onClear,
}: StreamingDisplayProps) {
    const [copied, setCopied] = useState(false)

    if (!isStreaming && !content && !error) return null

    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="mt-6 border border-blue-200 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-blue-200">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">AI Enhanced Content</h3>
                    {isStreaming && (
                        <span className="flex items-center gap-1.5 text-xs text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Streaming...
                        </span>
                    )}
                    {taskId && (
                        <span className="text-xs text-gray-500">ID: {taskId.slice(0, 8)}</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!isStreaming && content && (
                        <button
                            onClick={handleCopy}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Copy content"
                        >
                            {copied ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <Copy className="w-4 h-4 text-gray-600" />
                            )}
                        </button>
                    )}
                    {isStreaming && (
                        <button
                            onClick={onStop}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Stop streaming"
                        >
                            <StopCircle className="w-4 h-4 text-red-600" />
                        </button>
                    )}
                    {!isStreaming && content && (
                        <button
                            onClick={onClear}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Clear"
                        >
                            <X className="w-4 h-4 text-gray-600" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4">
                {error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">
                            <strong>Error:</strong> {error}
                        </p>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-ul:text-gray-800 prose-ol:text-gray-800">
                        {isStreaming ? (
                            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {content}
                                <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse" />
                            </div>
                        ) : (
                            <ReactMarkdown>{content}</ReactMarkdown>
                        )}
                    </div>
                )}
            </div>

            {!isStreaming && content && !error && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-gray-600 flex items-center justify-between">
                    <span>✨ Enhancement complete</span>
                    <span>{content.length} characters</span>
                </div>
            )}
        </div>
    )
}