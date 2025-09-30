// src/components/features/notes/notes-list.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotesStore } from '@/stores/notes-store'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NoteCard } from './notes-card'
import {
    Plus,
    Search,
    Filter,
    SortAsc,
    SortDesc,
    Loader2,
    FileText
} from 'lucide-react'

interface NotesListProps {
    onCreateNote: () => void
}

export function NotesList({ onCreateNote }: NotesListProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isAuthenticated } = useAuthContext()
    const { notes, loading, fetchNotes, query, setQuery } = useNotesStore()

    const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            const initialQuery = {
                search: searchParams?.get('search') || undefined,
                page: 1,
                page_size: 20,
                sort_by: 'updated_at' as const,
                sort_order: 'desc' as const,
            }
            fetchNotes(initialQuery)
        }
    }, [isAuthenticated, searchParams])

    const handleSearch = () => {
        const newQuery = {
            ...query,
            search: searchInput.trim() || undefined,
            page: 1,
        }
        setQuery(newQuery)
        fetchNotes(newQuery)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const handleSortChange = () => {
        const newOrder = query.sort_order === 'desc' ? 'asc' : 'desc'
        const newQuery = {
            ...query,
            sort_order: newOrder as 'asc' | 'desc',
        }
        setQuery(newQuery)
        fetchNotes(newQuery)
    }

    const handleNoteClick = (noteId: number) => {
        router.push(`/notes/${noteId}`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All Notes</h1>
                    <p className="text-gray-600 mt-1">
                        {notes.length} {notes.length === 1 ? 'note' : 'notes'} total
                    </p>
                </div>
                <Button onClick={onCreateNote} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-5 h-5 mr-2" />
                    New Note
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Search notes by title or content..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="pl-10"
                        />
                    </div>

                    <Button
                        variant="secondary"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Search'
                        )}
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={handleSortChange}
                        title={`Sort ${query.sort_order === 'desc' ? 'ascending' : 'descending'}`}
                    >
                        {query.sort_order === 'desc' ? (
                            <SortDesc className="w-4 h-4" />
                        ) : (
                            <SortAsc className="w-4 h-4" />
                        )}
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort By
                                </label>
                                <select
                                    value={query.sort_by || 'updated_at'}
                                    onChange={(e) => {
                                        const newQuery = {
                                            ...query,
                                            sort_by: e.target.value as 'created_at' | 'updated_at' | 'title',
                                        }
                                        setQuery(newQuery)
                                        fetchNotes(newQuery)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="updated_at">Last Updated</option>
                                    <option value="created_at">Date Created</option>
                                    <option value="title">Title</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Content Type
                                </label>
                                <select
                                    value={query.content_type || 'all'}
                                    onChange={(e) => {
                                        const newQuery = {
                                            ...query,
                                            content_type: e.target.value === 'all' ? undefined : e.target.value,
                                        }
                                        setQuery(newQuery)
                                        fetchNotes(newQuery)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="all">All Types</option>
                                    <option value="text">Text</option>
                                    <option value="markdown">Markdown</option>
                                    <option value="html">HTML</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setSearchInput('')
                                        const resetQuery = {
                                            page: 1,
                                            page_size: 20,
                                            sort_by: 'updated_at' as const,
                                            sort_order: 'desc' as const,
                                        }
                                        setQuery(resetQuery)
                                        fetchNotes(resetQuery)
                                    }}
                                    className="w-full"
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notes Grid */}
            {loading && notes.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading notes...</p>
                    </div>
                </div>
            ) : notes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {searchInput ? 'No notes found' : 'No notes yet'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {searchInput
                            ? 'Try adjusting your search terms or filters'
                            : 'Start capturing your ideas by creating your first note'
                        }
                    </p>
                    <Button onClick={onCreateNote}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Note
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {notes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onClick={() => handleNoteClick(note.id)}
                            />
                        ))}
                    </div>

                    {/* Loading indicator for additional notes */}
                    {loading && notes.length > 0 && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    )}
                </>
            )}
        </div>
    )
}