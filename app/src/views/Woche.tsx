import { useSignal } from '@preact/signals'
import type { Block } from '../types'
import {
  addBlock,
  applyTemplate,
  assignTaskToBlock,
  deleteBlock,
  ensureWeek,
  saveTemplateBlocks,
  tasks,
  updateBlock,
  updateTask,
  weekById,
} from '../state/store'
import { route, navigate } from '../router'
import { WeekGrid } from '../components/WeekGrid'
import { BottomSheet } from '../components/BottomSheet'
import { BlockForm, type BlockFormValue } from '../components/BlockForm'
import { showToast } from '../components/Toast'
import { addWeeks, currentWeekId, datesOfWeek, isoWeekday, fromIsoDate, toHHMM, weekLabel } from '../lib/dates'
import { newId } from '../lib/id'

interface NewBlockDraft {
  date: string
  start: string
  end: string
}

export function Woche() {
  const weekId = route.value.params[0] || currentWeekId()
  const week = weekById(weekId)
  const blocks = week?.blocks ?? []

  const editing = useSignal<Block | null>(null)
  const creating = useSignal<NewBlockDraft | null>(null)

  const goto = (delta: number) => navigate(`/woche/${addWeeks(weekId, delta)}`)

  const onApplyTemplate = () => {
    ensureWeek(weekId)
    const { added, skipped } = applyTemplate(weekId)
    showToast(
      skipped > 0
        ? `${added} Blöcke eingefügt, ${skipped} wegen Überschneidung übersprungen.`
        : `${added} Blöcke aus der Standardwoche eingefügt.`,
    )
  }

  const onSaveAsTemplate = () => {
    if (blocks.length === 0) {
      showToast('Diese Woche hat keine Blöcke — nichts zu speichern.')
      return
    }
    saveTemplateBlocks(
      blocks.map((b) => ({
        id: newId(),
        weekday: isoWeekday(fromIsoDate(b.date)),
        start: b.start,
        end: b.end,
        title: b.title,
        type: b.type,
        areaId: b.areaId,
      })),
    )
    showToast('Als Standardwoche gespeichert.')
  }

  const dates = datesOfWeek(weekId)

  const submitEdit = (v: BlockFormValue) => {
    const b = editing.value
    if (!b) return
    updateBlock(weekId, b.id, {
      title: v.title.trim(),
      type: v.type,
      areaId: v.areaId,
      start: v.start,
      end: v.end,
      weekday: v.weekday,
      date: dates[v.weekday],
    })
    editing.value = null
  }

  const submitCreate = (v: BlockFormValue) => {
    addBlock(weekId, {
      title: v.title.trim(),
      type: v.type,
      areaId: v.areaId,
      start: v.start,
      end: v.end,
      weekday: v.weekday,
      date: dates[v.weekday],
    })
    creating.value = null
  }

  // Aufgaben, die man einem Block zuordnen kann (offen oder bereits in diesem Block)
  const assignable = (b: Block) =>
    tasks.value.filter((t) => (t.status === 'offen' && !t.plannedBlockId) || b.taskIds.includes(t.id))

  return (
    <div class="view">
      <h1 class="view-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button class="btn small" onClick={() => goto(-1)} aria-label="Vorherige Woche" data-testid="week-prev">
          ‹
        </button>
        <span style={{ flex: 1, textAlign: 'center' }} data-testid="week-label">
          {weekLabel(weekId)}
        </span>
        <button class="btn small" onClick={() => goto(1)} aria-label="Nächste Woche" data-testid="week-next">
          ›
        </button>
      </h1>
      <div class="btn-row" style={{ marginBottom: 12 }}>
        <button class="btn small" onClick={onApplyTemplate} data-testid="apply-template">
          Vorlage anwenden
        </button>
        <button class="btn small" onClick={onSaveAsTemplate} data-testid="save-template">
          Als Vorlage speichern
        </button>
      </div>

      <WeekGrid
        weekId={weekId}
        blocks={blocks}
        onBlockClick={(b) => (editing.value = b)}
        onSlotClick={(date, startMin, endMin) =>
          (creating.value = { date, start: toHHMM(startMin), end: toHHMM(Math.min(startMin + 60, endMin)) })
        }
      />

      {creating.value && (
        <BottomSheet onClose={() => (creating.value = null)} label="Block anlegen">
          <h3>Neuer Block</h3>
          <BlockForm
            initial={{
              title: '',
              type: 'fokus',
              weekday: isoWeekday(fromIsoDate(creating.value.date)),
              start: creating.value.start,
              end: creating.value.end,
            }}
            submitLabel="Anlegen"
            onSubmit={submitCreate}
            onCancel={() => (creating.value = null)}
          />
        </BottomSheet>
      )}

      {editing.value && (
        <BottomSheet onClose={() => (editing.value = null)} label="Block bearbeiten">
          <h3>Block bearbeiten</h3>
          <BlockForm
            initial={{
              title: editing.value.title,
              type: editing.value.type,
              areaId: editing.value.areaId,
              weekday: isoWeekday(fromIsoDate(editing.value.date)),
              start: editing.value.start,
              end: editing.value.end,
            }}
            submitLabel="Speichern"
            onSubmit={submitEdit}
            onCancel={() => (editing.value = null)}
            onDelete={() => {
              deleteBlock(weekId, editing.value!.id)
              editing.value = null
              showToast('Block gelöscht.')
            }}
            extra={
              <div style={{ marginBottom: 12 }}>
                <label class="field" style={{ marginBottom: 6 }}>
                  <span>Aufgaben in diesem Block</span>
                </label>
                {assignable(editing.value).length === 0 && (
                  <p class="muted">Keine offenen Aufgaben ohne Block vorhanden.</p>
                )}
                {assignable(editing.value).map((t) => {
                  const inBlock = editing.value!.taskIds.includes(t.id)
                  return (
                    <div class="list-item" key={t.id}>
                      <input
                        type="checkbox"
                        class="checkbox-round"
                        checked={inBlock}
                        onChange={() => {
                          const b = editing.value!
                          if (inBlock) {
                            updateBlock(weekId, b.id, { taskIds: b.taskIds.filter((x) => x !== t.id) })
                            updateTask(t.id, { plannedBlockId: undefined, plannedDate: undefined })
                            editing.value = { ...b, taskIds: b.taskIds.filter((x) => x !== t.id) }
                          } else {
                            assignTaskToBlock(t.id, weekId, b.id)
                            editing.value = { ...b, taskIds: [...b.taskIds, t.id] }
                          }
                        }}
                      />
                      <span>{t.title}</span>
                    </div>
                  )
                })}
                <label class="field" style={{ marginTop: 10 }}>
                  <input
                    type="checkbox"
                    checked={editing.value.done ?? false}
                    onChange={(e) => {
                      const done = (e.target as HTMLInputElement).checked
                      updateBlock(weekId, editing.value!.id, { done })
                      editing.value = { ...editing.value!, done }
                    }}
                  />{' '}
                  Block erledigt
                </label>
              </div>
            }
          />
        </BottomSheet>
      )}
    </div>
  )
}
