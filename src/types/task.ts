// src/types/task.ts

export interface TaskStatusMessage {
    state: 'PENDING' | 'STARTED' | 'PROGRESS' | 'SUCCESS' | 'FAILURE'
    current?: number
    total?: number
    status?: string
    result?: TaskResult
}

export interface TaskResult {
    quiz_id: number
    questions: QuizQuestionData[]
    total: number
}

export interface QuizQuestionData {
    id: number
    question_text: string
    options: string[]
    correct_answer: string
    explanation?: string
}

export interface QuizSubmitData {
    quiz_id: number
    answers: Record<number, string>
}