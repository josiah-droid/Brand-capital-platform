"use client"

import { useState } from "react"
import { useDealNotes, useCreateNote, useDeleteNote } from "@/hooks/use-notes"
import { formatDate } from "@/lib/utils"
import { Loader2, Send, Trash2, Lock, User } from "lucide-react"

interface DealNotesProps {
  dealId: string
}

export function DealNotes({ dealId }: DealNotesProps) {
  const [newNote, setNewNote] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)

  const { data: notes, isLoading } = useDealNotes(dealId)
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    try {
      await createNote.mutateAsync({
        deal_id: dealId,
        content: newNote.trim(),
        is_private: isPrivate,
      })
      setNewNote("")
      setIsPrivate(false)
    } catch (error) {
      console.error("Failed to create note:", error)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      await deleteNote.mutateAsync({ id: noteId, dealId })
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note about this project..."
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={3}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Lock className="w-3 h-3" />
            Private note (only visible to you)
          </label>
          <button
            type="submit"
            disabled={!newNote.trim() || createNote.isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {createNote.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Add Note
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className={`p-3 rounded-lg border ${
                note.is_private ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{note.user?.full_name || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.created_at)}
                  </span>
                  {note.is_private && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={deleteNote.isPending}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{note.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No notes yet. Add your first note above.
          </div>
        )}
      </div>
    </div>
  )
}
