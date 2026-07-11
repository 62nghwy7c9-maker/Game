import { Marked } from 'marked'

/** Alle [[Verlinkungen]] eines Textes (getrimmte Titel, in Reihenfolge, ohne Duplikate). */
export function extractLinks(body: string): string[] {
  const out: string[] = []
  const re = /\[\[([^\]]+)\]\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    const t = m[1].trim()
    if (t && !out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t)
  }
  return out
}

/** Alle #Tags eines Textes (ohne #, ohne Duplikate). Nicht am Zeilenanfang mit Leerzeichen (= Überschrift). */
export function extractTags(body: string): string[] {
  const out: string[] = []
  const re = /(^|[^\w#])#([\p{L}\d_][\p{L}\d_/-]*)/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    const t = m[2]
    if (!out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t)
  }
  return out
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const marked = new Marked({
  gfm: true,
  breaks: true,
})

marked.use({
  extensions: [
    {
      name: 'wikilink',
      level: 'inline',
      start(src: string) {
        const i = src.indexOf('[[')
        return i < 0 ? undefined : i
      },
      tokenizer(src: string) {
        const m = /^\[\[([^\]]+)\]\]/.exec(src)
        if (m) return { type: 'wikilink', raw: m[0], text: m[1].trim() }
        return undefined
      },
      renderer(token) {
        const text = String((token as { text?: string }).text ?? '')
        return `<a href="#" class="wikilink" data-title="${escAttr(text)}">${escHtml(text)}</a>`
      },
    },
    {
      name: 'tag',
      level: 'inline',
      start(src: string) {
        const m = /(^|\s)#[\p{L}\d_]/u.exec(src)
        return m ? m.index + (m[1] ? 1 : 0) : undefined
      },
      tokenizer(src: string) {
        const m = /^#([\p{L}\d_][\p{L}\d_/-]*)/u.exec(src)
        if (m) return { type: 'tag', raw: m[0], text: m[1] }
        return undefined
      },
      renderer(token) {
        const text = String((token as { text?: string }).text ?? '')
        return `<a href="#" class="tag" data-tag="${escAttr(text)}">#${escHtml(text)}</a>`
      },
    },
  ],
})

/** Rendert Notiz-Markdown (inkl. [[Links]] und #Tags) zu HTML. */
export function renderMarkdown(body: string): string {
  return marked.parse(body || '', { async: false }) as string
}

/** Kurzer Klartext-Auszug für Listen. */
export function snippet(body: string, max = 120): string {
  const text = body
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[#*_`>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.slice(0, max) + '…' : text
}
