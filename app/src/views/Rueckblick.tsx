import { useSignal } from '@preact/signals'
import {
  applyTemplate,
  dayPlans,
  ensureWeek,
  inboxTasks,
  reviews,
  saveReview,
  tasks,
} from '../state/store'
import { TriageFlow } from './TriageView'
import { Top3Editor } from '../components/Top3Editor'
import { navigate } from '../router'
import { showToast } from '../components/Toast'
import { daysSinceLastBackup } from '../lib/backup'
import { addWeeks, currentWeekId, datesOfWeek, weekLabel } from '../lib/dates'
import { nowIso } from '../lib/id'

function weekStats(weekId: string) {
  const dates = datesOfWeek(weekId)
  const inWeek = (iso?: string) => !!iso && dates.includes(iso.slice(0, 10))
  const erledigt = tasks.value.filter((t) => t.status === 'erledigt' && inWeek(t.completedAt)).length
  const plans = dayPlans.value.filter((p) => dates.includes(p.id))
  const top3Gesamt = plans.reduce((n, p) => n + p.top3.length, 0)
  const top3Erledigt = plans.reduce((n, p) => n + p.top3.filter((t) => t.done).length, 0)
  return { erledigt, top3Gesamt, top3Erledigt }
}

export function Rueckblick() {
  const weekId = currentWeekId()
  const nextWeek = addWeeks(weekId, 1)
  const step = useSignal(1)
  const gutGelaufen = useSignal('')
  const planGesprengt = useSignal('')
  const erkenntnis = useSignal('')
  const inboxVorher = useSignal(inboxTasks.value.length)
  const templateApplied = useSignal(false)

  const stats = weekStats(weekId)
  const existing = reviews.value.find((r) => r.id === weekId)
  const backupDays = daysSinceLastBackup()

  const finish = () => {
    saveReview({
      id: weekId,
      gutGelaufen: gutGelaufen.value,
      planGesprengt: planGesprengt.value,
      erkenntnis: erkenntnis.value,
      stats: {
        erledigteTasks: stats.erledigt,
        top3Gesamt: stats.top3Gesamt,
        top3Erledigt: stats.top3Erledigt,
        inboxVorher: inboxVorher.value,
        inboxNachher: inboxTasks.value.length,
      },
      completedAt: nowIso(),
    })
    showToast('Woche abgeschlossen ✓')
    navigate('/heute')
  }

  return (
    <div class="view">
      <h1 class="view-title">Wochenrückblick</h1>
      <p class="view-subtitle">
        {weekLabel(weekId)} · Schritt {step.value}/5
      </p>

      {existing && step.value === 1 && (
        <p class="muted" style={{ marginBottom: 10 }}>
          Für diese Woche gibt es schon einen Rückblick — ein neuer Durchlauf überschreibt ihn.
        </p>
      )}

      {backupDays !== null && backupDays > 14 && (
        <div class="card" style={{ borderColor: 'var(--warning)' }}>
          💾 Letztes Backup vor {backupDays} Tagen — in den{' '}
          <a href="#/einstellungen">Einstellungen</a> exportieren.
        </div>
      )}
      {backupDays === null && (
        <div class="card" style={{ borderColor: 'var(--warning)' }}>
          💾 Noch nie ein Backup gemacht — deine Daten liegen nur auf diesem Gerät. In den{' '}
          <a href="#/einstellungen">Einstellungen</a> exportieren.
        </div>
      )}

      {step.value === 1 && (
        <div class="card" data-testid="review-step1">
          <div class="card-title">
            <span>So lief die Woche</span>
          </div>
          <div class="list-item">
            <span style={{ flex: 1 }}>Aufgaben erledigt</span>
            <strong>{stats.erledigt}</strong>
          </div>
          <div class="list-item">
            <span style={{ flex: 1 }}>Top-3 geschafft</span>
            <strong>
              {stats.top3Erledigt}/{stats.top3Gesamt || 0}
            </strong>
          </div>
          <div class="list-item">
            <span style={{ flex: 1 }}>In der Inbox</span>
            <strong>{inboxTasks.value.length}</strong>
          </div>
          <div class="btn-row">
            <button class="btn primary" onClick={() => (step.value = 2)} data-testid="review-next">
              Weiter
            </button>
          </div>
        </div>
      )}

      {step.value === 2 && (
        <div class="card" data-testid="review-step2">
          <div class="card-title">
            <span>Drei Fragen</span>
          </div>
          <label class="field">
            <span>Was lief gut?</span>
            <textarea
              value={gutGelaufen.value}
              onInput={(e) => (gutGelaufen.value = (e.target as HTMLTextAreaElement).value)}
              data-testid="review-q1"
            />
          </label>
          <label class="field">
            <span>Was hat den Plan gesprengt?</span>
            <textarea
              value={planGesprengt.value}
              onInput={(e) => (planGesprengt.value = (e.target as HTMLTextAreaElement).value)}
              data-testid="review-q2"
            />
          </label>
          <label class="field">
            <span>Eine Erkenntnis für nächste Woche</span>
            <textarea
              value={erkenntnis.value}
              onInput={(e) => (erkenntnis.value = (e.target as HTMLTextAreaElement).value)}
              data-testid="review-q3"
            />
          </label>
          <div class="btn-row">
            <button class="btn primary" onClick={() => (step.value = 3)} data-testid="review-next">
              Weiter
            </button>
            <button class="btn" onClick={() => (step.value = 1)}>
              Zurück
            </button>
          </div>
        </div>
      )}

      {step.value === 3 && (
        <div data-testid="review-step3">
          <div class="card">
            <div class="card-title">
              <span>Inbox leeren</span>
            </div>
            {inboxTasks.value.length === 0 ? (
              <p class="muted">Inbox ist leer — perfekt.</p>
            ) : (
              <TriageFlow />
            )}
            <div class="btn-row">
              <button class="btn primary" onClick={() => (step.value = 4)} data-testid="review-next">
                Weiter
              </button>
              <button class="btn" onClick={() => (step.value = 2)}>
                Zurück
              </button>
            </div>
          </div>
        </div>
      )}

      {step.value === 4 && (
        <div class="card" data-testid="review-step4">
          <div class="card-title">
            <span>Nächste Woche vorbereiten</span>
          </div>
          <p class="muted" style={{ marginBottom: 10 }}>
            {weekLabel(nextWeek)} mit deiner Standardwoche füllen und danach im Wochenplan nachjustieren.
          </p>
          <div class="btn-row">
            <button
              class="btn"
              disabled={templateApplied.value}
              onClick={() => {
                ensureWeek(nextWeek)
                const { added, skipped } = applyTemplate(nextWeek)
                templateApplied.value = true
                showToast(`${added} Blöcke eingefügt${skipped ? `, ${skipped} übersprungen` : ''}.`)
              }}
              data-testid="review-apply-template"
            >
              {templateApplied.value ? 'Vorlage angewendet ✓' : 'Vorlage anwenden'}
            </button>
            <button class="btn" onClick={() => navigate(`/woche/${nextWeek}`)}>
              Woche ansehen
            </button>
          </div>
          <div class="btn-row">
            <button class="btn primary" onClick={() => (step.value = 5)} data-testid="review-next">
              Weiter
            </button>
            <button class="btn" onClick={() => (step.value = 3)}>
              Zurück
            </button>
          </div>
        </div>
      )}

      {step.value === 5 && (
        <div data-testid="review-step5">
          <Top3Editor dateIso={datesOfWeek(nextWeek)[0]} title="Top-3 für Montag" />
          <div class="btn-row">
            <button class="btn primary" onClick={finish} data-testid="review-finish">
              Woche abschließen ✓
            </button>
            <button class="btn" onClick={() => (step.value = 4)}>
              Zurück
            </button>
          </div>
        </div>
      )}

      {reviews.value.length > 0 && step.value === 1 && (
        <div class="card" style={{ marginTop: 20 }}>
          <div class="card-title">
            <span>Frühere Rückblicke</span>
          </div>
          {[...reviews.value]
            .sort((a, b) => b.id.localeCompare(a.id))
            .slice(0, 8)
            .map((r) => (
              <div class="list-item" key={r.id}>
                <div style={{ flex: 1 }}>
                  <strong>{weekLabel(r.id)}</strong>
                  <div class="muted">
                    {r.stats.erledigteTasks} erledigt · Top-3 {r.stats.top3Erledigt}/{r.stats.top3Gesamt}
                    {r.erkenntnis && ` · „${r.erkenntnis.slice(0, 60)}${r.erkenntnis.length > 60 ? '…' : ''}"`}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
