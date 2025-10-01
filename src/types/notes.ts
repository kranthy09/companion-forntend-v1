// src/types/notes.ts
export interface Note {
    id: number
    user_id: number
    title: string
    content: string
    content_type: 'text' | 'markdown' | 'html'
    tags: string[]
    words_count: number
    ai_summary?: string
    ai_enhanced_content?: string | null
    has_ai_summary: boolean
    has_ai_enhancement: boolean
    created_at: string
    updated_at: string
}

export interface NoteCreate {
    title: string
    content: string
    content_type?: 'text' | 'markdown' | 'html'
    tags?: string[]
}

export interface NoteUpdate {
    title?: string
    content?: string
    content_type?: 'text' | 'markdown' | 'html'
    tags?: string[]
}

export interface NotesQuery {
    search?: string
    tags?: string[]
    content_type?: string
    page?: number
    page_size?: number
    sort_by?: 'created_at' | 'updated_at' | 'title'
    sort_order?: 'asc' | 'desc'
}

export interface TaskResponse {
    task_id: string
    note_id: number
    streaming: boolean
    message: string
    stream_channel?: string
    ws_url?: string
}