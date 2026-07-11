import { useSignal } from '@preact/signals'
import type { ComponentChildren } from 'preact'
import type { BlockType } from '../types'
import { activeAreas } from '../state/store'
import { WEEKDAY_NAMES } from '../lib/dates'

export const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: 'fokus', label: 'Fokus (geschützt)' },
  { value: 'puffer', label: 'Puffer für Ungeplantes' },
  { value: 'training', label: 'Training' },
  { value: 'admin', label: 'Admin-Batch' },
  { value: 'termin', label: 'Termin' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

export const TYPE_COLORS: Record<BlockType, string> = {
  fokus: 'var(--area-blau)',
  puffer: 'var(--warning)',
  training: 'var(--area-gruen)',
  admin: 'var(--area-grau)',
  termin: 'var(--area-rot)',
  sonstiges: 'var(--area-indigo)',
}

export interface BlockFormValue {
  title: string
  type: BlockType
  areaId?: string
  weekday: number
  start: string
  end: string
}

export function BlockForm(props: {
  initial: BlockFormValue
  submitLabel: string
  onSubmit: (v: BlockFormValue) => void
  onCancel: () => void
  onDelete?: () => void
  extra?: ComponentChildren
}) {
  const v = useSignal<BlockFormValue>({ ...props.initial })
  const patch = (p: Partial<BlockFormValue>) => (v.value = { ...v.value, ...p })
  const valid = v.value.title.trim() !== '' && v.value.start < v.value.end

  return (
    <div>
      <label class="field">
        <span>Titel</span>
        <input
          type="text"
          value={v.value.title}
          onInput={(e) => patch({ title: (e.target as HTMLInputElement).value })}
          data-testid="block-title"
        />
      </label>
      <label class="field">
        <span>Art</span>
        <select value={v.value.type} onChange={(e) => patch({ type: (e.target as HTMLSelectElement).value as BlockType })} data-testid="block-type">
          {BLOCK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label class="field">
        <span>Lebensbereich</span>
        <select
          value={v.value.areaId ?? ''}
          onChange={(e) => patch({ areaId: (e.target as HTMLSelectElement).value || undefined })}
        >
          <option value="">— keiner —</option>
          {activeAreas.value.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label class="field">
        <span>Tag</span>
        <select value={String(v.value.weekday)} onChange={(e) => patch({ weekday: Number((e.target as HTMLSelectElement).value) })}>
          {WEEKDAY_NAMES.map((n, i) => (
            <option key={n} value={String(i)}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <label class="field" style={{ flex: 1 }}>
          <span>Von</span>
          <input type="time" value={v.value.start} onInput={(e) => patch({ start: (e.target as HTMLInputElement).value })} data-testid="block-start" />
        </label>
        <label class="field" style={{ flex: 1 }}>
          <span>Bis</span>
          <input type="time" value={v.value.end} onInput={(e) => patch({ end: (e.target as HTMLInputElement).value })} data-testid="block-end" />
        </label>
      </div>
      {props.extra}
      <div class="btn-row">
        <button class="btn primary" disabled={!valid} onClick={() => props.onSubmit(v.value)} data-testid="block-save">
          {props.submitLabel}
        </button>
        <button class="btn" onClick={props.onCancel}>
          Abbrechen
        </button>
        {props.onDelete && (
          <button class="btn danger" onClick={props.onDelete} data-testid="block-delete">
            Löschen
          </button>
        )}
      </div>
    </div>
  )
}
