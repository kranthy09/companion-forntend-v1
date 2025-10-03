// src/components/features/notes/question-answer.tsx
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    MessageCircleQuestion,
    ChevronDown,
    ChevronRight,
    Loader2,
    Send
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { QAStreamingService } from '@/lib/streaming/qa-service'
import { api } from '@/lib/api/endpoints'
import type { Question } from '@/types/questions'

interface QuestionAnswerProps {
    noteId: number
}

export function QuestionAnswer({ noteId }: QuestionAnswerProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
    const [showAskForm, setShowAskForm] = useState(false)
    const [questionText, setQuestionText] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingAnswer, setStreamingAnswer] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const qaService = new QAStreamingService()

    useEffect(() => {
        fetchQuestions()
    }, [noteId])

    const fetchQuestions = async () => {
        setLoading(true)
        try {
            const response = await api.questions.list(noteId)
            if (response.success && response.data) {
                setQuestions(response.data)
            }
        } catch (err) {
            console.error('Failed to fetch questions:', err)
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const handleAskQuestion = async () => {
        if (!questionText.trim() || isStreaming) return

        setIsStreaming(true)
        setStreamingAnswer('')
        setError(null)

        await qaService.askQuestion(noteId, questionText.trim(), {
            onChunk: (chunk) => {
                setStreamingAnswer(prev => prev + chunk)
            },
            onComplete: (fullAnswer) => {
                setIsStreaming(false)
                setQuestionText('')
                setStreamingAnswer('')
                // Refresh questions list
                setTimeout(() => fetchQuestions(), 1000)
            },
            onError: (err) => {
                setError(err)
                setIsStreaming(false)
            }
        })
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleAskQuestion()
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MessageCircleQuestion className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                        Questions & Answers
                    </h2>
                    {questions.length > 0 && (
                        <span className="text-sm text-gray-500">({questions.length})</span>
                    )}
                </div>

                <Button
                    onClick={() => setShowAskForm(!showAskForm)}
                    variant="primary"
                    size="sm"
                >
                    <MessageCircleQuestion className="w-4 h-4 mr-2" />
                    Ask Question
                </Button>
            </div>

            {/* Ask Question Form */}
            {showAskForm && (
                <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ask a question about this note..."
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isStreaming}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleAskQuestion}
                            disabled={!questionText.trim() || isStreaming}
                            size="sm"
                        >
                            {isStreaming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    {/* Streaming Answer */}
                    {isStreaming && streamingAnswer && (
                        <div className="mt-3 p-3 bg-white border border-indigo-200 rounded">
                            <div className="prose prose-sm max-w-none">
                                <div className="text-gray-800 whitespace-pre-wrap">
                                    {streamingAnswer}
                                    <span className="inline-block w-2 h-4 ml-1 bg-indigo-600 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                </div>
            )}

            {/* Questions List */}
            {loading ? (
                <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </div>
            ) : questions.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">
                    No questions yet. Ask your first question above!
                </p>
            ) : (
                <div className="space-y-2">
                    {questions.map((q) => (
                        <div
                            key={q.id}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() => toggleExpand(q.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-start gap-3 flex-1">
                                    {expandedIds.has(q.id) ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {q.question_text}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(q.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {expandedIds.has(q.id) && (
                                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
                                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
                                        <ReactMarkdown>{q.answer}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}