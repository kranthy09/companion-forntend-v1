// src/app/notes/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useNotesStore } from '@/stores/notes-store'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useNoteStreaming } from '@/hooks/useNoteStreaming'
import { Button } from '@/components/ui/button'
import { StreamingDisplay } from '@/components/features/notes/streaming-display'
import { EnhancedContentDisplay } from '@/components/features/notes/enhanced-content-display'
import {
    ArrowLeft,
    Edit,
    Trash,
    Sparkles,
    Calendar,
    Hash,
    Loader2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { NoteEditor } from '@/components/features/notes/notes-editor'
import type { Note } from '@/types/notes'
import { api } from '@/lib/api/endpoints'
import { QuestionAnswer } from '@/components/features/notes/question-answer'


export default function NoteDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { isAuthenticated, loading: authLoading } = useAuthContext()
    const { selectNote, deleteNote } = useNotesStore()

    const [note, setNote] = useState<Note | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showEditor, setShowEditor] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const noteId = params?.id ? parseInt(params.id as string) : 0

    const {
        isStreaming,
        content,
        error: streamError,
        taskId,
        startStream,
        stopStream,
        clearContent,
    } = useNoteStreaming(noteId, {
        onChunk: (chunk) => {
            console.log('Chunk:', chunk, new Date().toISOString())
        },
        onComplete: (fullText, id) => {
            console.log('✅ Complete:', fullText.length, 'chars', id)
            // Poll backend until enhanced content is saved
            pollForEnhancedContent()
        },
        onError: (err) => {
            console.error('❌ Error:', err)
        },
    })

    const pollForEnhancedContent = async () => {
        let attempts = 0
        const maxAttempts = 10
        const interval = 1000 // 1 second

        const poll = async () => {
            attempts++
            const response = await api.notes.get(noteId)

            if (response.success && response.data?.ai_enhanced_content) {
                // Enhanced content saved!
                setNote(response.data)
                clearContent() // Clear streaming display
                return
            }

            if (attempts < maxAttempts) {
                setTimeout(poll, interval)
            } else {
                console.warn('Enhanced content not saved after', maxAttempts, 'attempts')
                // Keep streamed content visible as fallback
            }
        }

        poll()
    }

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
        await fetchNote()
    }

    const handleDelete = async () => {
        if (!note) return

        if (!confirm('Delete this note? This cannot be undone.')) return

        setDeleting(true)
        try {
            await deleteNote(note.id)
            router.push('/notes')
        } catch (err: any) {
            alert(err.message || 'Failed to delete note')
        } finally {
            setDeleting(false)
        }
    }

    const handleEnhance = async () => {
        clearContent() // Clear previous stream
        await startStream()
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        )
    }

    if (error || !note) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Note not found'}</p>
                    <Button onClick={() => router.push('/notes')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Notes
                    </Button>
                </div>
            </div>
        )
    }

    if (showEditor) {
        return <NoteEditor onClose={handleCloseEditor} />
    }

    const hasEnhancedContent = !!note.ai_enhanced_content

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {note.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                            </span>
                            {note.tags && note.tags.length > 0 && (
                                <span className="flex items-center gap-1">
                                    <Hash className="w-4 h-4" />
                                    {note.tags.join(', ')}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleEdit}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Trash className="w-4 h-4 mr-2" />
                            )}
                            Delete
                        </Button>
                    </div>
                </div>
            </div>

            {/* Original Note Content */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Original Note
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="prose max-w-none">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {note.content}
                        </p>
                    </div>
                </div>
            </div>

            {/* Saved Enhanced Content (if exists) */}
            {hasEnhancedContent && (
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Enhanced Version
                    </h2>
                    <EnhancedContentDisplay content={note.ai_enhanced_content!} />
                </div>
            )}

            {/* AI Enhancement Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            AI Enhancement
                        </h2>
                    </div>

                    <Button
                        onClick={isStreaming ? stopStream : handleEnhance}
                        disabled={isStreaming && !content}
                        variant={isStreaming ? 'outline' : 'ghost'}
                        size="sm"
                    >
                        {isStreaming ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Stop
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                {hasEnhancedContent ? 'Re-enhance' : 'Enhance with AI'}
                            </>
                        )}
                    </Button>
                </div>

                {/* Live Streaming Display */}
                <StreamingDisplay
                    isStreaming={isStreaming}
                    content={content}
                    error={streamError}
                    taskId={taskId}
                    onStop={stopStream}
                    onClear={clearContent}
                />

                {!isStreaming && !content && !streamError && (
                    <p className="text-sm text-gray-600">
                        {hasEnhancedContent
                            ? 'Click "Re-enhance" to generate a new enhanced version.'
                            : 'Click "Enhance with AI" to improve your note with AI-powered suggestions.'}
                    </p>
                )}
            </div>
            {/* Questions & Answers Section */}
            <div className="mt-6">
                <QuestionAnswer noteId={noteId} />
            </div>

            {/* Metadata */}
            <div className="mt-6 text-xs text-gray-500 flex items-center gap-4">
                <span>Created: {format(new Date(note.created_at), 'PPpp')}</span>
                <span>Modified: {format(new Date(note.updated_at), 'PPpp')}</span>
            </div>
        </div>
    )
}