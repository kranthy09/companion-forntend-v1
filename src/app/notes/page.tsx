// src/app/notes/page.tsx
'use client'
import { useState } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { NotesList } from '@/components/features/notes/notes-list'
import { NoteEditor } from '@/components/features/notes/notes-editor'

export default function NotesPage() {
    const { selectedNote, selectNote } = useNotesStore()
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
            <div className="container mx-auto px-4 py-8">
                <NotesList onCreateNote={handleCreateNote} />

                {(showEditor || selectedNote) && (
                    <NoteEditor onClose={handleCloseEditor} />
                )}
            </div>
        </div>
    )
}