// src/lib/api/endpoints.ts
import { apiClient } from './client'
import type {
    LoginData,
    RegisterData,
    AuthResponse,
    Token,
    User,
    RefreshRequest,
} from '@/types/auth'
import type {
    Note,
    NoteCreate,
    NoteUpdate,
    NotesQuery,
    TaskResponse,
} from '@/types/notes'
import type { APIResponse, TaskStatus } from '@/types/api'

export const api = {
    // Authentication
    auth: {
        login: (data: LoginData) =>
            apiClient.post<Token>('/auth/login', data, {}, true),

        register: (data: RegisterData) =>
            apiClient.post<AuthResponse>('/auth/register', data, {}, true),

        refresh: (data: RefreshRequest) =>
            apiClient.post<Token>('/auth/refresh', data),

        logout: () => apiClient.post('/auth/logout'),

        session: () => apiClient.get<{ authenticated: boolean; user?: User }>('/auth/session'),
    },

    // User Profile
    user: {
        profile: () => apiClient.get<User>('/users/profile'),
    },

    // Notes
    notes: {
        list: (params: NotesQuery = {}) => {
            const searchParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (Array.isArray(value)) {
                        value.forEach(v => searchParams.append(key, v))
                    } else {
                        searchParams.append(key, String(value))
                    }
                }
            })
            return apiClient.get<Note[]>(`/notes/?${searchParams}`)
        },

        get: (id: number) => apiClient.get<Note>(`/notes/${id}`),

        create: (data: NoteCreate) => apiClient.post<Note>('/notes/', data),

        update: (id: number, data: NoteUpdate) =>
            apiClient.put<Note>(`/notes/${id}`, data),

        delete: (id: number) => apiClient.delete(`/notes/${id}`),

        stats: () => apiClient.get<{
            total_notes: number
            total_words: number
            content_types: Record<string, number>
            unique_tags: string[]
            tags_count: number
        }>('/notes/stats/summary'),
    },

    // AI/Ollama
    ollama: {
        health: () => apiClient.get<{ status: string; available: boolean }>('/ollama/health'),

        enhance: (noteId: number) =>
            apiClient.post<TaskResponse>('/ollama/enhance', { note_id: noteId }),

        summarize: (noteId: number) =>
            apiClient.post<TaskResponse>('/ollama/summarize', { note_id: noteId }),

        enhanceStream: (noteId: number) =>
            apiClient.post<TaskResponse>('/ollama/enhance/stream', { note_id: noteId }),

        summarizeStream: (noteId: number) =>
            apiClient.post<TaskResponse>('/ollama/summarize/stream', { note_id: noteId }),
    },

    // Tasks
    tasks: {
        list: (status?: string, limit = 50) => {
            const params = new URLSearchParams({ limit: String(limit) })
            if (status) params.append('status', status)
            return apiClient.get<{ tasks: any[]; total: number }>(`/tasks/?${params}`)
        },

        get: (taskId: string) => apiClient.get<TaskStatus>(`/tasks/${taskId}`),

        cancel: (taskId: string) => apiClient.delete(`/tasks/${taskId}`),
    },
}