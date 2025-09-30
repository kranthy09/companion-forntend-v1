// src/lib/api/endpoints.ts
import { apiClient } from './client'
import type {
    LoginData,
    RegisterData,
    AuthResponse,
    Token,
    User,
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
        login: (data: { username: string; password: string }) =>
            apiClient.post<Token>('/auth/login', data, {}, true),

        register: (data: RegisterData) =>
            apiClient.post<AuthResponse>('/auth/register', data, {}, true),

        logout: () => apiClient.post('/auth/logout'),

        session: () => apiClient.get<{ authenticated: boolean; user?: User }>('/auth/session'),
    },

    // User Profile
    users: {
        profile: () => apiClient.get<User>('/users/profile'),
    },

    // Notes - Fixed endpoints
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

        stats: () => apiClient.get('/notes/stats'),
    },

    // AI/Ollama
    ollama: {
        health: () => apiClient.get('/ollama/health'),

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
        status: (taskId: string) => apiClient.get(`/users/task_status/?task_id=${taskId}`),
    },
}