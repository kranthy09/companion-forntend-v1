// src/app/notes/page.tsx
'use client'
import { useState } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { NotesList } from '@/components/features/notes/notes-list'
import { NoteEditor } from '@/components/features/notes/notes-editor'

export default function NotesPage() {
    const { selectNote } = useNotesStore()
    const [showEditor, setShowEditor] = useState(false)

    const handleCreateNote = () => {
        selectNote(null)
        setShowEditor(true)
    }

    const handleCloseEditor = () => {
        setShowEditor(false)
        selectNote(null)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <NotesList onCreateNote={handleCreateNote} />

                {showEditor && (
                    <NoteEditor onClose={handleCloseEditor} />
                )}
            </div>
        </div>
    )
}