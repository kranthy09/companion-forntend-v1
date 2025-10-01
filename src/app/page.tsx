// src/app/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useNotesStore } from '@/stores/notes-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
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
      fetchNotes({ page: 1, page_size: 10, sort_by: 'updated_at', sort_order: 'desc' })
    }
  }, [isAuthenticated, fetchNotes])

  useEffect(() => {
    setRecentNotes(notes.slice(0, 6))
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

  const handleCloseEditor = async () => {
    setShowEditor(false)
    selectNote(null)
    // Refresh notes list after editor closes
    await fetchNotes({ page: 1, page_size: 10, sort_by: 'updated_at', sort_order: 'desc' })
  }

  const handleNoteClick = (note: Note) => {
    // Navigate to dedicated note view page
    router.push(`/notes/${note.id}`)
  }

  const handleEditNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation()
    selectNote(note)
    setShowEditor(true)
  }

  // Carousel navigation with 3 visible notes
  const VISIBLE_COUNT = 3
  const maxSlide = Math.max(0, recentNotes.length - VISIBLE_COUNT)
  const showNav = recentNotes.length > VISIBLE_COUNT

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, maxSlide))
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0))

  // Reset if current position becomes invalid
  useEffect(() => {
    if (currentSlide > maxSlide) setCurrentSlide(0)
  }, [recentNotes.length, currentSlide, maxSlide])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
          <div className="flex items-center gap-3">
            {showNav && (
              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous notes"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  disabled={currentSlide === maxSlide}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next notes"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {recentNotes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No notes yet</p>
            <Button onClick={handleCreateNote}>Create your first note</Button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out gap-4"
              style={{ transform: `translateX(-${currentSlide * (100 / 3)}%)` }}
            >
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  className="min-w-[calc(33.333%-0.75rem)] flex-shrink-0"
                >
                  <div
                    onClick={() => handleNoteClick(note)}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-48 flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg line-clamp-2 text-gray-900 flex-1">
                        {note.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleEditNote(note, e)}
                        className="ml-2 h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4 rotate-45" />
                      </Button>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                      {note.content.substring(0, 120)}...
                    </p>
                    <div className="mt-auto flex justify-between items-center text-xs text-gray-500">
                      <span>{note.words_count} words</span>
                      <span>{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })} ago</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View All Link */}
        {recentNotes.length > 0 && (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => router.push('/notes')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all notes
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Notes</h3>
          <p className="text-3xl font-bold text-gray-900">{notes.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Words Written</h3>
          <p className="text-3xl font-bold text-gray-900">
            {notes.reduce((total, note) => total + note.words_count, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">This Week</h3>
          <p className="text-3xl font-bold text-gray-900">
            {notes.filter(note =>
              new Date(note.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length}
          </p>
        </div>
      </div>

      {/* Note Editor Modal */}
      {showEditor && (
        <NoteEditor onClose={handleCloseEditor} />
      )}
    </div>
  )
}