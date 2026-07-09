import { useSignal } from '@preact/signals'
import {
  activeAreas,
  assignTaskToBlock,
  deleteTask,
  inboxTasks,
  nextPufferBlock,
  updateTask,
} from '../state/store'
import { navigate } from '../router'
import { showToast } from '../components/Toast'
import { formatDateShort, todayIso } from '../lib/dates'
import { AreaDot } from '../components/AreaBadge'

/** Geführter Triage-Flow — eigenständig nutzbar und im Rückblick eingebettet. */
export function TriageFlow(props: { onFinished?: () => void }) {
  const total = useSignal(inboxTasks.value.length)
  const done = useSignal(0)
  const detailMode = useSignal(false)
  const pickedArea = useSignal<string | undefined>(undefined)
  const pickedDate = useSignal<string>(todayIso())

  const current = inboxTasks.value[0]

  if (!current) {
    return (
      <div class="empty-state" data-testid="triage-done">
        <div class="big">🎉</div>
        <p>Inbox leer — alles einsortiert!</p>
        {props.onFinished && (
          <button class="btn primary" style={{ marginTop: 12 }} onClick={props.onFinished}>
            Weiter
          </button>
        )}
      </div>
    )
  }

  const advance = () => {
    done.value += 1
    detailMode.value = false
    pickedArea.value = undefined
    pickedDate.value = todayIso()
  }

  const sofort = () => {
    updateTask(current.id, { status: 'erledigt', completedAt: new Date().toISOString() })
    showToast('Als erledigt abgehakt.')
    advance()
  }

  const puffer = () => {
    const hit = nextPufferBlock()
    if (!hit) {
      showToast('Kein Pufferblock gefunden — lege im Wochenplan einen Block vom Typ „Puffer" an.', { sticky: true, actionLabel: 'OK' })
      return
    }
    assignTaskToBlock(current.id, hit.weekId, hit.block.id)
    showToast(`In Pufferblock am ${formatDateShort(hit.block.date)} um ${hit.block.start} gelegt.`)
    advance()
  }

  const wochenplanung = () => {
    updateTask(current.id, { status: 'offen', plannedDate: undefined, plannedBlockId: undefined })
    showToast('In die Wochenplanung übernommen.')
    advance()
  }

  const bereichDatum = () => {
    updateTask(current.id, {
      status: 'offen',
      areaId: pickedArea.value ?? current.areaId,
      plannedDate: pickedDate.value || undefined,
    })
    showToast('Einsortiert.')
    advance()
  }

  const verwerfen = () => {
    deleteTask(current.id)
    showToast('Gelöscht.')
    advance()
  }

  return (
    <div data-testid="triage-flow">
      <p class="muted" style={{ marginBottom: 10 }}>
        {Math.min(done.value + 1, total.value)}/{total.value}
      </p>
      <div class="card" style={{ padding: 20 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }} data-testid="triage-title">
          {current.title}
        </div>
        <div class="muted" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <AreaDot areaId={current.areaId} />
          <span>erfasst {formatDateShort(current.createdAt.slice(0, 10))}</span>
        </div>

        {!detailMode.value ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <button class="btn" onClick={sofort} data-testid="triage-sofort">
              ✅ Sofort erledigt
            </button>
            <button class="btn" onClick={puffer} data-testid="triage-puffer">
              🧯 In nächsten Pufferblock
            </button>
            <button class="btn" onClick={wochenplanung} data-testid="triage-woche">
              🗓️ In Wochenplanung (ohne Datum)
            </button>
            <button class="btn" onClick={() => (detailMode.value = true)} data-testid="triage-detail">
              🏷️ Bereich &amp; Datum wählen …
            </button>
            <button class="btn danger" onClick={verwerfen} data-testid="triage-loeschen">
              🗑️ Löschen
            </button>
          </div>
        ) : (
          <div>
            <div class="chip-row" style={{ marginBottom: 12 }}>
              {activeAreas.value.map((a) => (
                <button
                  key={a.id}
                  class={`chip ${pickedArea.value === a.id ? 'active' : ''}`}
                  onClick={() => (pickedArea.value = a.id)}
                >
                  <span class="area-dot" style={{ background: a.color }} />
                  {a.name}
                </button>
              ))}
            </div>
            <label class="field">
              <span>Geplant für</span>
              <input
                type="date"
                value={pickedDate.value}
                onInput={(e) => (pickedDate.value = (e.target as HTMLInputElement).value)}
              />
            </label>
            <div class="btn-row">
              <button class="btn primary" onClick={bereichDatum} data-testid="triage-detail-save">
                Übernehmen
              </button>
              <button class="btn" onClick={() => (detailMode.value = false)}>
                Zurück
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function TriageView() {
  return (
    <div class="view">
      <h1 class="view-title">Triage</h1>
      <p class="view-subtitle">Ein Eintrag nach dem anderen — vier Wege, fertig.</p>
      <TriageFlow onFinished={() => navigate('/inbox')} />
    </div>
  )
}
