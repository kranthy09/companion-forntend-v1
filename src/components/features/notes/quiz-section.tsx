// src/components/features/notes/quiz-section.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
    Brain,
    Loader2,
    CheckCircle,
    XCircle,
    ChevronRight,
    Trophy,
    RefreshCw,
    X,
    WifiOff,
    RotateCcw,
} from 'lucide-react'
import { api } from '@/lib/api/endpoints'
import {
    createTaskStatusWebSocket,
    WebSocketManager,
} from '@/lib/websockets'
import {
    saveQuizAttempt,
    loadQuizAttempt,
    removeQuizAttempt,
} from '@/lib/storage/quiz-storage'
import type {
    Quiz,
    QuizAnswers,
    QuizSubmitResponse,
    QuizQuestion
} from '@/types/quiz'
import type { TaskStatusMessage } from '@/types/task'
import { formatDistanceToNow } from 'date-fns'

interface QuizSectionProps {
    noteId: number
}

interface QuizAttempt {
    quizId: number
    answers: QuizAnswers
    results: QuizSubmitResponse | null
}

export function QuizSection({ noteId }: QuizSectionProps) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null)
    const [attempts, setAttempts] = useState<Map<number, QuizAttempt>>(
        new Map()
    )

    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [taskStatus, setTaskStatus] = useState('')
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [wsConnected, setWsConnected] = useState(false)

    const wsRef = useRef<WebSocketManager | null>(null)

    useEffect(() => {
        fetchQuizzes()

        return () => {
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }
        }
    }, [noteId])

    const fetchQuizzes = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await api.notes.getQuizzes(noteId)

            if (response.success && response.data) {
                setQuizzes(response.data)
                restoreQuizState(response.data)

                if (response.data.length > 0 && !selectedQuizId) {
                    setSelectedQuizId(response.data[0].id)
                }
            }
        } catch (err) {
            console.error('Failed to fetch quizzes:', err)
            setError('Failed to load quizzes. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const restoreQuizState = (quizzes: Quiz[]) => {
        const newAttempts = new Map<number, QuizAttempt>()

        quizzes.forEach((quiz) => {
            if (quiz.submission) {
                // Submitted quiz - use backend data
                const answers: QuizAnswers = {}
                quiz.questions.forEach((q: QuizQuestion) => {
                    if (q.user_answer) {
                        answers[q.id] = q.user_answer
                    }
                })

                const results: QuizSubmitResponse = {
                    correct_count: quiz.submission.score,
                    total_count: quiz.submission.total,
                    results: quiz.questions.map((q: QuizQuestion) => ({
                        question_id: q.id,
                        is_correct: q.is_correct ?? false,
                        correct_answer: '',
                        user_answer: q.user_answer || '',
                        explanation: null,
                    })),
                }

                newAttempts.set(quiz.id, {
                    quizId: quiz.id,
                    answers,
                    results,
                })
            } else {
                // Not submitted - check localStorage
                const savedAnswers = loadQuizAttempt(noteId, quiz.id)

                if (savedAnswers && Object.keys(savedAnswers).length > 0) {
                    newAttempts.set(quiz.id, {
                        quizId: quiz.id,
                        answers: savedAnswers,
                        results: null,
                    })
                }
            }
        })

        setAttempts(newAttempts)
    }

    const handleGenerateQuiz = async () => {
        setGenerating(true)
        setError(null)
        setTaskStatus('Initializing quiz generation...')
        setProgress(0)

        try {
            const response = await api.notes.generateQuiz(noteId)

            if (response.success && response.data?.task_id) {
                connectToGenerationStream(response.data.task_id)
            } else {
                throw new Error('Failed to start quiz generation')
            }
        } catch (err) {
            console.error('Quiz generation error:', err)
            setError('Failed to generate quiz. Please try again.')
            setGenerating(false)
        }
    }

    const connectToGenerationStream = useCallback((taskId: string) => {
        if (wsRef.current) {
            wsRef.current.close()
        }

        wsRef.current = createTaskStatusWebSocket(
            taskId,
            (message: TaskStatusMessage) => {
                handleTaskStatusMessage(message)
            },
            (error) => {
                console.error('WebSocket error:', error)
                setWsConnected(false)
                setError('Connection error. Retrying...')
            }
        )

        const checkConnection = setInterval(() => {
            if (wsRef.current) {
                setWsConnected(wsRef.current.isConnected())
            }
        }, 1000)

        if (wsRef.current) {
            const originalClose = wsRef.current.close.bind(wsRef.current)
            wsRef.current.close = (code?, reason?) => {
                clearInterval(checkConnection)
                originalClose(code, reason)
            }
        }

        setWsConnected(true)
    }, [])

    const handleTaskStatusMessage = useCallback(
        (message: TaskStatusMessage) => {
            switch (message.state) {
                case 'PENDING':
                    setTaskStatus('Task queued...')
                    setProgress(0)
                    break

                case 'STARTED':
                    setTaskStatus('Starting quiz generation...')
                    setProgress(10)
                    break

                case 'PROGRESS':
                    setTaskStatus(message.status || 'Processing...')
                    if (message.current && message.total) {
                        const percentage = Math.round(
                            (message.current / message.total) * 100
                        )
                        setProgress(Math.min(percentage, 95))
                    }
                    break

                case 'SUCCESS':
                    setTaskStatus('Quiz generated successfully!')
                    setProgress(100)
                    setTimeout(() => {
                        fetchQuizzes()
                        cleanupGeneration()
                    }, 1000)
                    break

                case 'FAILURE':
                    setError(
                        message.status ||
                        'Quiz generation failed. Please try again.'
                    )
                    cleanupGeneration()
                    break
            }
        },
        []
    )

    const cleanupGeneration = () => {
        setGenerating(false)
        setTaskStatus('')
        setProgress(0)
        setWsConnected(false)

        if (wsRef.current) {
            wsRef.current.close(1000, 'Task completed')
            wsRef.current = null
        }
    }

    const selectQuiz = useCallback((quizId: number) => {
        setSelectedQuizId(quizId)
        setError(null)
    }, [])

    const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId)
    const currentAttempt = selectedQuizId
        ? attempts.get(selectedQuizId)
        : null

    const handleAnswerSelect = useCallback(
        (questionId: number, answer: string) => {
            if (!selectedQuizId) return

            setAttempts((prev) => {
                const newAttempts = new Map(prev)
                const attempt = newAttempts.get(selectedQuizId) || {
                    quizId: selectedQuizId,
                    answers: {},
                    results: null,
                }

                const updatedAnswers = {
                    ...attempt.answers,
                    [questionId]: answer,
                }

                newAttempts.set(selectedQuizId, {
                    ...attempt,
                    answers: updatedAnswers,
                })

                // Save to localStorage
                saveQuizAttempt(noteId, selectedQuizId, updatedAnswers)

                return newAttempts
            })
        },
        [selectedQuizId, noteId]
    )

    const handleSubmitQuiz = async () => {
        if (!selectedQuizId || !currentAttempt) return

        const unansweredCount =
            (selectedQuiz?.questions.length || 0) -
            Object.keys(currentAttempt.answers).length

        if (unansweredCount > 0) {
            setError(
                `Please answer all questions (${unansweredCount} remaining)`
            )
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const response = await api.notes.submitQuiz(
                selectedQuizId,
                currentAttempt.answers
            )

            if (response.success && response.data) {
                setAttempts((prev) => {
                    const newAttempts = new Map(prev)
                    newAttempts.set(selectedQuizId, {
                        ...currentAttempt,
                        results: response.data!,
                    })
                    return newAttempts
                })

                // Remove from localStorage (now in backend)
                removeQuizAttempt(noteId, selectedQuizId)

                // Refresh from backend
                await fetchQuizzes()
            } else {
                throw new Error('Failed to submit quiz')
            }
        } catch (err) {
            console.error('Quiz submission error:', err)
            setError('Failed to submit quiz. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleTryAgain = useCallback(() => {
        if (!selectedQuizId) return

        setAttempts((prev) => {
            const newAttempts = new Map(prev)
            newAttempts.delete(selectedQuizId)
            return newAttempts
        })

        removeQuizAttempt(noteId, selectedQuizId)
        setError(null)
    }, [selectedQuizId, noteId])

    const isAnswerSelected = (
        questionId: number,
        option: string
    ): boolean => {
        return currentAttempt?.answers[questionId] === option
    }

    const getOptionClassName = (
        questionId: number,
        option: string
    ): string => {
        const baseClasses =
            'w-full text-left p-3 rounded-lg border-2 transition-all '

        if (!currentAttempt?.results) {
            const isSelected = isAnswerSelected(questionId, option)
            return (
                baseClasses +
                (isSelected
                    ? 'border-blue-500 bg-blue-50 font-medium'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
            )
        }

        const question = selectedQuiz?.questions.find(
            (q) => q.id === questionId
        )

        if (!question) return baseClasses + 'border-gray-200'

        const userAnswer = question.user_answer
        const isCorrect = question.is_correct

        if (option === userAnswer) {
            if (isCorrect === true) {
                return (
                    baseClasses +
                    'border-green-500 bg-green-50 text-green-900 font-medium'
                )
            } else if (isCorrect === false) {
                return (
                    baseClasses +
                    'border-red-500 bg-red-50 text-red-900 font-medium'
                )
            }
        }

        return baseClasses + 'border-gray-200 opacity-50'
    }

    const renderScoreSummary = () => {
        if (!currentAttempt?.results) return null

        const { correct_count, total_count } = currentAttempt.results
        const percentage = Math.round((correct_count / total_count) * 100)
        const isPerfect = correct_count === total_count

        return (
            <div
                className={`rounded-lg p-6 mb-6 ${isPerfect
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Trophy
                            className={`w-8 h-8 ${isPerfect ? 'text-green-600' : 'text-blue-600'
                                }`}
                        />
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Score: {correct_count}/{total_count}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {percentage}% Correct
                                {isPerfect && ' - Perfect Score! 🎉'}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleTryAgain}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                    Knowledge Quiz
                </h2>
                <Button
                    onClick={handleGenerateQuiz}
                    disabled={generating}
                    className="flex items-center gap-2"
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Brain className="w-4 h-4" />
                            Generate Quiz
                        </>
                    )}
                </Button>
            </div>

            {generating && !wsConnected && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-900">
                        Connecting to server...
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 hover:text-red-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {generating && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                {taskStatus || 'Preparing...'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                AI is creating questions from your note.
                            </p>
                            {progress > 0 && (
                                <div>
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-600 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!generating && quizzes.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                        No quizzes yet. Generate one to test your knowledge!
                    </p>
                </div>
            )}

            {quizzes.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {quizzes.map((quiz, index) => {
                        const hasSubmission = quiz.submission !== null
                        const hasLocalAttempt = attempts.has(quiz.id)

                        return (
                            <button
                                key={quiz.id}
                                onClick={() => selectQuiz(quiz.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedQuizId === quiz.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Quiz {index + 1}
                                {hasSubmission && (
                                    <CheckCircle className="w-3 h-3 inline-block ml-1 mb-0.5" />
                                )}
                                {!hasSubmission && hasLocalAttempt && (
                                    <span className="ml-1 text-xs opacity-75">●</span>
                                )}
                                <span className="ml-2 text-xs opacity-75">
                                    {formatDistanceToNow(new Date(quiz.created_at), {
                                        addSuffix: true,
                                    })}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            {selectedQuiz && (
                <div className="border border-gray-200 rounded-lg p-6">
                    {renderScoreSummary()}

                    <div className="space-y-6">
                        {selectedQuiz.questions
                            .sort((a, b) => a.id - b.id)
                            .map((question, index) => (
                                <div
                                    key={question.id}
                                    className="border border-gray-200 rounded-lg p-4"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        {currentAttempt?.results && (
                                            <div className="flex-shrink-0">
                                                {question.is_correct ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>
                                        )}
                                        <p className="font-medium text-gray-900 flex-1">
                                            {index + 1}. {question.question_text}
                                        </p>
                                    </div>

                                    <div className="space-y-2 ml-8">
                                        {question.options.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() =>
                                                    !currentAttempt?.results &&
                                                    handleAnswerSelect(question.id, option)
                                                }
                                                disabled={!!currentAttempt?.results}
                                                className={getOptionClassName(
                                                    question.id,
                                                    option
                                                )}
                                            >
                                                <span className="font-medium mr-2">
                                                    {option.charAt(0)}.
                                                </span>
                                                {option.substring(3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {!currentAttempt?.results && (
                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={handleSubmitQuiz}
                                disabled={submitting}
                                size="lg"
                                className="flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Quiz
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}