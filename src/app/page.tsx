// src/app/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useNotesStore } from '@/stores/notes-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Note } from '@/types/notes'
import { NoteEditor } from '@/components/features/notes/notes-editor'

export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuthContext()
  const { notes, fetchNotes, selectNote } = useNotesStore()
  const [recentNotes, setRecentNotes] = useState<Note[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes({ page: 1, page_size: 5, sort_by: 'updated_at', sort_order: 'desc' })
    }
  }, [isAuthenticated])

  useEffect(() => {
    setRecentNotes(notes.slice(0, 5))
  }, [notes])

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/notes?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleCreateNote = () => {
    selectNote(null)
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    selectNote(null)
  }

  const handleNoteClick = (note: Note) => {
    selectNote(note)
    setShowEditor(true)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, recentNotes.length - 2))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.max(1, recentNotes.length - 2)) % Math.max(1, recentNotes.length - 2))
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">
          Welcome back
        </h1>
        <p className="text-gray-600">
          Continue your writing journey and capture new ideas
        </p>
      </div>

      {/* Search and Create */}
      <div className="mb-8 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search your notes..."
            className="pl-10 h-12 text-lg border-gray-200 focus:border-blue-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button
          onClick={handleCreateNote}
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Note
        </Button>
      </div>

      {/* Recent Notes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Notes</h2>
          <div className="flex gap-2">
            <button
              onClick={prevSlide}
              disabled={recentNotes.length <= 3}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              disabled={recentNotes.length <= 3}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {recentNotes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">No notes yet</p>
            <Button onClick={handleCreateNote}>Create your first note</Button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * (100 / 3)}%)` }}
            >
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  className="w-1/3 flex-shrink-0 px-2"
                >
                  <div
                    onClick={() => handleNoteClick(note)}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all cursor-pointer h-48"
                  >
                    <h3 className="font-semibold text-lg mb-3 line-clamp-2 text-gray-900">
                      {note.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {note.content.substring(0, 120)}...
                    </p>
                    <div className="mt-auto flex justify-between items-center text-xs text-gray-500">
                      <span>{note.words_count} words</span>
                      <span>{formatDistanceToNow(new Date(note.updated_at))} ago</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      {showEditor && (
        <NoteEditor onClose={handleCloseEditor} />
      )}
    </div>

  )
  {/* Quick Stats */ }
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Total Notes</h3>
      <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
    </div>
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Words Written</h3>
      <p className="text-2xl font-bold text-gray-900">
        {notes.reduce((total, note) => total + note.words_count, 0)}
      </p>
    </div>
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500 mb-2">This Week</h3>
      <p className="text-2xl font-bold text-gray-900">
        {notes.filter(note =>
          new Date(note.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length}
      </p>
    </div>
  </div>
}