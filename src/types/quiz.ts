// src/types/quiz.ts

export interface QuizQuestion {
    id: number
    question_text: string
    options: string[]
    user_answer?: string
    is_correct?: boolean
}

export interface QuizSubmission {
    score: number
    total: number
    submitted_at: string
}

export interface Quiz {
    id: number
    note_id: number
    created_at: string
    questions: QuizQuestion[]
    submission: QuizSubmission | null
}

export interface QuizAnswers {
    [questionId: number]: string
}

export interface QuizResult {
    question_id: number
    is_correct: boolean
    correct_answer: string
    user_answer: string
    explanation: string | null
}

export interface QuizSubmitResponse {
    correct_count: number
    total_count: number
    results: QuizResult[]
}