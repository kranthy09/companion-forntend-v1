// src/components/features/notes/quiz-section.tsx
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Brain, Loader2, CheckCircle, XCircle, ChevronRight, Trophy, RefreshCw, X } from 'lucide-react'
import { api } from '@/lib/api/endpoints'
import { createWebSocket } from '@/lib/websockets'
import type { Quiz, QuizAnswers, QuizSubmitResponse } from '@/types/quiz'
import type { TaskStatusMessage } from '@/types/task'
import { formatDistanceToNow } from 'date-fns'

interface QuizSectionProps {
    noteId: number
}

// Local state for quiz attempts (not persisted to backend)
interface QuizAttempt {
    quizId: number
    answers: QuizAnswers
    results: QuizSubmitResponse | null
}

export function QuizSection({ noteId }: QuizSectionProps) {
    // Quiz data from backend
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null)

    // Local attempt state (allows retries without hitting backend)
    const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null)

    // UI states
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [taskStatus, setTaskStatus] = useState('')
    const [progress, setProgress] = useState(0)

    const wsRef = useRef<any>(null)

    useEffect(() => {
        fetchQuizzes()
        return () => wsRef.current?.close()
    }, [noteId])

    const fetchQuizzes = async () => {
        setLoading(true)
        try {
            const response = await api.notes.getQuizzes(noteId)
            if (response.success && response.data) {
                const sorted = [...response.data].reverse() // Newest first
                setQuizzes(sorted)

                // Auto-select first quiz if none selected
                if (!selectedQuizId && sorted.length > 0) {
                    selectQuiz(sorted[0].id)
                }
            }
        } catch (err) {
            console.error('Failed to fetch quizzes:', err)
        } finally {
            setLoading(false)
        }
    }

    const selectQuiz = useCallback((quizId: number) => {
        setSelectedQuizId(quizId)

        const quiz = quizzes.find(q => q.id === quizId)
        if (!quiz) return

        // If quiz has submission, show results
        if (quiz.submission) {
            const submissionResults: QuizSubmitResponse = {
                correct_count: quiz.submission.score,
                total_count: quiz.submission.total,
                results: quiz.questions.map(q => ({
                    question_id: q.id,
                    is_correct: q.is_correct || false,
                    correct_answer: '',
                    user_answer: q.user_answer || '',
                    explanation: null
                }))
            }

            const submissionAnswers: QuizAnswers = {}
            quiz.questions.forEach(q => {
                if (q.user_answer) {
                    submissionAnswers[q.id] = q.user_answer
                }
            })

            setCurrentAttempt({
                quizId,
                answers: submissionAnswers,
                results: submissionResults
            })
        } else {
            // Fresh quiz - no attempt yet
            setCurrentAttempt({
                quizId,
                answers: {},
                results: null
            })
        }
    }, [quizzes])

    // Re-select quiz when quizzes update
    useEffect(() => {
        if (selectedQuizId && quizzes.length > 0) {
            selectQuiz(selectedQuizId)
        }
    }, [quizzes, selectedQuizId, selectQuiz])

    const handleGenerateQuiz = async () => {
        setGenerating(true)
        setTaskStatus('Initializing...')
        setProgress(0)

        try {
            const response = await api.notes.generateQuiz(noteId)
            if (response.success && response.data?.task_id) {
                connectToTaskStatus(response.data.task_id)
            }
        } catch (err: any) {
            alert(err.message || 'Failed to generate quiz')
            setGenerating(false)
        }
    }

    const connectToTaskStatus = (taskId: string) => {
        wsRef.current = createWebSocket({
            url: `/ws/task_status/${taskId}`,
            onMessage: (data: TaskStatusMessage) => {
                if (data.current && data.total) {
                    setProgress(Math.round((data.current / data.total) * 100))
                }

                if (data.state === 'PENDING') {
                    setTaskStatus(data.status || 'Waiting...')
                } else if (data.state === 'STARTED' || data.state === 'PROGRESS') {
                    setTaskStatus('Generating questions...')
                } else if (data.state === 'SUCCESS') {
                    setTaskStatus('Quiz ready!')
                    setTimeout(() => {
                        fetchQuizzes()
                        setGenerating(false)
                        setTaskStatus('')
                        setProgress(0)
                        wsRef.current?.close()
                    }, 500)
                } else if (data.state === 'FAILURE') {
                    setTaskStatus('Failed')
                    setTimeout(() => {
                        setGenerating(false)
                        setTaskStatus('')
                        setProgress(0)
                    }, 2000)
                }
            },
            onError: () => {
                setTaskStatus('Connection error')
                setTimeout(() => {
                    setGenerating(false)
                    setTaskStatus('')
                }, 2000)
            }
        })
        wsRef.current.connect()
    }

    const handleAnswerSelect = (questionId: number, optionText: string) => {
        if (!currentAttempt || currentAttempt.results) return // Read-only if submitted

        // Extract letter (A, B, C, D)
        const letter = optionText.match(/^([A-D])\./)?.[1] || optionText

        setCurrentAttempt(prev => {
            if (!prev) return prev
            return {
                ...prev,
                answers: { ...prev.answers, [questionId]: letter }
            }
        })
    }

    const handleSubmit = async () => {
        if (!currentAttempt || !selectedQuizId) return

        const selectedQuiz = quizzes.find(q => q.id === selectedQuizId)
        if (!selectedQuiz) return

        const allAnswered = selectedQuiz.questions.every(q => currentAttempt.answers[q.id])
        if (!allAnswered) {
            alert('Please answer all questions before submitting.')
            return
        }

        setSubmitting(true)
        try {
            const response = await api.notes.submitQuiz(selectedQuizId, currentAttempt.answers)
            if (response.success && response.data) {
                // Update local state with results
                setCurrentAttempt(prev => prev ? { ...prev, results: response.data! } : null)

                // Refresh quizzes to get persisted submission
                await fetchQuizzes()
            }
        } catch (err: any) {
            alert(err.message || 'Failed to submit quiz')
        } finally {
            setSubmitting(false)
        }
    }

    const handleTryAgain = () => {
        if (!selectedQuizId) return

        // Reset to fresh attempt
        setCurrentAttempt({
            quizId: selectedQuizId,
            answers: {},
            results: null
        })
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    const selectedQuiz = quizzes.find(q => q.id === selectedQuizId)
    const isSubmitted = currentAttempt?.results !== null

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Quiz Yourself</h2>
                    {quizzes.length > 0 && <span className="text-sm text-gray-500">({quizzes.length})</span>}
                </div>
                <Button onClick={handleGenerateQuiz} disabled={generating} size="sm">
                    {generating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Brain className="w-4 h-4 mr-2" />
                            Generate Quiz
                        </>
                    )}
                </Button>
            </div>

            {/* Generating Status */}
            {generating && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-4">
                    <div className="flex items-start gap-4">
                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{taskStatus || 'Preparing...'}</h3>
                            <p className="text-sm text-gray-600 mb-3">AI is creating questions from your note.</p>
                            {progress > 0 && (
                                <div>
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!generating && quizzes.length === 0 && (
                <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">No quizzes yet. Generate one to test your knowledge!</p>
                </div>
            )}

            {/* Quiz Content */}
            {quizzes.length > 0 && (
                <div className="space-y-4">
                    {/* Quiz Tabs */}
                    {quizzes.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {quizzes.map((quiz, index) => (
                                <button
                                    key={quiz.id}
                                    onClick={() => selectQuiz(quiz.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedQuizId === quiz.id
                                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Quiz {quizzes.length - index}
                                    {quiz.submission && (
                                        <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                            {quiz.submission.score}/{quiz.submission.total}
                                        </span>
                                    )}
                                    <span className="ml-2 text-xs opacity-70">
                                        {formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selected Quiz */}
                    {selectedQuiz && currentAttempt && (
                        <div>
                            {isSubmitted ? (
                                // Results View
                                <div className="space-y-4">
                                    {/* Score Card */}
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Trophy className="w-8 h-8 text-purple-600" />
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">
                                                        {currentAttempt.results!.correct_count === currentAttempt.results!.total_count
                                                            ? 'Perfect Score!'
                                                            : 'Quiz Complete!'}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {currentAttempt.results!.correct_count} / {currentAttempt.results!.total_count} correct
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-3xl font-bold text-purple-600">
                                                {Math.round((currentAttempt.results!.correct_count / currentAttempt.results!.total_count) * 100)}%
                                            </div>
                                        </div>
                                        <Button onClick={handleTryAgain} variant="outline" size="sm">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Try Again
                                        </Button>
                                    </div>

                                    {/* Question Results */}
                                    {selectedQuiz.questions
                                        .sort((a, b) => a.id - b.id)
                                        .map((question, index) => {
                                            const result = currentAttempt.results!.results.find(r => r.question_id === question.id)
                                            if (!result) return null

                                            return (
                                                <div
                                                    key={question.id}
                                                    className={`p-4 rounded-lg border-2 ${result.is_correct
                                                            ? 'bg-green-50 border-green-200'
                                                            : 'bg-red-50 border-red-200'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {result.is_correct ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 mb-2">
                                                                {index + 1}. {question.question_text}
                                                            </p>
                                                            <p className={`text-sm ${result.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                                                                <strong>Your answer:</strong> {result.user_answer}
                                                            </p>
                                                            {result.explanation && !result.is_correct && (
                                                                <p className="text-gray-700 text-sm mt-2 italic">
                                                                    {result.explanation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            ) : (
                                // Quiz Taking View
                                <div className="space-y-6">
                                    {selectedQuiz.questions
                                        .sort((a, b) => a.id - b.id)
                                        .map((question, index) => (
                                            <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                                                <p className="font-medium text-gray-900 mb-3">
                                                    {index + 1}. {question.question_text}
                                                </p>
                                                <div className="space-y-2">
                                                    {question.options.map((option, optIndex) => {
                                                        const optionLetter = option.match(/^([A-D])\./)?.[1] || option
                                                        const isSelected = currentAttempt.answers[question.id] === optionLetter

                                                        return (
                                                            <label
                                                                key={optIndex}
                                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${question.id}`}
                                                                    checked={isSelected}
                                                                    onChange={() => handleAnswerSelect(question.id, option)}
                                                                    className="w-4 h-4 text-purple-600"
                                                                />
                                                                <span className="text-gray-700">{option}</span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={submitting || selectedQuiz.questions.some(q => !currentAttempt.answers[q.id])}
                                        className="w-full"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Quiz
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}