import { useSignal } from '@preact/signals'
import {
  backlinksOf,
  deleteNote,
  ensureNoteByTitle,
  noteById,
  updateNote,
} from '../state/store'
import { navigate, route } from '../router'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { renderMarkdown, snippet } from '../lib/markdown'
import { showToast } from '../components/Toast'

export function NotizDetail() {
  const id = route.value.params[0]
  const note = noteById(id)
  const mode = useSignal<'schreiben' | 'lesen'>(note && note.body ? 'lesen' : 'schreiben')
  const confirmDelete = useSignal(false)

  if (!note) {
    return (
      <div class="view">
        <div class="empty-state">
          <p>Notiz nicht gefunden.</p>
          <button class="btn" onClick={() => navigate('/notizen')}>
            Zurück zum Vault
          </button>
        </div>
      </div>
    )
  }

  // Klicks auf [[Verlinkungen]] und #Tags im gerenderten Markdown abfangen
  const onRenderedClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest('a')
    if (!el) return
    if (el.classList.contains('wikilink')) {
      e.preventDefault()
      const target = ensureNoteByTitle(el.getAttribute('data-title') || '')
      navigate(`/notiz/${target.id}`)
    } else if (el.classList.contains('tag')) {
      e.preventDefault()
      navigate(`/notizen?tag=${encodeURIComponent(el.getAttribute('data-tag') || '')}`)
    }
  }

  const backlinks = backlinksOf(note)

  return (
    <div class="view note-editor">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button class="btn small" onClick={() => navigate('/notizen')} aria-label="Zurück">
          ‹
        </button>
        <div class="seg" style={{ marginLeft: 'auto' }}>
          <button class={mode.value === 'schreiben' ? 'active' : ''} onClick={() => (mode.value = 'schreiben')} data-testid="mode-write">
            Schreiben
          </button>
          <button class={mode.value === 'lesen' ? 'active' : ''} onClick={() => (mode.value = 'lesen')} data-testid="mode-read">
            Lesen
          </button>
        </div>
      </div>

      <input
        type="text"
        class="note-title-input"
        value={note.title}
        placeholder="Titel"
        onInput={(e) => updateNote(note.id, { title: (e.target as HTMLInputElement).value })}
        data-testid="note-title"
      />

      {mode.value === 'schreiben' ? (
        <textarea
          value={note.body}
          placeholder={'Schreibe in Markdown …\n\n# Überschrift\n- Liste\n- [ ] Aufgabe\n\nVerweise mit [[Andere Notiz]] und markiere mit #tag.'}
          onInput={(e) => updateNote(note.id, { body: (e.target as HTMLTextAreaElement).value })}
          data-testid="note-body"
        />
      ) : (
        <div
          class="md"
          onClick={onRenderedClick}
          data-testid="note-rendered"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: renderMarkdown(note.body) || '<p class="muted">Leere Notiz — wechsle zu „Schreiben".</p>' }}
        />
      )}

      {backlinks.length > 0 && (
        <div class="backlinks" data-testid="backlinks">
          <h4>↩ Verweise auf diese Notiz ({backlinks.length})</h4>
          {backlinks.map((b) => (
            <button key={b.id} class="note-list-item" onClick={() => navigate(`/notiz/${b.id}`)}>
              <h3>{b.title || '(ohne Titel)'}</h3>
              <div class="snip">{snippet(b.body)}</div>
            </button>
          ))}
        </div>
      )}

      <div class="btn-row">
        <button class="btn danger small" onClick={() => (confirmDelete.value = true)} data-testid="delete-note">
          Notiz löschen
        </button>
      </div>

      {confirmDelete.value && (
        <ConfirmDialog
          title="Notiz löschen?"
          text={`„${note.title || '(ohne Titel)'}" wird endgültig entfernt.`}
          confirmLabel="Löschen"
          danger
          onConfirm={() => {
            deleteNote(note.id)
            showToast('Notiz gelöscht.')
            navigate('/notizen')
          }}
          onCancel={() => (confirmDelete.value = false)}
        />
      )}
    </div>
  )
}
