// src/components/features/notes/note-editor.tsx
'use client'
import { useState, useEffect } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'
import type { NoteCreate, NoteUpdate } from '@/types/notes'
import { Save, Sparkles, X } from 'lucide-react'

interface NoteEditorProps {
    onClose: () => void
}

export function NoteEditor({ onClose }: NoteEditorProps) {
    const { selectedNote, createNote, updateNote } = useNotesStore()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: [] as string[],
    })

    useEffect(() => {
        if (selectedNote) {
            setFormData({
                title: selectedNote.title,
                content: selectedNote.content,
                tags: selectedNote.tags,
            })
        }
    }, [selectedNote])

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) return

        setSaving(true)
        try {
            if (selectedNote) {
                const updateData: NoteUpdate = {
                    title: formData.title,
                    content: formData.content,
                    tags: formData.tags,
                }
                await updateNote(selectedNote.id, updateData)
            } else {
                const createData: NoteCreate = {
                    title: formData.title,
                    content: formData.content,
                    tags: formData.tags,
                }
                await createNote(createData)
            }
            onClose()
        } finally {
            setSaving(false)
        }
    }

    const handleTagsChange = (value: string) => {
        const tags = value.split(',').map(tag => tag.trim()).filter(Boolean)
        setFormData(prev => ({ ...prev, tags }))
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                        {selectedNote ? 'Edit Note' : 'Create Note'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {selectedNote && (
                            <Button variant="secondary" size="sm">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Enhance
                            </Button>
                        )}
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant="secondary" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <Input
                        placeholder="Note title..."
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="text-lg font-medium"
                    />

                    <textarea
                        placeholder="Start writing..."
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full h-96 p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    <Input
                        placeholder="Tags (comma separated)"
                        value={formData.tags.join(', ')}
                        onChange={(e) => handleTagsChange(e.target.value)}
                    />
                </div>

                {/* Footer */}
                <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>{formData.content.split(' ').filter(Boolean).length} words</span>
                    {selectedNote && (
                        <span>Last updated: {formatDistanceToNow(new Date(selectedNote.updated_at))} ago</span>
                    )}
                </div>
            </div>
        </div>
    )
}