"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Editor } from "@/components/editor"
import { Toolbar } from "@/components/toolbar"
import { AIPanel } from "@/components/ai-panel"
import { TranslationDialog } from "@/components/translation-dialog"
import { PasswordDialog } from "@/components/password-dialog"
import { encryptionService } from "@/services/encryption-service"
import type { Note } from "@/types/note"
import { Menu, Sparkles, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NoteTakingApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showTranslate, setShowTranslate] = useState(false)
  const [showSidebarMobile, setShowSidebarMobile] = useState(false)

  const [passwordDialog, setPasswordDialog] = useState<{
    isOpen: boolean
    mode: "set" | "verify"
    noteId: string | null
    isLoading: boolean
    error: string
  }>({
    isOpen: false,
    mode: "verify",
    noteId: null,
    isLoading: false,
    error: "",
  })

  const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(new Set())

  const isActiveLocked = !!(activeNote && activeNote.isPasswordProtected && !unlockedNotes.has(activeNote.id))

  // Close AI panel if the active note becomes locked
  useEffect(() => {
    if (isActiveLocked && showAIPanel) setShowAIPanel(false)
  }, [isActiveLocked])

  useEffect(() => {
    const savedNotes = localStorage.getItem("notes")
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }))
      setNotes(parsedNotes)
      if (parsedNotes.length > 0) {
        // Don't auto-select password protected notes
        const firstUnprotectedNote = parsedNotes.find((note: Note) => !note.isPasswordProtected)
        setActiveNote(firstUnprotectedNote || null)
      }
    }

    // Hydrate unlocked notes from sessionStorage to avoid unexpected relock on remount/HMR
    try {
      const raw = sessionStorage.getItem("unlockedNotes")
      if (raw) {
        const arr: string[] = JSON.parse(raw)
        if (Array.isArray(arr)) {
          setUnlockedNotes(new Set(arr))
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes))
  }, [notes])

  // Persist unlocked notes in sessionStorage for the session
  useEffect(() => {
    try {
      sessionStorage.setItem("unlockedNotes", JSON.stringify(Array.from(unlockedNotes)))
    } catch {}
  }, [unlockedNotes])

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
      isPasswordProtected: false,
      tags: [],
    }
    setNotes((prev) => [newNote, ...prev])
    setActiveNote(newNote)
  }

  const duplicateNote = async (noteId: string) => {
    const originalNote = notes.find((note) => note.id === noteId)
    
    if (!originalNote) return

    let contentForCopy = originalNote.content

    // If protected and not currently unlocked, require password to decrypt before duplicating
    if (originalNote.isPasswordProtected && !unlockedNotes.has(originalNote.id)) {
      const password = window.prompt("Enter password to duplicate this protected note")
      if (!password) return
      try {
        // Verify password hash if present
        if (originalNote.password) {
          const inputHash = await encryptionService.hashPassword(password)
          if (inputHash !== originalNote.password) {
            alert("Incorrect password")
            return
          }
        }
        contentForCopy = await encryptionService.decrypt(originalNote.content, password)
      } catch (e) {
        alert("Failed to decrypt note. Please try again.")
        return
      }
    }

    const duplicatedNote: Note = {
      ...originalNote,
      id: Date.now().toString(),
      title: `${originalNote.title} (Copy)`,
      content: contentForCopy,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
      isPasswordProtected: true, // Duplicates are unprotected by default
      password: `${originalNote.password}`,
    }
    setNotes((prev) => [duplicatedNote, ...prev])
    setActiveNote(duplicatedNote)
  }

  const updateNote = (updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date() } : note)),
    )
    setActiveNote(updatedNote)
  }

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
    setUnlockedNotes((prev) => {
      const newSet = new Set(prev)
      newSet.delete(noteId)
      return newSet
    })
    if (activeNote?.id === noteId) {
      const remainingNotes = notes.filter((note) => note.id !== noteId)
      setActiveNote(remainingNotes.length > 0 ? remainingNotes[0] : null)
    }
  }

  const deleteAllNotes = () => {
    if (window.confirm("Are you sure you want to delete all notes? This action cannot be undone.")) {
      setNotes([])
      setActiveNote(null)
      setUnlockedNotes(new Set())
    }
  }

  const togglePin = (noteId: string) => {
    setNotes((prev) => prev.map((note) => (note.id === noteId ? { ...note, isPinned: !note.isPinned } : note)))
  }

  const handleNoteSelect = (note: Note) => {
    if (note.isPasswordProtected && !unlockedNotes.has(note.id)) {
      setPasswordDialog({
        isOpen: true,
        mode: "verify",
        noteId: note.id,
        isLoading: false,
        error: "",
      })
    } else {
      setActiveNote(note)
    }
  }

  const togglePasswordProtection = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return

    if (note.isPasswordProtected) {
      // Remove password protection
      if (window.confirm("Remove password protection from this note?")) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, isPasswordProtected: false, password: undefined } : n)),
        )
        setUnlockedNotes((prev) => {
          const newSet = new Set(prev)
          newSet.delete(noteId)
          return newSet
        })
      }
    } else {
      // Add password protection
      setPasswordDialog({
        isOpen: true,
        mode: "set",
        noteId: noteId,
        isLoading: false,
        error: "",
      })
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!passwordDialog.noteId) return

    setPasswordDialog((prev) => ({ ...prev, isLoading: true, error: "" }))

    try {
      const note = notes.find((n) => n.id === passwordDialog.noteId)
      if (!note) throw new Error("Note not found")

      if (passwordDialog.mode === "set") {
        // Encrypt the note content
        const encryptedContent = await encryptionService.encrypt(note.content, password)
        const passwordHash = await encryptionService.hashPassword(password)

        setNotes((prev) =>
          prev.map((n) =>
            n.id === passwordDialog.noteId
              ? {
                  ...n,
                  content: encryptedContent,
                  isPasswordProtected: true,
                  password: passwordHash,
                }
              : n,
          ),
        )
        // Do not auto-unlock after setting. Keep it locked until verified.
        setUnlockedNotes((prev) => {
          const next = new Set(prev)
          next.delete(passwordDialog.noteId!)
          return next
        })
        // If this is the active note, mark it as protected (content will be hidden by Editor overlay)
        if (activeNote?.id === passwordDialog.noteId) {
          setActiveNote({
            ...note,
            content: encryptedContent,
            isPasswordProtected: true,
            password: passwordHash,
          })
        }
      } else {
        // Verify password and decrypt content
        if (!note.password) throw new Error("No password set for this note")

        const inputPasswordHash = await encryptionService.hashPassword(password)
        if (inputPasswordHash !== note.password) {
          throw new Error("Incorrect password")
        }

        const decryptedContent = await encryptionService.decrypt(note.content, password)
        setUnlockedNotes((prev) => new Set([...prev, passwordDialog.noteId!]))
        setActiveNote({
          ...note,
          content: decryptedContent,
        })
      }

      setPasswordDialog((prev) => ({ ...prev, isOpen: false }))
    } catch (error) {
      setPasswordDialog((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "An error occurred",
        isLoading: false,
      }))
    }
  }

  const exportNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      let content = note.content
      if (note.isPasswordProtected && !unlockedNotes.has(noteId)) {
        content = "[Password Protected Content]"
      } else {
        content = content.replace(/<[^>]*>/g, "")
      }

      const exportContent = `# ${note.title}\n\n${content}\n\nCreated: ${note.createdAt.toLocaleDateString()}\nUpdated: ${note.updatedAt.toLocaleDateString()}`
      const blob = new Blob([exportContent], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const exportAllNotes = () => {
    if (notes.length === 0) return

    const allContent = notes
      .map((note) => {
        let content = note.content
        if (note.isPasswordProtected && !unlockedNotes.has(note.id)) {
          content = "[Password Protected Content]"
        } else {
          content = content.replace(/<[^>]*>/g, "")
        }

        return `# ${note.title}\n\n${content}\n\nCreated: ${note.createdAt.toLocaleDateString()}\nUpdated: ${note.updatedAt.toLocaleDateString()}\nTags: ${note.tags.join(", ")}\n\n---\n\n`
      })
      .join("")

    const blob = new Blob([allContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `all_notes_${new Date().toISOString().split("T")[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (!note.isPasswordProtected || unlockedNotes.has(note.id)
        ? note.content.toLowerCase().includes(searchQuery.toLowerCase())
        : false) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const sortedNotes = filteredNotes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return (
    <div className="flex h-svh sm:h-screen bg-background overflow-hidden flex-col sm:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden sm:block">
        <Sidebar
          notes={sortedNotes}
          activeNote={activeNote}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNoteSelect={handleNoteSelect}
          onNewNote={createNewNote}
          onDuplicateNote={duplicateNote}
          onDeleteNote={deleteNote}
          onDeleteAllNotes={deleteAllNotes}
          onTogglePin={togglePin}
          onTogglePasswordProtection={togglePasswordProtection}
          onExportNote={exportNote}
          onExportAllNotes={exportAllNotes}
          unlockedNotes={unlockedNotes}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* Mobile Top Bar */}
        <div className="sm:hidden flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSidebarMobile(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Notify</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={createNewNote} aria-label="New note">
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowAIPanel((s) => !s)} aria-label="Toggle AI">
              <Sparkles className={`h-5 w-5 ${showAIPanel ? "text-primary" : ""}`} />
            </Button>
          </div>
        </div>
        {activeNote && (
          <>
            <Toolbar
              activeNote={activeNote}
              onUpdateNote={updateNote}
              onToggleAIPanel={() => setShowAIPanel(!showAIPanel)}
              showAIPanel={showAIPanel}
              onOpenTranslate={() => setShowTranslate(true)}
              disabled={activeNote.isPasswordProtected && !unlockedNotes.has(activeNote.id)}
              canRelock={activeNote.isPasswordProtected && unlockedNotes.has(activeNote.id)}
              onRelock={() => {
                setUnlockedNotes((prev) => {
                  const next = new Set(prev)
                  next.delete(activeNote.id)
                  return next
                })
                // If relocking the active note, also close AI panel for safety
                if (showAIPanel) setShowAIPanel(false)
              }}
              onRequireUnlock={() =>
                setPasswordDialog({
                  isOpen: true,
                  mode: "verify",
                  noteId: activeNote.id,
                  isLoading: false,
                  error: "",
                })
              }
            />
            <Editor
              note={activeNote}
              onUpdateNote={updateNote}
              locked={activeNote.isPasswordProtected && !unlockedNotes.has(activeNote.id)}
              onRequireUnlock={() =>
                setPasswordDialog({
                  isOpen: true,
                  mode: "verify",
                  noteId: activeNote.id,
                  isLoading: false,
                  error: "",
                })
              }
            />
          </>
        )}
        {!activeNote && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Welcome to Notes</h2>
              <p className="mb-4">Create a new note to get started</p>
              <div className="text-sm text-muted-foreground">
                <p>Total notes: {notes.length}</p>
                <p>Pinned notes: {notes.filter((n) => n.isPinned).length}</p>
                <p>Protected notes: {notes.filter((n) => n.isPasswordProtected).length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      {activeNote && !isActiveLocked && (
        <div className="sm:block w-full sm:w-auto">
          <AIPanel
            note={activeNote}
            onUpdateNote={updateNote}
            isVisible={showAIPanel}
            onClose={() => setShowAIPanel(false)}
          />
        </div>
      )}

      {/* Mobile Sidebar Drawer */}
      {showSidebarMobile && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]"
          onClick={() => setShowSidebarMobile(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-[20rem] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              notes={sortedNotes}
              activeNote={activeNote}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNoteSelect={(n) => {
                handleNoteSelect(n)
                setShowSidebarMobile(false)
              }}
              onNewNote={() => {
                createNewNote()
                setShowSidebarMobile(false)
              }}
              onDuplicateNote={duplicateNote}
              onDeleteNote={deleteNote}
              onDeleteAllNotes={deleteAllNotes}
              onTogglePin={togglePin}
              onTogglePasswordProtection={togglePasswordProtection}
              onExportNote={exportNote}
              onExportAllNotes={exportAllNotes}
              unlockedNotes={unlockedNotes}
            />
          </div>
        </div>
      )}

      <PasswordDialog
        isOpen={passwordDialog.isOpen}
        onClose={() => setPasswordDialog((prev) => ({ ...prev, isOpen: false, error: "" }))}
        onSubmit={handlePasswordSubmit}
        mode={passwordDialog.mode}
        isLoading={passwordDialog.isLoading}
        error={passwordDialog.error}
      />

      <TranslationDialog open={showTranslate} onOpenChange={setShowTranslate} note={activeNote} />
    </div>
  )
}
