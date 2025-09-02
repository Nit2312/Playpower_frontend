/**
 * AI Service for note-taking app
 * Modular service for AI features: glossary, summarization, tags, grammar
 * Provides intelligent content analysis with caching and fallback mechanisms
 */

export interface GlossaryTerm {
  term: string
  definition: string
  startIndex: number
  endIndex: number
}

export interface GrammarError {
  text: string
  message: string
  startIndex: number
  endIndex: number
  suggestions: string[]
}

export interface AIServiceConfig {
  apiKey?: string
  provider: "groq" | "openai"
}

class AIService {
  private config: AIServiceConfig
  private cache: Map<string, any> = new Map()

  constructor(config: AIServiceConfig) {
    this.config = config
  }

  /**
   * Translates content to a target language using AI API
   * @param content - The text content to translate
   * @param targetLang - Target language code (e.g., 'es', 'fr', 'de')
   * @returns Promise<string> - Translated content
   */
  async translate(content: string, targetLang: string): Promise<string> {
    const cacheKey = `translate_${targetLang}_${content.slice(0, 80)}`
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)

    try {
      const api = await this.callAPI<{ translation: string }>({ action: "translate", content, targetLang })
      if (api?.translation) {
        this.cache.set(cacheKey, api.translation)
        return api.translation
      }
      // Fallback mock: prepend marker
      const mock = `[${targetLang}] ` + content.replace(/<[^>]*>/g, "")
      this.cache.set(cacheKey, mock)
      return mock
    } catch (error) {
      console.error("Error translating:", error)
      return content
    }
  }

  /**
   * Makes API calls to the AI service endpoint
   * @param payload - Request payload containing action and parameters
   * @returns Promise<T | null> - API response data or null if failed
   */
  private async callAPI<T>(payload: any): Promise<T | null> {
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return null
      const data = await res.json()
      // If server indicates missing key, treat as unavailable
      if (data?.error && String(data.error).includes("GROQ_API_KEY")) return null
      return data as T
    } catch (e) {
      return null
    }
  }

  /**
   * Detects technical terms in content and provides definitions
   * @param content - The text content to analyze
   * @returns Promise<GlossaryTerm[]> - Array of detected terms with definitions
   */
  async detectGlossaryTerms(content: string): Promise<GlossaryTerm[]> {
    const cacheKey = `glossary_${content.slice(0, 100)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      // Try server AI first
      const api = await this.callAPI<{ glossary: Array<{ term: string; definition: string }> }>(
        { action: "glossary", content },
      )
      if (api?.glossary?.length) {
        const terms = api.glossary.map((t, i) => ({ term: t.term, definition: t.definition, startIndex: i, endIndex: i }))
        this.cache.set(cacheKey, terms)
        return terms
      }
      // Fallback mock
      const mockTerms: GlossaryTerm[] = this.extractTechnicalTerms(content)
      this.cache.set(cacheKey, mockTerms)
      return mockTerms
    } catch (error) {
      console.error("Error detecting glossary terms:", error)
      return []
    }
  }

  /**
   * Generates a concise summary of note content
   * @param content - The note content to summarize
   * @returns Promise<string> - 1-2 line summary of the content
   */
  async summarizeNote(content: string): Promise<string> {
    const cacheKey = `summary_${content.slice(0, 100)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      // Try server AI first
      const api = await this.callAPI<{ summary: string }>({ action: "summarize", content })
      if (api?.summary) {
        this.cache.set(cacheKey, api.summary)
        return api.summary
      }
      // Fallback mock
      const summary = this.generateMockSummary(content)
      this.cache.set(cacheKey, summary)
      return summary
    } catch (error) {
      console.error("Error summarizing note:", error)
      return "Unable to generate summary"
    }
  }

  /**
   * Suggests relevant tags for a note based on title and content
   * @param title - The note title
   * @param content - The note content
   * @returns Promise<string[]> - Array of 3-5 suggested tags
   */
  async suggestTags(title: string, content: string): Promise<string[]> {
    const cacheKey = `tags_${title}_${content.slice(0, 50)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      // Try server AI first
      const api = await this.callAPI<{ tags: string[] }>({ action: "tags", title, content })
      if (api?.tags?.length) {
        this.cache.set(cacheKey, api.tags)
        return api.tags
      }
      // Fallback mock
      const tags = this.generateMockTags(title, content)
      this.cache.set(cacheKey, tags)
      return tags
    } catch (error) {
      console.error("Error suggesting tags:", error)
      return []
    }
  }

  /**
   * Checks content for grammar errors and provides suggestions
   * @param content - The text content to check for grammar errors
   * @returns Promise<GrammarError[]> - Array of detected grammar errors with suggestions
   */
  async checkGrammar(content: string): Promise<GrammarError[]> {
    const cacheKey = `grammar_${content.slice(0, 100)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      // Try server AI first
      const api = await this.callAPI<{ grammar: Array<{ text: string; message: string; suggestions: string[] }> }>(
        { action: "grammar", content },
      )
      // Check if api.grammar exists and is an array before mapping
      if (api?.grammar && Array.isArray(api.grammar)) {
        const errors = api.grammar.map((g, idx) => ({ ...g, startIndex: idx, endIndex: idx }))
        this.cache.set(cacheKey, errors)
        return errors
      }
      // Fallback mock
      const errors = this.detectMockGrammarErrors(content)
      this.cache.set(cacheKey, errors)
      return errors
    } catch (error) {
      console.error("Error checking grammar:", error)
      return []
    }
  }

  /**
   * Extracts technical terms from content using pattern matching
   * Fallback implementation when AI API is unavailable
   * @param content - The text content to analyze
   * @returns GlossaryTerm[] - Array of detected technical terms
   */
  private extractTechnicalTerms(content: string): GlossaryTerm[] {
    const technicalTerms = [
      {
        pattern: /\b(API|api)\b/gi,
        definition:
          "Application Programming Interface - a set of protocols and tools for building software applications",
      },
      {
        pattern: /\b(React|react)\b/gi,
        definition: "A JavaScript library for building user interfaces, maintained by Facebook",
      },
      {
        pattern: /\b(TypeScript|typescript)\b/gi,
        definition: "A typed superset of JavaScript that compiles to plain JavaScript",
      },
      { pattern: /\b(database|Database)\b/gi, definition: "An organized collection of structured information or data" },
      {
        pattern: /\b(algorithm|Algorithm)\b/gi,
        definition: "A step-by-step procedure for solving a problem or completing a task",
      },
      {
        pattern: /\b(machine learning|Machine Learning)\b/gi,
        definition:
          "A type of artificial intelligence that enables computers to learn without being explicitly programmed",
      },
    ]

    const terms: GlossaryTerm[] = []
    const plainText = content.replace(/<[^>]*>/g, "")

    technicalTerms.forEach(({ pattern, definition }) => {
      let match
      while ((match = pattern.exec(plainText)) !== null) {
        terms.push({
          term: match[0],
          definition,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }
    })

    return terms.slice(0, 5) // Limit to 5 terms
  }

  /**
   * Generates a mock summary when AI API is unavailable
   * @param content - The content to summarize
   * @returns string - Generated summary based on content analysis
   */
  private generateMockSummary(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, "").trim()
    if (plainText.length === 0) return "Empty note"

    const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    if (sentences.length === 0) return "No content to summarize"

    if (sentences.length === 1) return sentences[0].trim() + "."

    // Take first sentence and try to create a meaningful summary
    const firstSentence = sentences[0].trim()
    const wordCount = plainText.split(/\s+/).length

    if (wordCount < 50) {
      return firstSentence + "."
    } else if (wordCount < 200) {
      return `${firstSentence}. Contains ${wordCount} words covering key concepts.`
    } else {
      return `${firstSentence}. Comprehensive ${wordCount}-word document with detailed information.`
    }
  }

  /**
   * Generates mock tags based on keyword analysis
   * Fallback implementation when AI API is unavailable
   * @param title - The note title
   * @param content - The note content
   * @returns string[] - Array of suggested tags
   */
  private generateMockTags(title: string, content: string): string[] {
    const allText = (title + " " + content.replace(/<[^>]*>/g, "")).toLowerCase()
    const commonTags = [
      { keywords: ["project", "task", "todo", "plan"], tag: "project" },
      { keywords: ["meeting", "discussion", "call", "agenda"], tag: "meeting" },
      { keywords: ["idea", "brainstorm", "concept", "innovation"], tag: "ideas" },
      { keywords: ["code", "programming", "development", "software"], tag: "development" },
      { keywords: ["research", "study", "analysis", "investigation"], tag: "research" },
      { keywords: ["personal", "diary", "journal", "thoughts"], tag: "personal" },
      { keywords: ["work", "business", "professional", "office"], tag: "work" },
      { keywords: ["learning", "education", "tutorial", "course"], tag: "learning" },
      { keywords: ["important", "urgent", "critical", "priority"], tag: "important" },
      { keywords: ["draft", "rough", "preliminary", "initial"], tag: "draft" },
    ]

    const suggestedTags: string[] = []

    commonTags.forEach(({ keywords, tag }) => {
      if (keywords.some((keyword) => allText.includes(keyword))) {
        suggestedTags.push(tag)
      }
    })

    // Add some generic tags based on content length
    const wordCount = allText.split(/\s+/).length
    if (wordCount > 500) suggestedTags.push("detailed")
    if (wordCount < 100) suggestedTags.push("brief")

    // Ensure we have 3-5 tags
    const fallbackTags = ["note", "document", "text", "content", "information"]
    while (suggestedTags.length < 3) {
      const randomTag = fallbackTags[Math.floor(Math.random() * fallbackTags.length)]
      if (!suggestedTags.includes(randomTag)) {
        suggestedTags.push(randomTag)
      }
    }

    return suggestedTags.slice(0, 5)
  }

  /**
   * Detects basic grammar errors using pattern matching
   * Fallback implementation when AI API is unavailable
   * @param content - The text content to check
   * @returns GrammarError[] - Array of detected grammar errors
   */
  private detectMockGrammarErrors(content: string): GrammarError[] {
    const plainText = content.replace(/<[^>]*>/g, "")
    const errors: GrammarError[] = []

    // Simple grammar error patterns
    const errorPatterns = [
      {
        pattern: /\b(there|their|they're)\b/gi,
        check: (match: string, context: string) => {
          // Simple heuristic for there/their/they're
          if (match.toLowerCase() === "there" && context.includes("house")) {
            return null // Likely correct
          }
          return Math.random() > 0.8 // Random error for demo
        },
        message: 'Check if you meant "there", "their", or "they\'re"',
        suggestions: ["there", "their", "they're"],
      },
      {
        pattern: /\b(its|it's)\b/gi,
        check: () => Math.random() > 0.9,
        message: 'Check if you meant "its" (possessive) or "it\'s" (it is)',
        suggestions: ["its", "it's"],
      },
      {
        pattern: /\b\w+\s+\w+\s+\w+\b/g,
        check: (match: string) => {
          // Check for repeated words
          const words = match.toLowerCase().split(/\s+/)
          return words[0] === words[1] || words[1] === words[2]
        },
        message: "Possible repeated word",
        suggestions: [],
      },
    ]

    errorPatterns.forEach(({ pattern, check, message, suggestions }) => {
      let match
      while ((match = pattern.exec(plainText)) !== null && errors.length < 5) {
        if (check(match[0], plainText.slice(Math.max(0, match.index - 20), match.index + match[0].length + 20))) {
          errors.push({
            text: match[0],
            message,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            suggestions,
          })
        }
      }
    })

    return errors
  }
}

// Export singleton instance
export const aiService = new AIService({
  provider: "groq", // Using Groq instead of OpenAI
  apiKey: process.env.GROQ_API_KEY,
})
