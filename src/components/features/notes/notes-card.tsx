// src/components/features/notes/notes-card.tsx
'use client'
import { useState, useEffect } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { formatDistanceToNow } from 'date-fns'
import {
    MoreVertical, Edit, Trash, Hash, Eye,
    Sparkles, Brain, MessageCircle, FileText
} from 'lucide-react'
import type { Note } from '@/types/notes'

interface NoteCardProps {
    note: Note
    onClick?: (note: Note) => void
}

export function NoteCard({ note, onClick }: NoteCardProps) {
    const {
        deleteNote,
        selectNote,
        notesMetadata,
        fetchNoteMetadata
    } = useNotesStore()
    const [showMenu, setShowMenu] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const metadata = notesMetadata.get(note.id)

    useEffect(() => {
        fetchNoteMetadata(note.id)

    }, [note.id])

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!window.confirm(`Delete "${note.title}"?`)) return
        setIsDeleting(true)
        try {
            await deleteNote(note.id)
        } catch {
            alert('Failed to delete note')
            setIsDeleting(false)
        }
        setShowMenu(false)
    }

    const truncateContent = (content: string, max = 150) => {
        return content.length <= max
            ? content
            : content.substring(0, max).trim() + '...'
    }

    if (isDeleting) {
        return (
            <div className="bg-white border rounded-lg p-6 h-64 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Deleting...</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex flex-col h-64"
            onClick={() => onClick?.(note)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 pr-2">
                    {note.title}
                </h3>
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowMenu(!showMenu)
                        }}
                        className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-8 w-48 bg-white border rounded-lg shadow-lg z-10 py-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    selectNote(note)
                                    setShowMenu(false)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onClick?.(note)
                                    setShowMenu(false)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                            </button>
                            <div className="border-t" />
                            <button
                                onClick={handleDelete}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                {truncateContent(note.content)}
            </p>

            {/* Tags */}
            {note.tags?.length > 0 && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Hash className="w-3 h-3 text-gray-400" />
                    {note.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                    {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
                    )}
                </div>
            )}

            {/* Activity Badges */}
            {metadata && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {metadata.enhanced_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full border border-purple-200">
                            <Sparkles className="w-3 h-3" />
                            <span>{metadata.enhanced_count}</span>
                        </div>
                    )}
                    {metadata.summary_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full border border-blue-200">
                            <FileText className="w-3 h-3" />
                            <span>{metadata.summary_count}</span>
                        </div>
                    )}
                    {metadata.quiz_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                            <Brain className="w-3 h-3" />
                            <span>{metadata.quiz_count}</span>
                        </div>
                    )}
                    {metadata.question_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full border border-orange-200">
                            <MessageCircle className="w-3 h-3" />
                            <span>{metadata.question_count}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                <span>{note.words_count} words</span>
            </div>
        </div>
    )
}