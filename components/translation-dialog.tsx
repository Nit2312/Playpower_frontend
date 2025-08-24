"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Note } from "@/types/note"
import { aiService } from "@/services/ai-service"

interface TranslationDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  note: Note | null
}

export function TranslationDialog({ open, onOpenChange, note }: TranslationDialogProps) {
  const [targetLang, setTargetLang] = useState<string>("Spanish")
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const canTranslate = !!note && !!note.content

  const handleTranslate = async () => {
    if (!canTranslate) return
    setIsLoading(true)
    try {
      const translated = await aiService.translate(note!.content, targetLang)
      setResult(translated)
    } catch (e) {
      setResult("Translation failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Translate Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Target language</label>
            <Input
              placeholder="e.g., Spanish, French, Hindi, Japanese"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Result</label>
            <textarea
              className="mt-1 w-full min-h-[200px] rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder={canTranslate ? "Click Translate to generate..." : "No content to translate"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleTranslate} disabled={!canTranslate || isLoading}>
            {isLoading ? "Translating..." : "Translate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
