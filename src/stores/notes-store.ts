// src/stores/notes-store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { api } from '@/lib/api/endpoints'
import type { Note, NoteCreate, NoteUpdate, NotesQuery } from '@/types/notes'

interface NotesState {
    notes: Note[]
    selectedNote: Note | null
    loading: boolean
    error: string | null
    query: NotesQuery
}

interface NotesActions {
    fetchNotes: (query?: NotesQuery) => Promise<void>
    createNote: (data: NoteCreate) => Promise<Note | null>
    updateNote: (id: number, data: NoteUpdate) => Promise<void>
    deleteNote: (id: number) => Promise<void>
    selectNote: (note: Note | null) => void
    setQuery: (query: Partial<NotesQuery>) => void
    clearError: () => void
}

export const useNotesStore = create<NotesState & NotesActions>()(
    immer((set, get) => ({
        // State
        notes: [],
        selectedNote: null,
        loading: false,
        error: null,
        query: { page: 1, page_size: 20 },

        // Actions
        fetchNotes: async (newQuery) => {
            set((state) => {
                state.loading = true
                state.error = null
                if (newQuery) state.query = { ...state.query, ...newQuery }
            })

            try {
                const response = await api.notes.list(get().query)
                set((state) => {
                    state.notes = response.data || []
                    state.loading = false
                })
            } catch (error: any) {
                set((state) => {
                    state.error = error.message
                    state.loading = false
                })
            }
        },

        createNote: async (data) => {
            try {
                const response = await api.notes.create(data)
                if (response.success && response.data) {
                    set((state) => {
                        state.notes.unshift(response.data!)
                    })
                    return response.data
                }
                return null
            } catch (error: any) {
                set((state) => {
                    state.error = error.message
                })
                return null
            }
        },

        updateNote: async (id, data) => {
            try {
                const response = await api.notes.update(id, data)
                if (response.success && response.data) {
                    set((state) => {
                        const index = state.notes.findIndex(n => n.id === id)
                        if (index !== -1) {
                            state.notes[index] = response.data!
                        }
                        if (state.selectedNote?.id === id) {
                            state.selectedNote = response.data!
                        }
                    })
                }
            } catch (error: any) {
                set((state) => {
                    state.error = error.message
                })
            }
        },

        deleteNote: async (id) => {
            try {
                await api.notes.delete(id)
                set((state) => {
                    state.notes = state.notes.filter(n => n.id !== id)
                    if (state.selectedNote?.id === id) {
                        state.selectedNote = null
                    }
                })
            } catch (error: any) {
                set((state) => {
                    state.error = error.message
                })
            }
        },

        selectNote: (note) => {
            set((state) => {
                state.selectedNote = note
            })
        },

        setQuery: (newQuery) => {
            set((state) => {
                state.query = { ...state.query, ...newQuery }
            })
        },

        clearError: () => {
            set((state) => {
                state.error = null
            })
        },
    }))
)