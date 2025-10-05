// src/components/features/notes/summary-display.tsx
'use client'

import { FileText, Sparkles, CheckCircle, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface SummaryDisplayProps {
    content: string
    isStreaming: boolean
}
export function SummaryDisplay({ content, isStreaming }: SummaryDisplayProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    if (isStreaming) {
        return (
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-300 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                        <h3 className="font-semibold text-gray-900">Generating Summary...</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span>Live</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-5 min-h-[120px] shadow-inner">
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{content || 'Connecting to AI...'}</ReactMarkdown>
                    </div>
                    <span className="inline-block w-0.5 h-5 ml-1 bg-blue-600 animate-pulse" />
                </div>
            </div>
        )
    }

    if (!content) return null

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">AI Summary</h3>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copy
                        </>
                    )}
                </button>
            </div>
            <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        </div>
    )
}