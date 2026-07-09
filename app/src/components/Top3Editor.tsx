import { useSignal } from '@preact/signals'
import type { Top3Item } from '../types'
import { dayPlanOf, saveDayPlan, tasks, toggleTaskDone } from '../state/store'

export function Top3Editor(props: { dateIso: string; title?: string }) {
  const plan = dayPlanOf(props.dateIso)
  const adding = useSignal(false)
  const text = useSignal('')

  const setTop3 = (top3: Top3Item[]) => saveDayPlan(props.dateIso, top3, plan.note)

  const toggle = (i: number) => {
    const items = plan.top3.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it))
    setTop3(items)
    const it = plan.top3[i]
    if (it.taskId) toggleTaskDone(it.taskId)
  }

  const remove = (i: number) => setTop3(plan.top3.filter((_, idx) => idx !== i))

  const addFree = () => {
    const t = text.value.trim()
    if (!t) return
    setTop3([...plan.top3, { text: t, done: false }])
    text.value = ''
    adding.value = plan.top3.length + 1 < 3
  }

  const addTask = (taskId: string) => {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return
    setTop3([...plan.top3, { taskId, text: task.title, done: task.status === 'erledigt' }])
  }

  const candidateTasks = tasks.value.filter(
    (t) => t.status === 'offen' && !plan.top3.some((it) => it.taskId === t.id),
  )

  return (
    <div class="card" data-testid="top3">
      <div class="card-title">
        <span>{props.title ?? 'Tages-Top-3'}</span>
        <span class="muted">
          {plan.top3.filter((t) => t.done).length}/{plan.top3.length}
        </span>
      </div>
      {plan.top3.length === 0 && (
        <p class="muted" style={{ marginBottom: 8 }}>
          Welche 1–3 Dinge machen diesen Tag zum Erfolg?
        </p>
      )}
      {plan.top3.map((it, i) => (
        <div class="list-item" key={i}>
          <input
            type="checkbox"
            class="checkbox-round"
            checked={it.done}
            onChange={() => toggle(i)}
            aria-label={`„${it.text}" abhaken`}
          />
          <span style={{ flex: 1, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.6 : 1 }}>
            {i + 1}. {it.text}
          </span>
          <button class="btn small" onClick={() => remove(i)} aria-label="Entfernen">
            ✕
          </button>
        </div>
      ))}
      {plan.top3.length < 3 && !adding.value && (
        <button class="btn small" style={{ marginTop: 8 }} onClick={() => (adding.value = true)} data-testid="top3-add">
          + Priorität hinzufügen
        </button>
      )}
      {adding.value && (
        <div style={{ marginTop: 10 }}>
          <input
            type="text"
            placeholder="Frei eintragen …"
            value={text.value}
            onInput={(e) => (text.value = (e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addFree()
            }}
            data-testid="top3-input"
          />
          {candidateTasks.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p class="muted">… oder aus offenen Aufgaben wählen:</p>
              {candidateTasks.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  class="chip"
                  style={{ margin: '4px 4px 0 0' }}
                  onClick={() => {
                    addTask(t.id)
                    adding.value = plan.top3.length + 1 < 3
                  }}
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
          <div class="btn-row">
            <button class="btn primary small" onClick={addFree} disabled={!text.value.trim()} data-testid="top3-save">
              Hinzufügen
            </button>
            <button class="btn small" onClick={() => (adding.value = false)}>
              Fertig
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
