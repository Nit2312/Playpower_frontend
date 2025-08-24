"use client"

import { useState, useEffect } from "react"
import { Sparkles, Tag, FileText, CheckCircle, Lightbulb, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { aiService, type GlossaryTerm, type GrammarError } from "@/services/ai-service"
import type { Note } from "@/types/note"

interface AIPanelProps {
  note: Note
  onUpdateNote: (note: Note) => void
  isVisible: boolean
  onClose: () => void
}

export function AIPanel({ note, onUpdateNote, isVisible, onClose }: AIPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<string>("")
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([])
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])

  useEffect(() => {
    if (isVisible && note.content) {
      generateAIInsights()
    }
  }, [isVisible, note.id])

  const generateAIInsights = async () => {
    setIsLoading(true)
    try {
      const [summaryResult, tagsResult, glossaryResult, grammarResult] = await Promise.all([
        aiService.summarizeNote(note.content),
        aiService.suggestTags(note.title, note.content),
        aiService.detectGlossaryTerms(note.content),
        aiService.checkGrammar(note.content),
      ])

      setSummary(summaryResult)
      setSuggestedTags(tagsResult)
      setGlossaryTerms(glossaryResult)
      setGrammarErrors(grammarResult)
    } catch (error) {
      console.error("Error generating AI insights:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = (tag: string) => {
    if (!note.tags.includes(tag)) {
      onUpdateNote({
        ...note,
        tags: [...note.tags, tag],
      })
    }
  }

  const applySummary = () => {
    onUpdateNote({
      ...note,
      summary: summary,
    })
  }

  if (!isVisible) return null

  return (
    <div className="w-full sm:w-80 flex-shrink-0 bg-card border-l border-border flex flex-col h-full overflow-hidden ">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">AI Insights</h2>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <Card >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">{summary}</p>
                <Button size="sm" variant="outline" onClick={applySummary}>
                  Save Summary
                </Button>
              </CardContent>
            </Card>

            {/* Suggested Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Suggested Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant={note.tags.includes(tag) ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                      {!note.tags.includes(tag) && <span className="ml-1">+</span>}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Glossary Terms */}
            {glossaryTerms.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Key Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {glossaryTerms.map((term, index) => (
                    <div key={index} className="space-y-1">
                      <div className="font-medium text-sm">{term.term}</div>
                      <div className="text-xs text-muted-foreground">{term.definition}</div>
                      {index < glossaryTerms.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Grammar Errors */}
            {grammarErrors.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Grammar Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {grammarErrors.map((error, index) => (
                    <div key={index} className="space-y-1">
                      <div className="font-medium text-sm text-destructive">"{error.text}"</div>
                      <div className="text-xs text-muted-foreground">{error.message}</div>
                      {error.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {error.suggestions.map((suggestion, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {index < grammarErrors.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Refresh Button */}
            <Button
              onClick={generateAIInsights}
              disabled={isLoading}
              className="w-full bg-transparent"
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Refresh Insights
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
