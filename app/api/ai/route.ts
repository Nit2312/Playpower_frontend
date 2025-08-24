import Groq from "groq-sdk"

export const runtime = "nodejs"

interface AIRequest {
  action: "summarize" | "tags" | "glossary" | "grammar" | "translate"
  title?: string
  content: string
  targetLang?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AIRequest
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not set on the server. Falling back to mocks." }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    const groq = new Groq({ apiKey })

    // Use a broadly available model to avoid 400s due to model name
    const model = "llama-3.1-8b-instant"

    switch (body.action) {
      case "summarize": {
        const prompt = `Summarize the following note in 1-2 sentences, plain text only.\n\nNote:\n${stripHtml(
          body.content,
        )}`
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a concise assistant for a note app." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 180,
        }).catch((err: any) => {
          console.error("groq summarize error", err?.response ?? err)
          throw new Error(err?.response?.data?.error ?? "Groq summarize failed")
        })
        const text = completion.choices?.[0]?.message?.content?.trim() || ""
        return json({ summary: text })
      }
      case "tags": {
        const prompt = `Suggest 3-5 short, lowercase tags for the note. Reply as a JSON array of strings only.\n\nTitle: ${
          body.title || ""
        }\nContent: ${stripHtml(body.content)}`
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You generate minimal tag arrays for a note app." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 120,
        }).catch((err: any) => {
          console.error("groq tags error", err?.response ?? err)
          throw new Error(err?.response?.data?.error ?? "Groq tags failed")
        })
        const text = completion.choices?.[0]?.message?.content?.trim() || "[]"
        let tags: string[] = []
        try {
          tags = JSON.parse(text)
        } catch {
          // Fallback: try to parse simple comma-separated text
          tags = text
            .replace(/\[|\]|"/g, "")
            .split(/[\,\n]/)
            .map((t: string) => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 5)
        }
        if (tags.length > 5) tags = tags.slice(0, 5)
        return json({ tags })
      }
      case "translate": {
        const lang = (body.targetLang || "English").trim()
        const prompt = `Translate the following text to ${lang}. Preserve meaning and tone. Return plain text only without quotes.
\nText:\n${stripHtml(body.content)}`
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a helpful translation assistant for a note app." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 600,
        }).catch((err: any) => {
          console.error("groq translate error", err?.response ?? err)
          throw new Error(err?.response?.data?.error ?? "Groq translate failed")
        })
        const text = completion.choices?.[0]?.message?.content?.trim() || ""
        return json({ translation: text })
      }
      case "glossary": {
        const prompt = `Extract up to 5 important technical terms from the note and define each in 1 sentence.\nReturn strictly JSON: [{\n  \"term\": string,\n  \"definition\": string\n}] with at most 5 items.\n\nNote:\n${stripHtml(
          body.content,
        )}`
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You extract key terms for a note app and return strict JSON." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 300,
        }).catch((err: any) => {
          console.error("groq glossary error", err?.response ?? err)
          throw new Error(err?.response?.data?.error ?? "Groq glossary failed")
        })
        const text = completion.choices?.[0]?.message?.content?.trim() || "[]"
        let terms: Array<{ term: string; definition: string }> = []
        try {
          terms = JSON.parse(text)
        } catch {
          terms = []
        }
        return json({ glossary: terms })
      }
      case "grammar": {
        const prompt = `Find up to 5 grammar or style issues in the note. Return strict JSON array of:\n{\n  \"text\": string,\n  \"message\": string,\n  \"suggestions\": string[]\n}\nOnly include items you are reasonably confident about.\n\nNote:\n${stripHtml(body.content)}`
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a careful grammar checker for a note app and return strict JSON." },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 400,
        }).catch((err: any) => {
          console.error("groq grammar error", err?.response ?? err)
          throw new Error(err?.response?.data?.error ?? "Groq grammar failed")
        })
        const text = completion.choices?.[0]?.message?.content?.trim() || "[]"
        let issues: Array<{ text: string; message: string; suggestions: string[] }> = []
        try {
          issues = JSON.parse(text)
        } catch {
          issues = []
        }
        return json({ grammar: issues })
      }
      default:
        return json({ error: "Unsupported action" }, 400)
    }
  } catch (err) {
    console.error("/api/ai error", err)
    const message = (err as any)?.message || (err as any)?.toString?.() || "AI service error"
    return json({ error: message }, 500)
  }
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim()
}
