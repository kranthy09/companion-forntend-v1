// src/components/features/notes/notes-card.tsx
'use client'
import { useState } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { formatDistanceToNow } from 'date-fns'
import { MoreVertical, Edit, Trash, Sparkles, Hash, Eye } from 'lucide-react'
import type { Note } from '@/types/notes'

interface NoteCardProps {
    note: Note
    onClick?: (note: Note) => void
}

export function NoteCard({ note, onClick }: NoteCardProps) {
    const { deleteNote, selectNote } = useNotesStore()
    const [showMenu, setShowMenu] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()

        const confirmed = window.confirm(
            `Are you sure you want to delete "${note.title}"?`
        )

        if (confirmed) {
            setIsDeleting(true)
            try {
                await deleteNote(note.id)
            } catch (error) {
                console.error('Failed to delete note:', error)
                alert('Failed to delete note. Please try again.')
                setIsDeleting(false)
            }
        }
        setShowMenu(false)
    }

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        selectNote(note)
        setShowMenu(false)
    }

    const handleCardClick = () => {
        if (onClick) {
            onClick(note)
        }
    }

    const truncateContent = (content: string, maxLength = 150) => {
        if (content.length <= maxLength) return content
        return content.substring(0, maxLength).trim() + '...'
    }

    const getContentTypeColor = (type: string) => {
        switch (type) {
            case 'markdown':
                return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'html':
                return 'bg-orange-100 text-orange-700 border-orange-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    if (isDeleting) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 h-64 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Deleting...</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer relative group h-64 flex flex-col"
            onClick={handleCardClick}
        >
            {/* Header with Menu */}
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg line-clamp-2 text-gray-900 flex-1 pr-2">
                    {note.title}
                </h3>

                <div className="relative flex-shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowMenu(!showMenu)
                        }}
                        className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {showMenu && (
                        <>
                            {/* Backdrop to close menu */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowMenu(false)
                                }}
                            />

                            {/* Menu */}
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-20 w-40 overflow-hidden">
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (onClick) onClick(note)
                                        setShowMenu(false)
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                </button>
                                <div className="border-t border-gray-200"></div>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content Preview */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-4 flex-1">
                {truncateContent(note.content, 150)}
            </p>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Hash className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <div className="flex gap-1 flex-wrap">
                        {note.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                            >
                                {tag}
                            </span>
                        ))}
                        {note.tags.length > 3 && (
                            <span className="inline-block px-2 py-0.5 text-xs text-gray-500">
                                +{note.tags.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <span className="font-medium">{note.words_count} words</span>
                    <span
                        className={`px-2 py-0.5 rounded-full text-xs border ${getContentTypeColor(note.content_type)}`}
                    >
                        {note.content_type}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {(note.has_ai_enhancement || note.has_ai_summary) && (
                        <Sparkles className="w-3 h-3 text-purple-500" />
                    )}
                    <span>{formatDistanceToNow(new Date(note.updated_at))} ago</span>
                </div>
            </div>
        </div>
    )
}