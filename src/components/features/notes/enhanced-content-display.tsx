// src/components/features/notes/enhanced-content-display.tsx
'use client'
import { Sparkles, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface EnhancedContentDisplayProps {
    content: string
    updatedAt?: string
}

export function EnhancedContentDisplay({ content, updatedAt }: EnhancedContentDisplayProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="border border-emerald-200 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-emerald-200">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">AI Enhanced Version</h3>
                </div>

                <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy enhanced content"
                >
                    {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                    )}
                </button>
            </div>

            <div className="p-6">
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-ul:text-gray-800 prose-ol:text-gray-800 prose-code:text-emerald-700 prose-code:bg-emerald-100 prose-pre:bg-gray-900 prose-pre:text-gray-100">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </div>

            <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 text-xs text-gray-600 flex items-center justify-between">
                <span>✨ Enhanced with AI</span>
                <span>{content.length} characters</span>
            </div>
        </div>
    )
}