"use client"

import { useState, useEffect } from "react"
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, List, ListOrdered, Quote, Code, Sparkles, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Note } from "@/types/note"
import { ThemeToggle } from "@/components/theme-toggle"

interface ToolbarProps {
  activeNote: Note
  onUpdateNote: (note: Note) => void
  onToggleAIPanel?: () => void
  showAIPanel?: boolean
  onOpenTranslate?: () => void
  disabled?: boolean
  onRequireUnlock?: () => void
  canRelock?: boolean
  onRelock?: () => void
}

export function Toolbar({ activeNote, onUpdateNote, onToggleAIPanel, showAIPanel, onOpenTranslate, disabled = false, onRequireUnlock, canRelock, onRelock }: ToolbarProps) {
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false, // Added justify full state
  })

  useEffect(() => {
    const updateFormats = () => {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"), // Added justify full state tracking
      })
    }

    document.addEventListener("selectionchange", updateFormats)
    return () => document.removeEventListener("selectionchange", updateFormats)
  }, [])

  const applyFormatting = (command: string, value?: string) => {
    if (disabled) {
      onRequireUnlock?.()
      return
    }
    const editor = document.querySelector("[contenteditable]") as HTMLElement
    if (!editor) return

    // Focus the editor first to ensure commands work
    editor.focus()

    // Apply the formatting command
    const success = document.execCommand(command, false, value)

    if (success) {
      // Trigger content update
      const event = new Event("input", { bubbles: true })
      editor.dispatchEvent(event)

      // Update active formats immediately
      setTimeout(() => {
        setActiveFormats({
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
          justifyLeft: document.queryCommandState("justifyLeft"),
          justifyCenter: document.queryCommandState("justifyCenter"),
          justifyRight: document.queryCommandState("justifyRight"),
          justifyFull: document.queryCommandState("justifyFull"),
        })
      }, 10)
    }
  }

  const handleFontSizeChange = (size: string) => {
    applyFormatting("fontSize", size)
  }

  const insertList = (ordered: boolean) => {
    const command = ordered ? "insertOrderedList" : "insertUnorderedList"
    applyFormatting(command)
  }

  const insertBlockquote = () => {
    applyFormatting("formatBlock", "blockquote")
  }

  const insertCodeBlock = () => {
    applyFormatting("formatBlock", "pre")
  }

  const handleFontFamilyChange = (fontFamily: string) => {
    applyFormatting("fontName", fontFamily)
  }

  return (
    <div className="border-b border-border bg-card p-3 shadow-sm">
      <div className={`flex items-center gap-2 flex-wrap ${disabled ? "opacity-60" : ""}`}>
        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={activeFormats.bold ? "default" : "ghost"}
            onClick={() => applyFormatting("bold")}
            className="hover:bg-accent"
            title="Bold (Ctrl+B)"
            disabled={disabled}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.italic ? "default" : "ghost"}
            onClick={() => applyFormatting("italic")}
            className="hover:bg-accent"
            title="Italic (Ctrl+I)"
            disabled={disabled}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.underline ? "default" : "ghost"}
            onClick={() => applyFormatting("underline")}
            className="hover:bg-accent"
            title="Underline (Ctrl+U)"
            disabled={disabled}
          >
            <Underline className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Alignment */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={activeFormats.justifyLeft ? "default" : "ghost"}
            onClick={() => applyFormatting("justifyLeft")}
            className="hover:bg-accent"
            title="Align Left"
            disabled={disabled}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.justifyCenter ? "default" : "ghost"}
            onClick={() => applyFormatting("justifyCenter")}
            className="hover:bg-accent"
            title="Align Center"
            disabled={disabled}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.justifyRight ? "default" : "ghost"}
            onClick={() => applyFormatting("justifyRight")}
            className="hover:bg-accent"
            title="Align Right"
            disabled={disabled}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.justifyFull ? "default" : "ghost"}
            onClick={() => applyFormatting("justifyFull")}
            className="hover:bg-accent"
            title="Justify"
            disabled={disabled}
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists and Formatting */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => insertList(false)}
            className="hover:bg-accent"
            title="Bullet List"
            disabled={disabled}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => insertList(true)}
            className="hover:bg-accent"
            title="Numbered List"
            disabled={disabled}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={insertBlockquote} className="hover:bg-accent" title="Quote" disabled={disabled}>
            <Quote className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={insertCodeBlock} className="hover:bg-accent" title="Code Block" disabled={disabled}>
            <Code className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Select onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="w-32 h-8" disabled={disabled}>
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Times New Roman">Times</SelectItem>
              <SelectItem value="Courier New">Courier</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-muted-foreground" />
          <Select onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-24 h-8" disabled={disabled}>
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Small</SelectItem>
              <SelectItem value="2">Normal</SelectItem>
              <SelectItem value="4">Medium</SelectItem>
              <SelectItem value="5">Large</SelectItem>
              <SelectItem value="6">X-Large</SelectItem>
              <SelectItem value="7">XX-Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Styles */}
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => applyFormatting("formatBlock", value)}>
            <SelectTrigger className="w-32 h-8" disabled={disabled}>
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="div">Normal</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
              <SelectItem value="h4">Heading 4</SelectItem>
              <SelectItem value="p">Paragraph</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AI Panel Toggle */}
        {onToggleAIPanel && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              size="sm"
              variant={showAIPanel ? "default" : "ghost"}
              onClick={onToggleAIPanel}
              className="hover:bg-accent"
              title="AI Insights"
              disabled={disabled}
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Translate Button */}
        {onOpenTranslate && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button size="sm" variant="ghost" onClick={onOpenTranslate} className="hover:bg-accent" title="Translate" disabled={disabled}>
              <Globe className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-2">
          <Separator orientation="vertical" className="h-6" />
          {/* Relock button: only for password-protected notes that are currently unlocked */}
          {canRelock && onRelock && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRelock}
              className="hover:bg-accent"
              title="Relock note"
            >
              <Lock className="w-4 h-4" />
            </Button>
          )}
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
