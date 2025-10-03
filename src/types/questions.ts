// src/types/questions.ts

export interface Question {
    id: number
    note_id: number
    question_text: string
    answer: string
    created_at: string
}

export interface AskQuestionRequest {
    note_id: number
    question_text: string
}

export interface QuestionStreamChunk {
    chunk?: string
    done?: boolean
    full_answer?: string
    error?: string
}