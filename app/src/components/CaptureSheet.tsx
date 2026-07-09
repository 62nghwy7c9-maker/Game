import { signal, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { BottomSheet } from './BottomSheet'
import { activeAreas, captureTask } from '../state/store'
import { showToast } from './Toast'

export const captureOpen = signal(false)

export function openCapture(): void {
  captureOpen.value = true
}

export function CaptureSheet() {
  const text = useSignal('')
  const areaId = useSignal<string | undefined>(undefined)
  const count = useSignal(0)
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

  const close = () => {
    if (text.value.trim()) save()
    captureOpen.value = false
    if (count.value > 0) {
      showToast(count.value === 1 ? 'In der Inbox gespeichert.' : `${count.value} Einträge in der Inbox gespeichert.`)
    }
  }

  return (
    <BottomSheet onClose={close} label="Schnell erfassen">
      <h3>Schnell erfassen</h3>
      <input
        ref={inputRef}
        type="text"
        placeholder="Was geht dir durch den Kopf?"
        value={text.value}
        onInput={(e) => (text.value = (e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
        }}
        data-testid="capture-input"
      />
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
      {count.value > 0 && (
        <p class="muted" style={{ marginTop: 10 }}>
          {count.value} {count.value === 1 ? 'Eintrag' : 'Einträge'} erfasst — weiter tippen oder „Fertig".
        </p>
      )}
      <div class="btn-row">
        <button class="btn primary" onClick={save} disabled={!text.value.trim()} data-testid="capture-save">
          Speichern
        </button>
        <button class="btn" onClick={close} data-testid="capture-done">
          Fertig
        </button>
      </div>
    </BottomSheet>
  )
}
