import { useSignal } from '@preact/signals'
import { allNoteTags, createNote, notes } from '../state/store'
import { navigate, route } from '../router'
import { extractTags, snippet } from '../lib/markdown'

export function NotizenView() {
  const query = useSignal('')
  const activeTag = useSignal<string | null>(route.value.query.get('tag'))

  const list = [...notes.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const q = query.value.trim().toLowerCase()

  const filtered = list.filter((n) => {
    if (activeTag.value && !extractTags(n.body).some((t) => t.toLowerCase() === activeTag.value!.toLowerCase())) {
      return false
    }
    if (q && !(n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))) return false
    return true
  })

  const tags = allNoteTags()

  const newNote = () => {
    const n = createNote()
    navigate(`/notiz/${n.id}`)
  }

  return (
    <div class="view">
      <h1 class="view-title">Notizen</h1>
      <p class="view-subtitle">Dein zweites Gehirn: Markdown, [[Verlinkungen]] und #Tags.</p>

      <div class="btn-row" style={{ marginTop: 0, marginBottom: 12 }}>
        <button class="btn primary" onClick={newNote} data-testid="new-note">
          + Neue Notiz
        </button>
        <button class="btn" onClick={() => navigate('/graph')} data-testid="open-graph">
          🕸 Graph
        </button>
      </div>

      <input
        type="search"
        placeholder="Notizen durchsuchen …"
        value={query.value}
        onInput={(e) => (query.value = (e.target as HTMLInputElement).value)}
        data-testid="note-search"
        style={{ marginBottom: 10 }}
      />

      {tags.length > 0 && (
        <div class="chip-row" style={{ marginBottom: 14 }}>
          {activeTag.value && (
            <button class="chip active" onClick={() => (activeTag.value = null)}>
              #{activeTag.value} ✕
            </button>
          )}
          {tags
            .filter((t) => t.tag !== activeTag.value?.toLowerCase())
            .slice(0, 12)
            .map((t) => (
              <button key={t.tag} class="chip" onClick={() => (activeTag.value = t.tag)}>
                #{t.tag} <span class="muted">{t.count}</span>
              </button>
            ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div class="empty-state">
          <div class="big">🧠</div>
          <p>{notes.value.length === 0 ? 'Noch keine Notizen.' : 'Keine Treffer.'}</p>
          {notes.value.length === 0 && (
            <p class="muted">Lege eine Notiz an und verweise mit [[Titel]] auf andere.</p>
          )}
        </div>
      ) : (
        filtered.map((n) => (
          <button key={n.id} class="note-list-item" onClick={() => navigate(`/notiz/${n.id}`)} data-testid="note-item">
            <h3>{n.title || '(ohne Titel)'}</h3>
            <div class="snip">{snippet(n.body) || 'Leere Notiz'}</div>
          </button>
        ))
      )}
    </div>
  )
}
