import { useSignal } from '@preact/signals'
import { AREA_COLORS, activeAreas, addArea, tasks, weekById } from '../state/store'
import { navigate } from '../router'
import { BottomSheet } from '../components/BottomSheet'
import { currentWeekId, formatDateShort, todayIso } from '../lib/dates'

export function Bereiche() {
  const creating = useSignal(false)
  const name = useSignal('')
  const color = useSignal(AREA_COLORS[0])

  const week = weekById(currentWeekId())
  const today = todayIso()

  const nextBlockOf = (areaId: string) => {
    const candidates = (week?.blocks ?? [])
      .filter((b) => b.areaId === areaId && b.date >= today)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    return candidates[0]
  }

  return (
    <div class="view">
      <h1 class="view-title">Lebensbereiche</h1>
      <p class="view-subtitle">Jeder Bereich hat seine eigene Seite — damit nichts durcheinandergerät.</p>

      {activeAreas.value.map((a) => {
        const open = tasks.value.filter((t) => t.areaId === a.id && t.status === 'offen').length
        const next = nextBlockOf(a.id)
        return (
          <button
            key={a.id}
            class="card"
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer', borderLeft: `5px solid ${a.color}` }}
            onClick={() => navigate(`/bereich/${a.id}`)}
            data-testid="area-card"
          >
            <div class="card-title" style={{ marginBottom: 2 }}>
              <span>{a.name}</span>
            </div>
            <div class="muted">
              {open} offene {open === 1 ? 'Aufgabe' : 'Aufgaben'}
              {next && ` · nächster Block: ${formatDateShort(next.date)} ${next.start} ${next.title}`}
            </div>
          </button>
        )
      })}

      <button class="btn" style={{ width: '100%' }} onClick={() => (creating.value = true)} data-testid="add-area">
        + Bereich anlegen
      </button>

      {creating.value && (
        <BottomSheet onClose={() => (creating.value = false)} label="Bereich anlegen">
          <h3>Neuer Lebensbereich</h3>
          <label class="field">
            <span>Name</span>
            <input
              type="text"
              value={name.value}
              onInput={(e) => (name.value = (e.target as HTMLInputElement).value)}
              data-testid="area-name"
            />
          </label>
          <label class="field">
            <span>Farbe</span>
          </label>
          <div class="chip-row" style={{ marginBottom: 14 }}>
            {AREA_COLORS.map((c) => (
              <button
                key={c}
                class="chip"
                style={{
                  background: c,
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: color.value === c ? '3px solid var(--text)' : '1px solid var(--border)',
                }}
                onClick={() => (color.value = c)}
                aria-label={`Farbe ${c}`}
              />
            ))}
          </div>
          <div class="btn-row">
            <button
              class="btn primary"
              disabled={!name.value.trim()}
              onClick={() => {
                addArea(name.value.trim(), color.value)
                name.value = ''
                creating.value = false
              }}
              data-testid="area-save"
            >
              Anlegen
            </button>
            <button class="btn" onClick={() => (creating.value = false)}>
              Abbrechen
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
