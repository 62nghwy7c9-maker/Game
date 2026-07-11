import { useSignal } from '@preact/signals'
import { areaById, deleteTask, tasks, updateArea, weekById } from '../state/store'
import { route, navigate } from '../router'
import { TaskItem } from '../components/TaskItem'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { blockColor } from '../components/WeekGrid'
import { currentWeekId, formatDateShort, weekLabel } from '../lib/dates'

type Tab = 'aufgaben' | 'bloecke' | 'notizen'

export function BereichDetail() {
  const areaId = route.value.params[0]
  const area = areaById(areaId)
  const tab = useSignal<Tab>('aufgaben')
  const confirmArchive = useSignal(false)
  const editingName = useSignal(false)
  const nameDraft = useSignal(area?.name ?? '')

  if (!area) {
    return (
      <div class="view">
        <div class="empty-state">
          <p>Bereich nicht gefunden.</p>
          <button class="btn" onClick={() => navigate('/bereiche')}>
            Zurück zu den Bereichen
          </button>
        </div>
      </div>
    )
  }

  const areaTasks = tasks.value.filter((t) => t.areaId === area.id && t.status !== 'verworfen')
  const open = areaTasks.filter((t) => t.status === 'offen' || t.status === 'inbox')
  const done = areaTasks.filter((t) => t.status === 'erledigt')

  const weekId = currentWeekId()
  const weekBlocks = (weekById(weekId)?.blocks ?? [])
    .filter((b) => b.areaId === area.id)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))

  return (
    <div class="view">
      <h1 class="view-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span class="area-dot" style={{ background: area.color, width: 16, height: 16 }} />
        {editingName.value ? (
          <input
            type="text"
            value={nameDraft.value}
            style={{ flex: 1 }}
            onInput={(e) => (nameDraft.value = (e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && nameDraft.value.trim()) {
                updateArea(area.id, { name: nameDraft.value.trim() })
                editingName.value = false
              }
            }}
          />
        ) : (
          <span style={{ flex: 1 }}>{area.name}</span>
        )}
        <button
          class="btn small"
          onClick={() => {
            if (editingName.value && nameDraft.value.trim()) updateArea(area.id, { name: nameDraft.value.trim() })
            else nameDraft.value = area.name
            editingName.value = !editingName.value
          }}
        >
          {editingName.value ? 'OK' : '✎'}
        </button>
      </h1>

      <div class="chip-row" style={{ marginBottom: 14 }}>
        {(
          [
            ['aufgaben', `Aufgaben (${open.length})`],
            ['bloecke', 'Blöcke dieser Woche'],
            ['notizen', 'Notizen'],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button key={t} class={`chip ${tab.value === t ? 'active' : ''}`} onClick={() => (tab.value = t)}>
            {label}
          </button>
        ))}
      </div>

      {tab.value === 'aufgaben' && (
        <div class="card">
          {open.length === 0 && done.length === 0 && (
            <p class="muted">Noch keine Aufgaben in diesem Bereich. Erfasse etwas mit dem +-Knopf und wähle „{area.name}".</p>
          )}
          {open.map((t) => (
            <TaskItem key={t.id} task={t} onDelete={() => deleteTask(t.id)} />
          ))}
          {done.length > 0 && (
            <>
              <p class="muted" style={{ marginTop: 12, marginBottom: 4 }}>
                Erledigt
              </p>
              {done.slice(-10).map((t) => (
                <TaskItem key={t.id} task={t} />
              ))}
            </>
          )}
        </div>
      )}

      {tab.value === 'bloecke' && (
        <div class="card">
          <p class="muted" style={{ marginBottom: 8 }}>
            {weekLabel(weekId)}
          </p>
          {weekBlocks.length === 0 ? (
            <p class="muted">Diese Woche sind keine Blöcke für „{area.name}" geplant.</p>
          ) : (
            weekBlocks.map((b) => (
              <div class="list-item" key={b.id}>
                <span class="area-dot" style={{ background: blockColor(b) }} />
                <span style={{ flex: 1 }}>
                  {formatDateShort(b.date)} · {b.start}–{b.end} · {b.title}
                </span>
              </div>
            ))
          )}
          <button class="btn small" style={{ marginTop: 10 }} onClick={() => navigate(`/woche/${weekId}`)}>
            Zur Wochenplanung
          </button>
        </div>
      )}

      {tab.value === 'notizen' && (
        <div class="card">
          <textarea
            style={{ minHeight: 160 }}
            placeholder={`Notizen zu „${area.name}" — z. B. Zugangsdaten-Hinweise, Ideen, Wartendes …`}
            value={area.notes ?? ''}
            onInput={(e) => updateArea(area.id, { notes: (e.target as HTMLTextAreaElement).value })}
          />
        </div>
      )}

      <button class="btn danger small" onClick={() => (confirmArchive.value = true)}>
        Bereich archivieren
      </button>

      {confirmArchive.value && (
        <ConfirmDialog
          title="Bereich archivieren?"
          text={`„${area.name}" wird ausgeblendet. Aufgaben und Blöcke bleiben erhalten.`}
          confirmLabel="Archivieren"
          danger
          onConfirm={() => {
            updateArea(area.id, { archived: true })
            navigate('/bereiche')
          }}
          onCancel={() => (confirmArchive.value = false)}
        />
      )}
    </div>
  )
}
