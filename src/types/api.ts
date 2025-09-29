// src/types/api.ts
export interface APIResponse<T = any> {
    success: boolean
    data?: T
    message?: string
    error?: {
        code: string
        message: string
        field?: string
    }
    meta?: {
        pagination?: {
            page: number
            page_size: number
            total: number
            total_pages: number
        }
        [key: string]: any
    }
    timestamp: string
}

export interface PaginationParams {
    page?: number
    page_size?: number
}

export interface TaskStatus {
    state: 'pending' | 'running' | 'success' | 'failed'
    result?: any
    error?: string
}

// Error codes from backend
export enum ErrorCode {
    INVALID_CREDENTIALS = 'AUTH_001',
    TOKEN_EXPIRED = 'AUTH_002',
    TOKEN_INVALID = 'AUTH_003',
    ACCOUNT_INACTIVE = 'AUTH_005',
    NOTE_NOT_FOUND = 'NOTE_001',
    OLLAMA_UNAVAILABLE = 'AI_001',
    RATE_LIMIT_EXCEEDED = 'RATE_001',
    INTERNAL_ERROR = 'SYS_001',
}

export class APIError extends Error {
    constructor(
        public code: string,
        message: string,
        public status: number,
        public field?: string
    ) {
        super(message)
        this.name = 'APIError'
    }
}