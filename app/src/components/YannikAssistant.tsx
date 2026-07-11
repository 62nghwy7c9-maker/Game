import { signal } from '@preact/signals'
import { useSignal } from '@preact/signals'
import { areas, assignAreas, inboxTasks, settings, tasks } from '../state/store'
import { proposeInboxSorting, type SortProposal } from '../lib/aiSort'
import { askYannik, claudeSortInbox, DEFAULT_AI_MODEL, hasApiKey } from '../lib/ai'
import { BottomSheet } from './BottomSheet'
import { AreaDot } from './AreaBadge'
import { showToast } from './Toast'
import faceImg from '../assets/yannik-face.png'

const open = signal(false)

/** Öffnet KIannik, den KI-Assistenten (von Yannik Potter aus). */
export function openAssistant(): void {
  open.value = true
}

export function YannikAssistant() {
  const proposals = useSignal<SortProposal[] | null>(null)
  const busy = useSignal(false)
  const usedAi = useSignal(false)
  const prompt = useSignal('')
  const answer = useSignal<string | null>(null)

  if (!open.value) return null

  const key = settings.value.claudeApiKey
  const model = settings.value.aiModel || DEFAULT_AI_MODEL
  const aiAvailable = hasApiKey(key)
  const pendingCount = inboxTasks.value.filter((t) => !t.areaId).length

  const close = () => {
    open.value = false
    proposals.value = null
    answer.value = null
    prompt.value = ''
  }

  const sortInbox = async () => {
    busy.value = true
    usedAi.value = false
    try {
      if (aiAvailable) {
        const res = await claudeSortInbox(tasks.value, areas.value, key!, model)
        const byName = new Map(areas.value.filter((a) => !a.archived).map((a) => [a.name, a.id]))
        proposals.value = res
          .map((r) => {
            const areaId = byName.get(r.areaName)
            const task = tasks.value.find((t) => t.id === r.taskId)
            return areaId && task
              ? { taskId: r.taskId, title: task.title, areaId, areaName: r.areaName, reason: r.reason }
              : null
          })
          .filter((x): x is SortProposal => x !== null)
        usedAi.value = true
      } else {
        proposals.value = proposeInboxSorting(tasks.value, areas.value)
      }
      if (proposals.value.length === 0) {
        showToast('KIannik konnte nichts eindeutig zuordnen — alles schon einsortiert? ✨')
      }
    } catch (err) {
      showToast((err as Error).message, { sticky: true, actionLabel: 'OK' })
    } finally {
      busy.value = false
    }
  }

  const applyProposals = () => {
    const n = assignAreas(proposals.value!.map((p) => ({ taskId: p.taskId, areaId: p.areaId })))
    proposals.value = null
    showToast(`${n} ${n === 1 ? 'Eintrag' : 'Einträge'} einsortiert. 🪄`)
  }

  const ask = async () => {
    const q = prompt.value.trim()
    if (!q) return
    busy.value = true
    answer.value = null
    try {
      answer.value = await askYannik(q, key!, model)
    } catch (err) {
      showToast((err as Error).message, { sticky: true, actionLabel: 'OK' })
    } finally {
      busy.value = false
    }
  }

  return (
    <BottomSheet onClose={close} label="KIannik – KI-Assistent">
      <div class="yannik-head">
        <img src={faceImg} alt="KIannik" class="yannik-avatar" />
        <div>
          <h3 style={{ margin: 0 }}>KIannik hilft 🪄</h3>
          <p class="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            {aiAvailable ? `Echte KI aktiv (${model})` : 'Sortier-Magie ohne Netz — kostenlos'}
          </p>
        </div>
      </div>

      <div class="card" style={{ marginTop: 12 }}>
        <div class="card-title">
          <span>🗂️ Inbox sortieren</span>
        </div>
        <p class="muted" style={{ marginBottom: 10 }}>
          {pendingCount > 0
            ? `${pendingCount} Einträge ohne Bereich. KIannik schlägt passende Bereiche vor.`
            : 'Alle Inbox-Einträge haben bereits einen Bereich. 🎉'}
        </p>
        {proposals.value === null ? (
          <button
            class="btn primary"
            disabled={busy.value || pendingCount === 0}
            onClick={sortInbox}
            data-testid="yannik-sort"
          >
            {busy.value ? 'KIannik überlegt …' : 'KIannik sortieren lassen'}
          </button>
        ) : (
          <div data-testid="yannik-proposals">
            {proposals.value.length === 0 ? (
              <p class="muted">Keine eindeutigen Vorschläge.</p>
            ) : (
              <>
                {usedAi.value && <p class="muted" style={{ marginBottom: 6 }}>Von Claude vorgeschlagen ✨</p>}
                {proposals.value.map((p) => (
                  <div class="list-item" key={p.taskId}>
                    <AreaDot areaId={p.areaId} />
                    <span style={{ flex: 1 }}>
                      {p.title}
                      <div class="muted" style={{ fontSize: '0.8rem' }}>
                        → {p.areaName} · {p.reason}
                      </div>
                    </span>
                  </div>
                ))}
                <div class="btn-row" style={{ marginTop: 10 }}>
                  <button class="btn primary" onClick={applyProposals} data-testid="yannik-apply">
                    Übernehmen
                  </button>
                  <button class="btn" onClick={() => (proposals.value = null)}>
                    Verwerfen
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div class="card">
        <div class="card-title">
          <span>💬 Frag KIannik</span>
        </div>
        {aiAvailable ? (
          <>
            <p class="muted" style={{ marginBottom: 10 }}>
              Brainstormen, Gedanken sortieren, Aufgaben formulieren — frag einfach.
            </p>
            <textarea
              rows={3}
              placeholder="z. B. „Hilf mir, mein Vereinsprojekt in Schritte zu zerlegen."
              value={prompt.value}
              onInput={(e) => (prompt.value = (e.target as HTMLTextAreaElement).value)}
              data-testid="yannik-prompt"
            />
            <button class="btn primary" disabled={busy.value || !prompt.value.trim()} onClick={ask} style={{ marginTop: 8 }}>
              {busy.value ? 'KIannik denkt nach …' : 'Fragen'}
            </button>
            {answer.value && (
              <div class="yannik-answer" data-testid="yannik-answer">
                {answer.value}
              </div>
            )}
          </>
        ) : (
          <p class="muted">
            Für echtes Brainstorming trägst du in den <strong>Einstellungen</strong> deinen eigenen Claude-API-Schlüssel
            ein. Er bleibt nur auf diesem Gerät. Das Sortieren oben funktioniert auch ohne — kostenlos.
          </p>
        )}
      </div>
    </BottomSheet>
  )
}
