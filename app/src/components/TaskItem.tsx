import type { Task } from '../types'
import { toggleTaskDone } from '../state/store'
import { AreaDot } from './AreaBadge'
import { formatDateShort } from '../lib/dates'

export function TaskItem(props: { task: Task; onDelete?: () => void }) {
  const t = props.task
  const done = t.status === 'erledigt'
  return (
    <div class="list-item" data-testid="task-item">
      <input
        type="checkbox"
        class="checkbox-round"
        checked={done}
        onChange={() => toggleTaskDone(t.id)}
        aria-label={`„${t.title}" ${done ? 'wieder öffnen' : 'als erledigt markieren'}`}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.6 : 1 }}>{t.title}</div>
        <div class="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AreaDot areaId={t.areaId} />
          {t.plannedDate && <span>{formatDateShort(t.plannedDate)}</span>}
          {t.notes && <span>· {t.notes}</span>}
        </div>
      </div>
      {props.onDelete && (
        <button class="btn small" onClick={props.onDelete} aria-label="Löschen">
          ✕
        </button>
      )}
    </div>
  )
}
