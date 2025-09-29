// src/types/auth.ts
export interface User {
    id: number
    email: string
    first_name?: string
    last_name?: string
    phone?: string
    full_name: string
    is_active: boolean
    is_verified: boolean
    created_at: string
    updated_at: string
}

export interface LoginData {
    username: string // email
    password: string
}

export interface RegisterData {
    email: string
    password: string
    first_name?: string
    last_name?: string
    phone?: string
}

export interface Token {
    access_token: string
    refresh_token: string
    token_type: 'bearer'
}

export interface AuthResponse {
    user: User
    token: Token
}

export interface RefreshRequest {
    refresh_token: string
}