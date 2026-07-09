import { activeAreas, inboxTasks, settings, tasks, weekById } from '../state/store'
import { Top3Editor } from '../components/Top3Editor'
import { BrainHeader } from '../components/BrainHeader'
import { blockColor } from '../components/WeekGrid'
import { currentWeekId, minutesLabel, toHHMM, toMinutes, todayIso } from '../lib/dates'
import { freeSlotsOfDay } from '../lib/freeslots'
import { navigate } from '../router'

export function Heute() {
  const today = todayIso()
  const weekId = currentWeekId()
  const week = weekById(weekId)
  const todayBlocks = (week?.blocks ?? [])
    .filter((b) => b.date === today)
    .sort((a, b) => a.start.localeCompare(b.start))
  const free = freeSlotsOfDay(todayBlocks, settings.value.wakeStart, settings.value.wakeEnd)
  const inboxCount = inboxTasks.value.length

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  type TlEntry = { kind: 'block' | 'frei'; start: number; end: number; label: string; color?: string; taskCount?: number; done?: boolean }
  const entries: TlEntry[] = [
    ...todayBlocks.map((b) => ({
      kind: 'block' as const,
      start: toMinutes(b.start),
      end: toMinutes(b.end),
      label: b.title,
      color: blockColor(b),
      taskCount: b.taskIds.length,
      done: b.done,
    })),
    ...free.map((f) => ({ kind: 'frei' as const, start: f.start, end: f.end, label: 'frei' })),
  ].sort((a, b) => a.start - b.start)

  return (
    <div class="view">
      <BrainHeader />

      {inboxCount > 0 && (
        <button
          class="card"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', borderColor: 'var(--warning)' }}
          onClick={() => navigate('/triage')}
          data-testid="inbox-banner"
        >
          📥 <strong>{inboxCount}</strong> {inboxCount === 1 ? 'Eintrag wartet' : 'Einträge warten'} in der Inbox —
          jetzt triagieren
        </button>
      )}

      <Top3Editor dateIso={today} />

      <div class="card">
        <div class="card-title">
          <span>Tagesverlauf</span>
          <button class="btn small" onClick={() => navigate(`/woche/${weekId}`)}>
            Zur Woche
          </button>
        </div>
        {entries.length === 0 ? (
          <div class="empty-state">
            <p>Heute sind keine Blöcke geplant.</p>
            <button class="btn primary small" style={{ marginTop: 8 }} onClick={() => navigate(`/woche/${weekId}`)}>
              Woche planen
            </button>
          </div>
        ) : (
          <div class="timeline">
            {entries.map((e, i) => {
              const isNow = nowMin >= e.start && nowMin < e.end
              return (
                <div class="tl-item" key={i}>
                  <span class="tl-time">{toHHMM(e.start)}</span>
                  <span class="tl-dot" style={{ background: e.color ?? 'var(--border)' }} />
                  {e.kind === 'block' ? (
                    <div
                      style={{
                        background: e.color,
                        color: '#fff',
                        borderRadius: 8,
                        padding: '6px 10px',
                        opacity: e.done ? 0.55 : 1,
                        outline: isNow ? '2px solid var(--danger)' : 'none',
                      }}
                    >
                      <strong>{e.label}</strong>{' '}
                      <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>
                        bis {toHHMM(e.end)}
                        {e.taskCount ? ` · ${e.taskCount} Aufgabe${e.taskCount > 1 ? 'n' : ''}` : ''}
                        {isNow ? ' · jetzt' : ''}
                      </span>
                    </div>
                  ) : (
                    <div class="muted" style={{ padding: '4px 0' }}>
                      frei · {minutesLabel(e.end - e.start)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div class="card">
        <div class="card-title">
          <span>Lebensbereiche</span>
        </div>
        <div class="chip-row">
          {activeAreas.value.map((a) => {
            const open = tasks.value.filter((t) => t.areaId === a.id && (t.status === 'offen' || t.status === 'inbox')).length
            return (
              <button key={a.id} class="chip" onClick={() => navigate(`/bereich/${a.id}`)}>
                <span class="area-dot" style={{ background: a.color }} />
                {a.name}
                {open > 0 && <span class="muted">({open})</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
