// src/components/features/notes/summary-stream.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    FileText,
    Loader2,
    Sparkles,
    CheckCircle,
    Clock,
    X,
    AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api/endpoints'
import { useSummaryStreaming } from '@/hooks/useSummaryStreaming'
import { SummaryDisplay } from './summary-display'

interface SummaryStreamProps {
    noteId: number
}

interface SavedSummary {
    id: number
    content: string
    created_at: string
}

export function SummaryStream({ noteId }: SummaryStreamProps) {
    const [savedSummaries, setSavedSummaries] = useState<SavedSummary[]>([])
    const [selectedSummary, setSelectedSummary] = useState<number | null>(null)
    const [loadingHistory, setLoadingHistory] = useState(false)

    const {
        isStreaming,
        streamedContent,
        error,
        startStreaming,
        clearContent,
    } = useSummaryStreaming(noteId)

    useEffect(() => {
        loadSummaries()
    }, [noteId])

    const loadSummaries = async () => {
        setLoadingHistory(true)
        try {
            const response = await api.notes.summaries(noteId)
            if (response.success && response.data) {
                setSavedSummaries(response.data)
            }
        } catch (err) {
            console.error('Failed to load summaries:', err)
        } finally {
            setLoadingHistory(false)
        }
    }

    const handleGenerateSummary = async () => {
        setSelectedSummary(null)
        await startStreaming()
        // Reload summaries after generation completes
        setTimeout(() => loadSummaries(), 2000)
    }

    const viewSummary = (summary: SavedSummary) => {
        setSelectedSummary(summary.id)
        clearContent()
    }

    const selectedSummaryData = savedSummaries.find(
        (s) => s.id === selectedSummary
    )

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            AI Summary
                        </h2>
                        <p className="text-sm text-gray-600">
                            Get AI-powered insights from your note
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleGenerateSummary}
                    disabled={isStreaming}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                >
                    {isStreaming ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate New Summary
                        </>
                    )}
                </Button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-semibold text-red-900 mb-1">
                            Error Generating Summary
                        </p>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <button
                        onClick={() => clearContent()}
                        className="text-red-600 hover:text-red-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Streaming Progress Indicator */}
            {isStreaming && !streamedContent && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 animate-fadeIn">
                    <div className="flex items-center gap-3 mb-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Initializing AI Model
                            </h3>
                            <p className="text-sm text-gray-600">
                                Preparing to analyze your note...
                            </p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/3" />
                    </div>
                </div>
            )}

            {/* Streaming Content Display */}
            {streamedContent && (
                <SummaryDisplay
                    content={streamedContent}
                    isStreaming={isStreaming}
                />
            )}

            {/* Selected Summary Display */}
            {selectedSummaryData && !streamedContent && (
                <SummaryDisplay
                    content={selectedSummaryData.content}
                    isStreaming={false}
                />
            )}

            {/* Previous Summaries List */}
            {!streamedContent && !selectedSummary && savedSummaries.length > 0 && (
                <div className="space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Previous Summaries ({savedSummaries.length})
                        </h3>
                        {loadingHistory && (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        )}
                    </div>
                    <div className="grid gap-3">
                        {savedSummaries.map((summary, index) => (
                            <button
                                key={summary.id}
                                onClick={() => viewSummary(summary)}
                                className="group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                                            <span className="text-blue-600 font-bold text-sm">
                                                #{savedSummaries.length - index}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                                                Summary {savedSummaries.length - index}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {new Date(summary.created_at).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Back to List Button */}
            {(selectedSummary || streamedContent) && savedSummaries.length > 0 && (
                <Button
                    onClick={() => {
                        setSelectedSummary(null)
                        clearContent()
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                >
                    ← Back to Summaries List
                </Button>
            )}

            {/* Empty State */}
            {!streamedContent && !selectedSummary && savedSummaries.length === 0 && !isStreaming && (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 animate-fadeIn">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Summaries Yet
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Generate your first AI-powered summary to get instant insights from your note
                    </p>
                    <Button
                        onClick={handleGenerateSummary}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create First Summary
                    </Button>
                </div>
            )}
        </div>
    )
}