// src/app/notes/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useNotesStore } from '@/stores/notes-store'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
    Edit,
    Trash,
    Sparkles,
    Calendar,
    Hash,
    FileText
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { NoteEditor } from '@/components/features/notes/notes-editor'
import type { Note } from '@/types/notes'
import { api } from '@/lib/api/endpoints'

export default function NoteDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { isAuthenticated, loading: authLoading } = useAuthContext()
    const { selectNote, deleteNote, selectedNote } = useNotesStore()

    const [note, setNote] = useState<Note | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showEditor, setShowEditor] = useState(false)

    const noteId = params?.id ? parseInt(params.id as string) : null

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, authLoading, router])

    useEffect(() => {
        if (isAuthenticated && noteId) {
            fetchNote()
        }
    }, [isAuthenticated, noteId])

    const fetchNote = async () => {
        if (!noteId) return

        setLoading(true)
        setError(null)

        try {
            const response = await api.notes.get(noteId)
            if (response.success && response.data) {
                setNote(response.data)
            } else {
                setError('Failed to load note')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load note')
            console.error('Error fetching note:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = () => {
        if (note) {
            selectNote(note)
            setShowEditor(true)
        }
    }

    const handleCloseEditor = async () => {
        setShowEditor(false)
        selectNote(null)
        // Refresh the note after editing
        await fetchNote()
    }

    const handleDelete = async () => {
        if (!note) return

        const confirmed = window.confirm(
            'Are you sure you want to delete this note? This action cannot be undone.'
        )

        if (confirmed) {
            try {
                await deleteNote(note.id)
                router.push('/notes')
            } catch (err) {
                alert('Failed to delete note')
            }
        }
    }

    const handleBack = () => {
        router.back()
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error || !note) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Note not found
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {error || 'The note you are looking for does not exist'}
                    </p>
                    <Button onClick={() => router.push('/notes')}>
                        Back to Notes
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="primary"
                        onClick={handleBack}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Notes
                    </Button>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h1 className="text-3xl font-bold text-gray-900 flex-1">
                                {note.title}
                            </h1>
                            <div className="flex gap-2 ml-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleEdit}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>
                                    Created {format(new Date(note.created_at), 'MMM d, yyyy')}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>
                                    Updated {formatDistanceToNow(new Date(note.updated_at))} ago
                                </span>
                            </div>
                            <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                <span>{note.words_count} words</span>
                            </div>
                        </div>

                        {/* Tags */}
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-200">
                                <Hash className="w-4 h-4 mt-1 text-gray-400" />
                                <div className="flex flex-wrap gap-2">
                                    {note.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <div className="prose prose-lg max-w-none">
                        <div
                            className="whitespace-pre-wrap text-gray-800 leading-relaxed"
                            style={{
                                fontFamily: 'Georgia, serif',
                                fontSize: '1.125rem',
                                lineHeight: '1.75'
                            }}
                        >
                            {note.content}
                        </div>
                    </div>
                </div>

                {/* AI Enhancement Section */}
                {(note.has_ai_enhancement || note.has_ai_summary) && (
                    <div className="mt-6 space-y-4">
                        {note.ai_enhanced_content && (
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
                                <div className="flex items-center mb-4">
                                    <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        AI Enhanced Version
                                    </h3>
                                </div>
                                <div className="prose prose-lg max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-800">
                                        {note.ai_enhanced_content}
                                    </div>
                                </div>
                            </div>
                        )}

                        {note.ai_summary && (
                            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200 p-6">
                                <div className="flex items-center mb-4">
                                    <Sparkles className="w-5 h-5 text-green-600 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        AI Summary
                                    </h3>
                                </div>
                                <p className="text-gray-800 leading-relaxed">
                                    {note.ai_summary}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {showEditor && <NoteEditor onClose={handleCloseEditor} />}
        </div>
    )
}