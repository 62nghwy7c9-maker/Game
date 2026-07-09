import { signal, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { BottomSheet } from './BottomSheet'
import { activeAreas, captureTask, createNote } from '../state/store'
import { navigate } from '../router'
import { showToast } from './Toast'

export const captureOpen = signal(false)

export function openCapture(): void {
  captureOpen.value = true
}

export function CaptureSheet() {
  const text = useSignal('')
  const areaId = useSignal<string | undefined>(undefined)
  const count = useSignal(0)
  const mode = useSignal<'aufgabe' | 'notiz'>('aufgabe')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (captureOpen.value) {
      count.value = 0
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [captureOpen.value])

  if (!captureOpen.value) return null

  const save = () => {
    const title = text.value.trim()
    if (!title) return
    captureTask(title, areaId.value)
    count.value += 1
    text.value = ''
    areaId.value = undefined
    inputRef.current?.focus()
  }

  const createNoteAndOpen = () => {
    const title = text.value.trim()
    if (!title) return
    const note = createNote(title, '')
    text.value = ''
    captureOpen.value = false
    navigate(`/notiz/${note.id}`)
  }

  const close = () => {
    if (mode.value === 'aufgabe' && text.value.trim()) save()
    captureOpen.value = false
    if (count.value > 0) {
      showToast(count.value === 1 ? 'In der Inbox gespeichert.' : `${count.value} Einträge in der Inbox gespeichert.`)
    }
  }

  const isNote = mode.value === 'notiz'

  return (
    <BottomSheet onClose={close} label="Schnell erfassen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Schnell erfassen</h3>
        <div class="seg" style={{ marginLeft: 'auto' }}>
          <button class={!isNote ? 'active' : ''} onClick={() => (mode.value = 'aufgabe')} data-testid="capture-mode-task">
            Aufgabe
          </button>
          <button class={isNote ? 'active' : ''} onClick={() => (mode.value = 'notiz')} data-testid="capture-mode-note">
            Notiz
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder={isNote ? 'Titel der Notiz …' : 'Was geht dir durch den Kopf?'}
        value={text.value}
        onInput={(e) => (text.value = (e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') isNote ? createNoteAndOpen() : save()
        }}
        data-testid="capture-input"
      />
      {!isNote && (
        <div class="chip-row" style={{ marginTop: 10 }}>
          {activeAreas.value.map((a) => (
            <button
              key={a.id}
              class={`chip ${areaId.value === a.id ? 'active' : ''}`}
              onClick={() => (areaId.value = areaId.value === a.id ? undefined : a.id)}
            >
              <span class="area-dot" style={{ background: a.color }} />
              {a.name}
            </button>
          ))}
        </div>
      )}
      {isNote && (
        <p class="muted" style={{ marginTop: 10 }}>
          Legt eine neue Notiz an und öffnet sie zum Schreiben (Markdown, [[Verlinkungen]], #Tags).
        </p>
      )}
      {!isNote && count.value > 0 && (
        <p class="muted" style={{ marginTop: 10 }}>
          {count.value} {count.value === 1 ? 'Eintrag' : 'Einträge'} erfasst — weiter tippen oder „Fertig".
        </p>
      )}
      <div class="btn-row">
        {isNote ? (
          <button class="btn primary" onClick={createNoteAndOpen} disabled={!text.value.trim()} data-testid="capture-note-create">
            Notiz anlegen & öffnen
          </button>
        ) : (
          <button class="btn primary" onClick={save} disabled={!text.value.trim()} data-testid="capture-save">
            Speichern
          </button>
        )}
        <button class="btn" onClick={close} data-testid="capture-done">
          {isNote ? 'Abbrechen' : 'Fertig'}
        </button>
      </div>
    </BottomSheet>
  )
}
