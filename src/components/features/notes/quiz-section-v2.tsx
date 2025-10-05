// src/components/features/notes/quiz-section-v2.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Brain,
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api/endpoints'
import { createTaskStatusWebSocket } from '@/lib/websockets'

interface QuizSectionProps {
  noteId: number
}

interface QuizQuestion {
  question_id: string
  question: string
  options: Record<string, string> // {A: "opt1", B: "opt2", ...}
}

interface GeneratedQuiz {
  quiz_id: string
  questions: QuizQuestion[]
  total: string
}

interface QuizResult {
  is_correct: boolean
  explanation: string
}

interface BackendResult {
  question_id: string
  is_correct: boolean
  explanation: string
}

interface SubmissionResponse {
  quiz_id: number
  correct_count: number
  total_count: number
  results: Record<string, QuizResult>
}

interface SavedQuiz {
  id: number
  created_at: string
  questions: Array<{
    id: number
    question_text: string
    options: string[]
    user_answer?: string
    is_correct?: boolean
  }>
  submission: {
    score: number
    total: number
    submitted_at: string
  } | null
}

export function QuizSectionV2({ noteId }: QuizSectionProps) {
  // State management
  const [generating, setGenerating] = useState(false)
  const [currentQuiz, setCurrentQuiz] = useState<GeneratedQuiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<SubmissionResponse | null>(null)
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([])
  const [selectedSavedQuiz, setSelectedSavedQuiz] = useState<number | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const wsRef = useRef<any>(null)
  const maxRetries = 3

  useEffect(() => {
    loadSavedQuizzes()
    return () => wsRef.current?.close()
  }, [noteId])

  // Load all saved quizzes
  const loadSavedQuizzes = async () => {
    setLoading(true)
    try {
      const response = await api.notes.getQuizzes(noteId)
      if (response.success && response.data) {
        setSavedQuizzes(response.data)
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err)
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Generate Quiz
  const handleGenerateQuiz = async () => {
    setGenerating(true)
    setCurrentQuiz(null)
    setAnswers({})
    setResults(null)
    setSelectedSavedQuiz(null)
    setRetryCount(0)
    setGenerationError(null)

    await attemptGeneration()
  }

  const attemptGeneration = async () => {
    try {
      const response = await api.notes.generateQuiz(noteId)

      if (response.success && response.data?.task_id) {
        connectToTaskStream(response.data.task_id)
      }
    } catch (err) {
      console.error('Generation error:', err)
      handleGenerationError('Failed to start quiz generation')
    }
  }

  const handleGenerationError = (errorMessage: string) => {
    setGenerationError(errorMessage)

    if (retryCount < maxRetries) {
      const nextRetry = retryCount + 1
      setRetryCount(nextRetry)

      // Close existing WebSocket
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      // Retry with new API call after 2 seconds
      setTimeout(() => {
        if (generating) {
          console.log(`Retrying generation... (${nextRetry}/${maxRetries})`)
          attemptGeneration()
        }
      }, 2000)
    } else {
      setGenerating(false)
      setGenerationError(
        'Failed to generate quiz after 3 attempts. Please try again.'
      )
    }
  }

  const stopGeneration = () => {
    setGenerating(false)
    setRetryCount(0)
    setGenerationError(null)
    wsRef.current?.close()
  }

  // Step 2: WebSocket Connection
  const connectToTaskStream = (taskId: string) => {
    wsRef.current = createTaskStatusWebSocket(
      taskId,
      (message: any) => {
        if (message.state === 'SUCCESS' && message.result) {
          // Check for errors in result
          if (message.result.error) {
            console.error('Quiz generation error:', message.result.error)
            handleGenerationError(
              `Generation failed: ${message.result.error}`
            )
            return
          }

          const quiz: GeneratedQuiz = {
            quiz_id: String(message.result.quiz_id),
            questions: message.result.questions.map((q: any) => ({
              question_id: String(q.question_id),
              question: q.question,
              options: q.options, // Already in correct format {A: "text", B: "text"}
            })),
            total: String(message.result.total),
          }

          setCurrentQuiz(quiz)
          setGenerating(false)
          setRetryCount(0)
          setGenerationError(null)
          wsRef.current?.close()
          loadSavedQuizzes()
        } else if (message.state === 'FAILURE') {
          handleGenerationError(
            message.status || 'Quiz generation failed'
          )
        }
      },
      () => {
        handleGenerationError('WebSocket connection failed')
      }
    )
  }

  // Convert ["A. opt1", "B. opt2"] to {A: "opt1", B: "opt2"}
  const convertArrayToOptions = (
    options: string[] | Record<string, string>
  ): Record<string, string> => {
    // If already an object, return as-is
    if (typeof options === 'object' && !Array.isArray(options)) {
      return options
    }

    // Convert array format
    const result: Record<string, string> = {}
    options.forEach((opt: string) => {
      const letter = opt.charAt(0)
      const text = opt.substring(3)
      result[letter] = text
    })
    return result
  }

  // Step 3: Handle Answer Selection
  const handleAnswerSelect = (questionId: string, option: string) => {
    if (results) return // Already submitted

    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  // Step 4: Submit Quiz
  const handleSubmit = async () => {
    if (!currentQuiz) return

    const unanswered = currentQuiz.questions.filter(
      (q) => !answers[q.question_id]
    )
    if (unanswered.length > 0) {
      alert(`Please answer all questions (${unanswered.length} remaining)`)
      return
    }

    setSubmitting(true)

    try {
      const response = await api.notes.submitQuiz(
        parseInt(currentQuiz.quiz_id),
        answers
      )

      if (response.success && response.data) {
        // Backend returns results as object/dictionary, not array
        const resultsRecord: Record<string, QuizResult> = {}

        // Convert object to proper format
        Object.entries(response.data.results).forEach(([questionId, result]: [string, any]) => {
          resultsRecord[questionId] = {
            is_correct: result.is_correct,
            explanation: result.explanation || '',
          }
        })

        setResults({
          quiz_id: parseInt(currentQuiz.quiz_id),
          correct_count: response.data.correct_count,
          total_count: response.data.total_count,
          results: resultsRecord,
        })
        loadSavedQuizzes()
      }
    } catch (err) {
      console.error('Submission error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Step 5: Try Again
  const handleTryAgain = () => {
    setAnswers({})
    setResults(null)
  }

  // View saved quiz
  const viewSavedQuiz = (quiz: SavedQuiz) => {
    setSelectedSavedQuiz(quiz.id)
    setCurrentQuiz(null)
    setAnswers({})
    setResults(null)
  }

  // Get selected saved quiz
  const selectedQuiz = savedQuizzes.find(
    (q) => q.id === selectedSavedQuiz
  )

  // Calculate unanswered count
  const getUnansweredCount = () => {
    if (!currentQuiz) return 0
    return currentQuiz.questions.filter((q) => !answers[q.question_id])
      .length
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Knowledge Quiz
          </h2>
        </div>
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
              <Sparkles className="w-4 h-4" />
              Generate New Quiz
            </>
          )}
        </Button>
      </div>

      {/* Generating State */}
      {generating && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Creating Your Quiz
                </h3>
                <p className="text-gray-600 text-sm">
                  AI is analyzing your note and generating questions...
                </p>
              </div>
            </div>
            <Button
              onClick={stopGeneration}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
          </div>

          {generationError && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    {generationError}
                  </p>
                  {retryCount > 0 && retryCount <= maxRetries && (
                    <p className="text-xs text-amber-700 mt-1">
                      Retrying automatically... (Attempt {retryCount}/
                      {maxRetries})
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Quizzes List */}
      {!currentQuiz && savedQuizzes.length > 0 && !generating && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Previous Quizzes ({savedQuizzes.length})
          </h3>
          <div className="grid gap-3">
            {savedQuizzes.map((quiz, index) => (
              <button
                key={quiz.id}
                onClick={() => viewSavedQuiz(quiz)}
                className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Quiz {index + 1}
                      </p>
                      <p className="text-sm text-gray-500">
                        {quiz.submission
                          ? `Score: ${quiz.submission.score}/${quiz.submission.total}`
                          : 'Not submitted'}
                      </p>
                    </div>
                  </div>
                  {quiz.submission && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Quiz Display */}
      {currentQuiz && (
        <div className="space-y-6">
          {/* Results Summary */}
          {results && (
            <div
              className={`rounded-xl p-6 border-2 ${
                results.correct_count === results.total_count
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      results.correct_count === results.total_count
                        ? 'bg-green-200'
                        : 'bg-blue-200'
                    }`}
                  >
                    <span className="text-2xl font-bold text-gray-900">
                      {Math.round(
                        (results.correct_count / results.total_count) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {results.correct_count === results.total_count
                        ? 'Perfect Score! 🎉'
                        : 'Quiz Complete!'}
                    </h3>
                    <p className="text-gray-700">
                      {results.correct_count} out of {results.total_count}{' '}
                      correct
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
          )}

          {/* Questions */}
          <div className="space-y-6">
            {currentQuiz.questions.map((question, qIndex) => {
              const result = results?.results[question.question_id]
              const userAnswer = answers[question.question_id]

              return (
                <div
                  key={question.question_id}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm"
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold text-sm">
                        {qIndex + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-medium text-gray-900">
                        {question.question}
                      </p>
                      {result && (
                        <div className="mt-2 flex items-center gap-2">
                          {result.is_correct ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              result.is_correct
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}
                          >
                            {result.is_correct ? 'Correct!' : 'Incorrect'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 ml-11">
                    {Object.entries(question.options).map(
                      ([letter, text]) => {
                        const isSelected = userAnswer === letter
                        const isCorrect = result?.is_correct && isSelected
                        const isWrong = result && !result.is_correct && isSelected

                        return (
                          <button
                            key={letter}
                            onClick={() =>
                              handleAnswerSelect(
                                question.question_id,
                                letter
                              )
                            }
                            disabled={!!results}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              isCorrect
                                ? 'border-green-500 bg-green-50 font-medium'
                                : isWrong
                                ? 'border-red-500 bg-red-50 font-medium'
                                : isSelected
                                ? 'border-blue-500 bg-blue-50 font-medium'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            } ${results ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isCorrect
                                    ? 'bg-green-200 text-green-800'
                                    : isWrong
                                    ? 'bg-red-200 text-red-800'
                                    : isSelected
                                    ? 'bg-blue-200 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {letter}
                              </span>
                              <span
                                className={
                                  isCorrect || isWrong
                                    ? 'font-medium'
                                    : ''
                                }
                              >
                                {text}
                              </span>
                            </div>
                          </button>
                        )
                      }
                    )}
                  </div>

                  {/* Explanation */}
                  {result && !result.is_correct && result.explanation && (
                    <div className="mt-4 ml-11 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-900">
                        <strong>Explanation:</strong> {result.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Submit Button */}
          {!results && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {getUnansweredCount() === 0 ? (
                  <span className="text-green-600 font-medium">
                    ✓ All questions answered
                  </span>
                ) : (
                  `${getUnansweredCount()} question${
                    getUnansweredCount() > 1 ? 's' : ''
                  } remaining`
                )}
              </p>
              <Button
                onClick={handleSubmit}
                disabled={submitting || getUnansweredCount() > 0}
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
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Saved Quiz Display */}
      {selectedQuiz && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Quiz Results
            </h3>
            <Button
              onClick={() => setSelectedSavedQuiz(null)}
              variant="outline"
              size="sm"
            >
              Back to List
            </Button>
          </div>

          {selectedQuiz.submission && (
            <div className="rounded-xl p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      (selectedQuiz.submission.score /
                        selectedQuiz.submission.total) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Final Score
                  </h3>
                  <p className="text-gray-700">
                    {selectedQuiz.submission.score} out of{' '}
                    {selectedQuiz.submission.total} correct
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {selectedQuiz.questions.map((question, qIndex) => (
              <div
                key={question.id}
                className="bg-white rounded-xl border-2 border-gray-200 p-6"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">
                      {qIndex + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-900">
                      {question.question_text}
                    </p>
                    {question.is_correct !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        {question.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            question.is_correct
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}
                        >
                          {question.is_correct
                            ? 'Correct!'
                            : 'Incorrect'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 ml-11">
                  {question.options.map((option) => {
                    const letter = option.charAt(0)
                    const isUserAnswer = question.user_answer === option
                    const isCorrect =
                      question.is_correct && isUserAnswer

                    return (
                      <div
                        key={option}
                        className={`p-4 rounded-lg border-2 ${
                          isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isUserAnswer
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isCorrect
                                ? 'bg-green-200 text-green-800'
                                : isUserAnswer
                                ? 'bg-red-200 text-red-800'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {letter}
                          </span>
                          <span>{option.substring(3)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentQuiz &&
        !generating &&
        savedQuizzes.length === 0 &&
        !selectedSavedQuiz && (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Quizzes Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Generate your first quiz to test your knowledge!
            </p>
          </div>
        )}
    </div>
  )
}