// src/components/features/notes/notes-editor.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useNotesStore } from '@/stores/notes-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'
import type { NoteCreate, NoteUpdate } from '@/types/notes'
import { Save, Sparkles, X, Loader2, AlertCircle } from 'lucide-react'

interface NoteEditorProps {
    onClose: () => void
}

export function NoteEditor({ onClose }: NoteEditorProps) {
    const { selectedNote, createNote, updateNote } = useNotesStore()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: [] as string[],
    })
    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => {
        if (selectedNote) {
            setFormData({
                title: selectedNote.title,
                content: selectedNote.content,
                tags: selectedNote.tags || [],
            })
            setIsDirty(false)
        }
    }, [selectedNote])

    // Track if form has been modified
    useEffect(() => {
        if (selectedNote) {
            const hasChanges =
                formData.title !== selectedNote.title ||
                formData.content !== selectedNote.content ||
                JSON.stringify(formData.tags) !== JSON.stringify(selectedNote.tags || [])
            setIsDirty(hasChanges)
        } else {
            setIsDirty(formData.title.trim() !== '' || formData.content.trim() !== '')
        }
    }, [formData, selectedNote])

    const handleSave = async () => {
        if (!formData.title.trim()) {
            setError('Title is required')
            return
        }

        if (!formData.content.trim()) {
            setError('Content is required')
            return
        }

        setSaving(true)
        setError(null)

        try {
            if (selectedNote) {
                const updateData: NoteUpdate = {
                    title: formData.title.trim(),
                    content: formData.content.trim(),
                    tags: formData.tags.filter(tag => tag.trim() !== ''),
                }
                await updateNote(selectedNote.id, updateData)
            } else {
                const createData: NoteCreate = {
                    title: formData.title.trim(),
                    content: formData.content.trim(),
                    tags: formData.tags.filter(tag => tag.trim() !== ''),
                }
                const newNote = await createNote(createData)
                console.log("newNote: ", newNote)

                if (!newNote) {
                    throw new Error('Failed to create note')
                }
            }

            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to save note')
            console.error('Save error:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        if (isDirty) {
            const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to close?'
            )
            if (!confirmed) return
        }
        onClose()
    }

    const handleTagsChange = (value: string) => {
        const tags = value
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
        setFormData(prev => ({ ...prev, tags }))
    }

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Save on Ctrl/Cmd + S
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault()
            handleSave()
        }
        // Close on Escape
        if (e.key === 'Escape') {
            e.preventDefault()
            handleClose()
        }
    }, [formData, selectedNote])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    const wordCount = formData.content.split(/\s+/).filter(Boolean).length

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose()
            }}
        >
            <div
                className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">
                            {selectedNote ? 'Edit Note' : 'Create Note'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isDirty && '• Unsaved changes'}
                            {!isDirty && selectedNote && '• All changes saved'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedNote && (
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled
                                title="AI Enhancement coming soon"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Enhance
                            </Button>
                        )}

                        <Button
                            onClick={handleSave}
                            disabled={saving || !isDirty || !formData.title.trim() || !formData.content.trim()}
                            className="min-w-[100px]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                </>
                            )}
                        </Button>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleClose}
                            className="h-10 w-10 p-0"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Error</p>
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-600 hover:text-red-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Title Input */}
                    <div>
                        <Input
                            placeholder="Note title..."
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="text-2xl font-semibold border-0 border-b-2 border-gray-200 rounded-none focus:border-blue-600 focus:ring-0 px-0"
                            autoFocus={!selectedNote}
                        />
                    </div>

                    {/* Content Textarea */}
                    <div className="flex-1">
                        <textarea
                            placeholder="Start writing your thoughts..."
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            className="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-serif text-lg leading-relaxed"
                            style={{
                                fontFamily: 'Georgia, "Times New Roman", serif',
                            }}
                        />
                    </div>

                    {/* Tags Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags (comma separated)
                        </label>
                        <Input
                            placeholder="e.g., work, ideas, personal"
                            value={formData.tags.join(', ')}
                            onChange={(e) => handleTagsChange(e.target.value)}
                            className="border-gray-300"
                        />
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">{wordCount} words</span>
                        {selectedNote && (
                            <span>
                                Last updated {formatDistanceToNow(new Date(selectedNote.updated_at))} ago
                            </span>
                        )}
                    </div>

                    <div className="text-xs text-gray-500">
                        Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Ctrl+S</kbd> to save
                        {' • '}
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Esc</kbd> to close
                    </div>
                </div>
            </div>
        </div>
    )
}