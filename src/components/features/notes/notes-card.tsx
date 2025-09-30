// src/components/features/notes/note-card.tsx
'use client'
import { useState } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { formatDistanceToNow } from 'date-fns'
import { MoreVertical, Edit, Trash, Sparkles } from 'lucide-react'
import type { Note } from '@/types/notes'

interface NoteCardProps {
    note: Note
    onClick?: (note: Note) => void
}

export function NoteCard({ note, onClick }: NoteCardProps) {
    const { deleteNote, selectNote } = useNotesStore()
    const [showMenu, setShowMenu] = useState(false)

    const handleDelete = async () => {
        if (confirm('Delete this note?')) {
            await deleteNote(note.id)
        }
        setShowMenu(false)
    }

    const handleEdit = () => {
        if (onClick) {
            onClick(note)
        } else {
            selectNote(note)
        }
        setShowMenu(false)
    }

    const handleCardClick = () => {
        if (onClick) {
            onClick(note)
        }
    }

    const truncateContent = (content: string, maxLength = 150) => {
        return content.length > maxLength
            ? content.substring(0, maxLength) + '...'
            : content
    }

    return (
        <div
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow relative cursor-pointer"
            onClick={handleCardClick}
        >
            {/* Menu */}
            <div className="absolute top-3 right-3">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 rounded hover:bg-gray-100"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                    <div className="absolute right-0 top-8 bg-white border rounded-md shadow-lg z-10 w-32">
                        <button
                            onClick={handleEdit}
                            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            <Edit className="w-3 h-3 mr-2" />
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <Trash className="w-3 h-3 mr-2" />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="pr-8">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {note.title}
                </h3>

                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {truncateContent(note.content)}
                </p>

                {/* Tags */}
                {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {note.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                            >
                                {tag}
                            </span>
                        ))}
                        {note.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                                +{note.tags.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {/* AI Features */}
                <div className="flex items-center gap-2 mb-3">
                    {note.has_ai_summary && (
                        <span className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Summary
                        </span>
                    )}
                    {note.has_ai_enhancement && (
                        <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Enhanced
                        </span>
                    )}
                </div>

                {/* Footer */}
                <div className="text-xs text-gray-500 flex justify-between">
                    <span>{note.words_count} words</span>
                    <span>{formatDistanceToNow(new Date(note.updated_at))} ago</span>
                </div>
            </div>
        </div>
    )
}