// src/components/features/notes/enhancement-carousel.tsx
'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Copy, CheckCircle, Sparkles, Clock, History } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { formatDistanceToNow } from 'date-fns'
import type { EnhancedNote } from '@/types/notes'

interface EnhancementCarouselProps {
    versions: EnhancedNote[]
    onRefresh?: () => void
}

export function EnhancementCarousel({ versions, onRefresh }: EnhancementCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [copied, setCopied] = useState(false)

    // Versions are already sorted by backend (newest first)
    const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number)

    useEffect(() => {
        setCurrentIndex(0) // Reset to latest when versions change
    }, [versions.length])

    const goToPrevious = () => {
        setCurrentIndex(prev => Math.max(0, prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex(prev => Math.min(sortedVersions.length - 1, prev + 1))
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(sortedVersions[currentIndex].content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (sortedVersions.length === 0) {
        return (
            <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">
                    No enhanced versions yet. Click "Enhance with AI" to create one.
                </p>
            </div>
        )
    }

    const current = sortedVersions[currentIndex]
    const isLatest = currentIndex === 0
    const isOldest = currentIndex === sortedVersions.length - 1

    return (
        <div className="border border-emerald-200 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-emerald-200">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            Version {current.version_number}
                            {isLatest && (
                                <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    Latest
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(current.created_at), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Version Counter */}
                    <span className="text-sm text-gray-600 mr-2">
                        {currentIndex + 1} / {sortedVersions.length}
                    </span>

                    {/* Navigation Buttons */}
                    <button
                        onClick={goToPrevious}
                        disabled={isLatest}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Newer version"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>

                    <button
                        onClick={goToNext}
                        disabled={isOldest}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Older version"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                        title="Copy content"
                    >
                        {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                            <Copy className="w-4 h-4 text-gray-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-ul:text-gray-800 prose-ol:text-gray-800 prose-code:text-emerald-700 prose-code:bg-emerald-100 prose-pre:bg-gray-900 prose-pre:text-gray-100">
                    <ReactMarkdown>{current.content}</ReactMarkdown>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 text-xs text-gray-600 flex items-center justify-between">
                <span>
                    {isLatest ? '✨ Latest Enhancement' : `📜 Version ${current.version_number}`}
                </span>
                <span>{current.content.length} characters</span>
            </div>

            {/* Version Dots Navigation */}
            {sortedVersions.length > 1 && (
                <div className="flex justify-center gap-1.5 py-3 bg-white border-t border-emerald-200">
                    {sortedVersions.map((version, index) => (
                        <button
                            key={version.id}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                    ? 'bg-emerald-600 w-6'
                                    : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            title={`Version ${version.version_number}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}