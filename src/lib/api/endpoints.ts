// src/lib/api/endpoints.ts
import { apiClient } from './client'
import type {
    RegisterData,
    AuthResponse,
    Token,
    User,
} from '@/types/auth'
import type {
    Note,
    NoteCreate,
    NoteMeta,
    NoteUpdate,
    NotesQuery,
    TaskResponse,
} from '@/types/notes'
import type { Quiz, QuizAnswers, QuizSubmitResponse } from '@/types/quiz'
import type { SavedSummary } from '@/types/summary'
import type { Question } from '@/types/questions'
import type { EnhancedNote } from '@/types/notes'
import { BlogQuery, BlogCategory, BlogCommentCreate, BlogCommentResponse, BlogPost, BlogPostCreate, BlogPostUpdate, BlogListResponse } from '@/types/blog'

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

        getEnhanced: (noteId: number) =>
            apiClient.get<EnhancedNote[]>(`/notes/${noteId}/enhanced`),

        generateQuiz: (noteId: number) =>
            apiClient.post<{ task_id: string }>(`/notes/${noteId}/quiz/generate`),

        getQuizzes: (noteId: number) =>
            apiClient.get<Quiz[]>(`/notes/${noteId}/quiz`),

        submitQuiz: (quizId: number, answers: QuizAnswers) =>
            apiClient.post<QuizSubmitResponse>('/notes/quiz/submit', {
                quiz_id: quizId,
                answers
            }),
        summaries: (noteId: number) =>
            apiClient.get<SavedSummary[]>(`/notes/summaries/${noteId}`),

        metadata: (id: number) =>
            apiClient.get<NoteMeta>(`/notes/${id}/metadata`),


    },
    questions: {
        list: (noteId: number) =>
            apiClient.get<Question[]>(`/notes/${noteId}/questions`),
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

        ask: (noteId: number, questionText: string) =>
            apiClient.post('/ollama/ask', { note_id: noteId, question_text: questionText }),
    },

    // Tasks
    tasks: {
        status: (taskId: string) => apiClient.get(`/users/task_status/?task_id=${taskId}`),
    },
    // Blog API Endpoints
    // src/lib/api/endpoints.ts
    blog: {
        // GET /blog/posts
        list: (params: BlogQuery = {}) => {
            const searchParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value))
                }
            })
            return apiClient.get<BlogListResponse>(`/blog/posts?${searchParams.toString()}`)
        },

        // POST /blog/posts
        create: (data: BlogPostCreate) =>
            apiClient.post<BlogPost>(`/blog/posts`, data),

        // GET /blog/posts/{post_id}
        getById: (id: number, query: { increment_view?: boolean } = {}) => {
            const searchParams = new URLSearchParams()
            if (query.increment_view !== undefined) {
                searchParams.append('increment_view', String(query.increment_view))
            }
            return apiClient.get<BlogPost>(
                `/blog/posts/${id}?${searchParams.toString()}`
            )
        },

        // GET /blog/posts/slug/{slug}
        getBySlug: (slug: string, query: { increment_view?: boolean } = {}) => {
            const searchParams = new URLSearchParams()
            if (query.increment_view !== undefined) {
                searchParams.append('increment_view', String(query.increment_view))
            }
            return apiClient.get<BlogPost>(
                `/blog/posts/slug/${slug}?${searchParams.toString()}`
            )
        },

        // PUT /blog/posts/{id}
        update: (id: number, data: BlogPostUpdate) =>
            apiClient.put<BlogPost>(`/blog/posts/${id}`, data),

        // DELETE /blog/posts/{id}
        delete: (id: number) => apiClient.delete(`/blog/posts/${id}`),

        // GET /blog/categories
        categories: () => apiClient.get<BlogCategory[]>(`/blog/categories`),

        // POST /blog/posts/{id}/comments
        addComment: (postId: number, data: BlogCommentCreate) =>
            apiClient.post<BlogCommentResponse>(`/blog/posts/${postId}/comments`, data),

    },


}