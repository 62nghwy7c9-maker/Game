import type { Area, Task } from '../types'

/**
 * Optionale echte KI über Claude — „Bring your own key".
 * Der Schlüssel des Nutzers bleibt ausschließlich lokal auf dem Gerät
 * (in den Einstellungen/localStorage) und wird nur direkt an Anthropics
 * API gesendet, an keinen anderen Server.
 */

const API_URL = 'https://api.anthropic.com/v1/messages'

/** Auswählbare Modelle mit grober Kostenangabe (pro 1 Mio. Tokens). */
export const AI_MODELS: { id: string; label: string }[] = [
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5 — günstig & schnell' },
  { id: 'claude-sonnet-5', label: 'Sonnet 5 — ausgewogen' },
  { id: 'claude-opus-4-8', label: 'Opus 4.8 — am stärksten' },
]

export const DEFAULT_AI_MODEL = 'claude-haiku-4-5'

export function hasApiKey(key?: string): boolean {
  return !!key && key.trim().length > 10
}

interface ClaudeTextBlock {
  type: string
  text?: string
}

async function callClaude(opts: {
  apiKey: string
  model: string
  system?: string
  user: string
  maxTokens?: number
}): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      thinking: { type: 'adaptive' },
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: 'user', content: opts.user }],
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const err = (await res.json()) as { error?: { message?: string } }
      detail = err?.error?.message ?? ''
    } catch {
      /* ignorieren */
    }
    if (res.status === 401) throw new Error('Der API-Schlüssel wurde nicht akzeptiert. Bitte in den Einstellungen prüfen.')
    if (res.status === 429) throw new Error('Zu viele Anfragen oder Guthaben aufgebraucht. Bitte später erneut versuchen.')
    throw new Error(`Claude-Anfrage fehlgeschlagen (${res.status})${detail ? `: ${detail}` : ''}`)
  }

  const data = (await res.json()) as { content?: ClaudeTextBlock[] }
  const text = (data.content ?? [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
    .trim()
  return text
}

/** Freie Brainstorming-/Nachdenk-Anfrage an Yannik. */
export async function askYannik(prompt: string, apiKey: string, model: string): Promise<string> {
  const system =
    'Du bist Yannik, ein freundlicher, humorvoller Zauberer-Assistent in einer deutschen ' +
    'Produktivitäts-App namens Zeitzauber. Du hilfst beim Sortieren von Gedanken, beim ' +
    'Brainstormen und beim Strukturieren von Aufgaben. Antworte auf Deutsch, prägnant und ' +
    'praktisch, gern mit einer kleinen magischen Note.'
  return callClaude({ apiKey, model, system, user: prompt, maxTokens: 1500 })
}

export interface AiSortResult {
  taskId: string
  areaName: string
  reason: string
}

/**
 * Echte KI-Zuordnung der Inbox: Claude bekommt die Einträge und die Bereiche
 * und liefert je Eintrag den passendsten Bereich als JSON zurück.
 */
export async function claudeSortInbox(
  tasks: Task[],
  areas: Area[],
  apiKey: string,
  model: string,
): Promise<AiSortResult[]> {
  const items = tasks
    .filter((t) => t.status === 'inbox' && !t.areaId)
    .map((t) => ({ id: t.id, text: t.notes ? `${t.title} — ${t.notes}` : t.title }))
  if (items.length === 0) return []

  const areaNames = areas.filter((a) => !a.archived).map((a) => a.name)
  const system =
    'Du bist Yannik, ein Sortier-Assistent. Ordne jeden Eintrag genau einem der ' +
    'vorgegebenen Lebensbereiche zu. Antworte AUSSCHLIESSLICH mit einem JSON-Array, ' +
    'ohne Erklärtext davor oder danach.'
  const user =
    `Lebensbereiche: ${JSON.stringify(areaNames)}\n\n` +
    `Einträge:\n${JSON.stringify(items, null, 2)}\n\n` +
    'Gib ein JSON-Array zurück. Jedes Objekt: {"id": "<Eintrags-ID>", "area": "<einer der Bereiche>", ' +
    '"reason": "<kurze Begründung>"}. Nutze nur Bereiche aus der Liste.'

  const raw = await callClaude({ apiKey, model, system, user, maxTokens: 2000 })
  const json = extractJsonArray(raw)
  const parsed = JSON.parse(json) as { id: string; area: string; reason?: string }[]
  return parsed
    .filter((p) => p && p.id && areaNames.includes(p.area))
    .map((p) => ({ taskId: p.id, areaName: p.area, reason: p.reason ?? 'von Yannik einsortiert' }))
}

/** Zieht das erste JSON-Array aus einer Modellantwort (falls in Prosa gehüllt). */
function extractJsonArray(text: string): string {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start >= 0 && end > start) return text.slice(start, end + 1)
  return text
}
