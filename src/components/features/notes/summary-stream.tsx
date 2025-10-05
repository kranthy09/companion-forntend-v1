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
        try {
            const response = await api.notes.summaries(noteId)
            if (response.success && response.data) {
                setSavedSummaries(response.data)
            }
        } catch (err) {
            console.error('Failed to load summaries:', err)
        }
    }

    const handleGenerateSummary = async () => {
        setSelectedSummary(null)
        await startStreaming()
        loadSummaries()
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">AI Summary</h2>
                </div>
                <Button
                    onClick={handleGenerateSummary}
                    disabled={isStreaming}
                    className="flex items-center gap-2"
                >
                    {isStreaming ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Summary
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <X className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-900">{error}</p>
                </div>
            )}

            {isStreaming && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <div>
                            <h3 className="font-semibold text-gray-900">Generating Summary</h3>
                            <p className="text-sm text-gray-600">AI is analyzing your note...</p>
                        </div>
                    </div>
                </div>
            )}

            {streamedContent && (
                <SummaryDisplay content={streamedContent} isStreaming={isStreaming} />
            )}

            {selectedSummaryData && !streamedContent && (
                <SummaryDisplay content={selectedSummaryData.content} isStreaming={false} />
            )}

            {!streamedContent && !selectedSummary && savedSummaries.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase">
                        Previous Summaries ({savedSummaries.length})
                    </h3>
                    <div className="grid gap-3">
                        {savedSummaries.map((summary, index) => (
                            <button
                                key={summary.id}
                                onClick={() => viewSummary(summary)}
                                className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600 font-bold">#{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Summary {index + 1}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {new Date(summary.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {(selectedSummary || streamedContent) && (
                <Button
                    onClick={() => {
                        setSelectedSummary(null)
                        clearContent()
                    }}
                    variant="outline"
                    size="sm"
                >
                    Back to List
                </Button>
            )}

            {!streamedContent && !selectedSummary && savedSummaries.length === 0 && !isStreaming && (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Summaries Yet</h3>
                    <p className="text-gray-600">Generate a summary to get AI insights</p>
                </div>
            )}
        </div>
    )
}