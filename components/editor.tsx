"use client";

import type React from "react";
import { useRef, useEffect, useState, useCallback } from "react";
import type { Note } from "@/types/note";

interface EditorProps {
  note: Note;
  onUpdateNote: (note: Note) => void;
  locked?: boolean;
  onRequireUnlock?: () => void;
}

export function Editor({
  note,
  onUpdateNote,
  locked = false,
  onRequireUnlock,
}: EditorProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // const [titleError, setTitleError] = useState<string | null>(null);
  const [isContentFocused, setIsContentFocused] = useState(false);

  useEffect(() => {
    if (!contentRef.current) return;
    if (locked) {
      // Hide any encrypted/raw content when locked
      contentRef.current.innerHTML = "";
      return;
    }
    if (note.content !== contentRef.current.innerHTML) {
      contentRef.current.innerHTML = note.content;
    }
  }, [note.id, locked]); // Update when note changes or lock state changes

  const handleContentChange = useCallback(() => {
    if (contentRef.current) {
      const content = contentRef.current.innerHTML;
      onUpdateNote({
        ...note,
        content: content,
      });
    }
  }, [note, onUpdateNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // if (e.target.value.length > 50) {
    //   setTitleError("Title must be at most 50 characters long");
    //   return;
    // }
    // setTitleError(null);
    onUpdateNote({
      ...note,
      title: e.target.value || "Untitled Note",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (locked) {
      e.preventDefault();
      onRequireUnlock?.();
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          document.execCommand("bold", false);
          handleContentChange();
          break;
        case "i":
          e.preventDefault();
          document.execCommand("italic", false);
          handleContentChange();
          break;
        case "u":
          e.preventDefault();
          document.execCommand("underline", false);
          handleContentChange();
          break;
        case "l":
          e.preventDefault();
          if (e.shiftKey) {
            document.execCommand("justifyLeft", false);
          } else {
            document.execCommand("insertUnorderedList", false);
          }
          handleContentChange();
          break;
        case "e":
          e.preventDefault();
          document.execCommand("justifyCenter", false);
          handleContentChange();
          break;
        case "r":
          e.preventDefault();
          document.execCommand("justifyRight", false);
          handleContentChange();
          break;
        case "j":
          e.preventDefault();
          document.execCommand("justifyFull", false);
          handleContentChange();
          break;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (locked) {
      e.preventDefault();
      onRequireUnlock?.();
      return;
    }
    e.preventDefault();

    // Try to get HTML content first, fallback to plain text
    const htmlData = e.clipboardData.getData("text/html");
    const textData = e.clipboardData.getData("text/plain");

    if (htmlData) {
      // Clean the HTML to remove unwanted styles but keep basic formatting
      const cleanHtml = htmlData
        .replace(/<script[^>]*>.*?<\/script>/gi, "")
        .replace(/<style[^>]*>.*?<\/style>/gi, "")
        .replace(/style="[^"]*"/gi, "")
        .replace(/class="[^"]*"/gi, "");

      document.execCommand("insertHTML", false, cleanHtml);
    } else {
      document.execCommand("insertText", false, textData);
    }

    handleContentChange();
  };

  const handleContentFocus = () => {
    if (locked) {
      onRequireUnlock?.();
      return;
    }
    setIsContentFocused(true);
  };

  const handleContentBlur = () => {
    setIsContentFocused(false);
    handleContentChange();
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-background">
      {/* Title Input */}
      <div className="p-4 sm:p-6 sm:pb-0 pb-0">
        <input
          ref={titleRef}
          type="text"
          value={note.title}
          onChange={handleTitleChange}
          className="w-full max-w-3xl mx-auto text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground focus:ring-0"
          disabled={locked}
          placeholder="Untitled Note"
        />
      </div>

      {/* Content Editor */}
      <div className="relative flex-1 min-h-0 p-4 sm:p-6 overflow-auto">
        <div
          ref={contentRef}
          contentEditable={!locked}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={handleContentFocus}
          onBlur={handleContentBlur}
          className={`w-full mx-auto h-full min-h-[320px] sm:min-h-[400px] bg-transparent border-none outline-none text-foreground text-base leading-relaxed break-words transition-all duration-200 ${
            isContentFocused
              ? "ring-2 ring-primary/20 rounded-lg p-3 sm:p-4"
              : "p-3 sm:p-4"
          }`}
          style={{
            whiteSpace: "pre-wrap",
          }}
          suppressContentEditableWarning={true}
          data-placeholder="Start writing your note..."
        />

        {locked && (
          <button
            type="button"
            onClick={() => onRequireUnlock?.()}
            className="absolute inset-4 sm:inset-6 rounded-lg grid place-items-center bg-background/70 backdrop-blur-sm border border-dashed border-border text-center p-6"
          >
            <div>
              <div className="text-foreground font-medium mb-1">
                This note is locked
              </div>
              <div className="text-sm text-muted-foreground">
                Enter the password to view and edit this note.
              </div>
              <div className="mt-3 inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                Unlock
              </div>
            </div>
          </button>
        )}

        <style jsx>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: hsl(var(--muted-foreground));
            pointer-events: none;
          }

          [contenteditable] h1 {
            font-size: 2rem;
            font-weight: bold;
            margin: 1rem 0;
          }

          [contenteditable] h2 {
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0.8rem 0;
          }

          [contenteditable] h3 {
            font-size: 1.25rem;
            font-weight: bold;
            margin: 0.6rem 0;
          }

          [contenteditable] blockquote {
            border-left: 4px solid hsl(var(--primary));
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            background: hsl(var(--muted) / 0.3);
          }

          [contenteditable] pre {
            background: hsl(var(--muted));
            padding: 1rem;
            border-radius: 0.5rem;
            font-family: monospace;
            overflow-x: auto;
            margin: 1rem 0;
          }

          [contenteditable] ul,
          [contenteditable] ol {
            margin: 1rem 0;
            padding-left: 2rem;
          }

          [contenteditable] li {
            margin: 0.25rem 0;
          }
        `}</style>
      </div>
    </div>
  );
}
