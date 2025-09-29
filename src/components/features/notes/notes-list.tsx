// src/components/features/notes/notes-list.tsx
'use client'
import { useEffect } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { NoteCard } from './notes-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'

interface NotesListProps {
    onCreateNote: () => void
}

export function NotesList({ onCreateNote }: NotesListProps) {
    const { notes, loading, error, query, fetchNotes, setQuery, clearError } = useNotesStore()

    useEffect(() => {
        fetchNotes()
    }, [])

    const handleSearch = (search: string) => {
        setQuery({ search, page: 1 })
        fetchNotes({ search, page: 1 })
    }

    if (loading && notes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Notes</h1>
                <Button onClick={onCreateNote}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Note
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Search notes..."
                    className="pl-10"
                    defaultValue={query.search}
                    onChange={(e) => {
                        const value = e.target.value
                        setTimeout(() => handleSearch(value), 300)
                    }}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={clearError}
                        className="ml-2"
                    >
                        Dismiss
                    </Button>
                </div>
            )}

            {/* Notes Grid */}
            {notes.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No notes found</p>
                    <Button onClick={onCreateNote}>Create your first note</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {notes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                    ))}
                </div>
            )}

            {/* Loading more */}
            {loading && notes.length > 0 && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    )
}