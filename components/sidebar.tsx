"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Lock,
  Copy,
  Download,
  MoreVertical,
  FileDown,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from "@/types/note";
import { cn } from "@/lib/utils";

interface SidebarProps {
  notes: Note[];
  activeNote: Note | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNoteSelect: (note: Note) => void;
  onNewNote: () => void;
  onDuplicateNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onDeleteAllNotes: () => void;
  onTogglePin: (noteId: string) => void;
  onTogglePasswordProtection: (noteId: string) => void;
  onExportNote: (noteId: string) => void;
  onExportAllNotes: () => void;
  unlockedNotes: Set<string>;
}

export function Sidebar({
  notes,
  activeNote,
  searchQuery,
  onSearchChange,
  onNoteSelect,
  onNewNote,
  onDuplicateNote,
  onDeleteNote,
  onDeleteAllNotes,
  onTogglePin,
  onTogglePasswordProtection,
  onExportNote,
  onExportAllNotes,
  unlockedNotes,
}: SidebarProps) {
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  // Track which note's context menu is open so it doesn't disappear on mouse leave
  const [openMenuForNote, setOpenMenuForNote] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncateContent = (content: string, maxLength = 60) => {
    const textContent = content.replace(/<[^>]*>/g, "").trim();
    return textContent.length > maxLength
      ? textContent.substring(0, maxLength) + "..."
      : textContent || "No content";
  };

  const getDisplayContent = (note: Note) => {
    if (note.isPasswordProtected && !unlockedNotes.has(note.id)) {
      return "🔒 Password protected content";
    }
    return truncateContent(note.content);
  };

  return (
    <div className="w-full sm:w-80 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-sidebar-foreground">
            Notify
          </h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={onNewNote}
              size="sm"
              className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:bg-sidebar-accent"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={onExportAllNotes}
                  disabled={notes.length === 0}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export All Notes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDeleteAllNotes}
                  disabled={notes.length === 0}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Notes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes and tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-sidebar-accent border-sidebar-border"
          />
        </div>

        {notes.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground flex justify-between">
            <span>{notes.length} notes</span>
            <div className="flex gap-2">
              <span>{notes.filter((n) => n.isPinned).length} pinned</span>
              <span>
                {notes.filter((n) => n.isPasswordProtected).length} protected
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2">
        {notes.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8">
            <p>No notes yet</p>
            <p className="text-sm">Create your first note to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Card
                key={note.id}
                className={cn(
                  "p-3 cursor-pointer transition-all duration-200 hover:shadow-md border-sidebar-border",
                  activeNote?.id === note.id
                    ? "bg-sidebar-accent border-sidebar-primary shadow-sm"
                    : note.isPasswordProtected
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-sidebar hover:bg-sidebar-accent"
                )}
                onClick={() => onNoteSelect(note)}
                onMouseEnter={() => setHoveredNote(note.id)}
                onMouseLeave={() => {
                  // Only clear hover when menu for this note isn't open
                  if (openMenuForNote !== note.id) {
                    setHoveredNote(null);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sidebar-foreground truncate flex-1 mr-2">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {note.isPinned && (
                      <Pin className="w-3 h-3 text-sidebar-primary fill-current" />
                    )}

                    {note.isPasswordProtected && (
                      <Lock
                        className={cn(
                          "w-3 h-3",
                          unlockedNotes.has(note.id)
                            ? "text-green-500"
                            : "text-yellow-500"
                        )}
                      />
                    )}

                    <div className="relative">
                      <DropdownMenu
                        open={openMenuForNote === note.id}
                        onOpenChange={(open) => {
                          setOpenMenuForNote(open ? note.id : null);
                          if (open) setHoveredNote(note.id);
                        }} 
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 p-0 hover:bg-sidebar-accent",
                              (hoveredNote === note.id || openMenuForNote === note.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-48"
                          onMouseEnter={() => setHoveredNote(note.id)}
                          onMouseLeave={() => setHoveredNote(null)}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(note.id);
                            }}
                          >
                            {note.isPinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePasswordProtection(note.id);
                            }}
                          >
                            {note.isPasswordProtected ? "Remove Password" : "Add Password"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateNote(note.id);
                            }}
                          >
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportNote(note.id);
                            }}
                          >
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote(note.id);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {getDisplayContent(note)}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(note.updatedAt)}</span>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 bg-sidebar-accent rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && (
                        <span className="text-xs">+{note.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
