import { useEffect, useRef } from 'preact/hooks'
import type { Block } from '../types'
import { settings } from '../state/store'
import { areaById } from '../state/store'
import { TYPE_COLORS } from './BlockForm'
import { freeSlotsOfDay } from '../lib/freeslots'
import { WEEKDAY_SHORT, datesOfWeek, minutesLabel, toHHMM, toMinutes, todayIso } from '../lib/dates'

const PX_PER_MIN = 0.85

export function blockColor(b: Block): string {
  return areaById(b.areaId)?.color ?? TYPE_COLORS[b.type]
}

export function WeekGrid(props: {
  weekId: string
  blocks: Block[]
  onBlockClick: (b: Block) => void
  onSlotClick: (date: string, startMin: number, endMin: number) => void
}) {
  const dates = datesOfWeek(props.weekId)
  const today = todayIso()
  const wakeStart = toMinutes(settings.value.wakeStart)
  const wakeEnd = toMinutes(settings.value.wakeEnd)
  const height = (wakeEnd - wakeStart) * PX_PER_MIN
  const gridRef = useRef<HTMLDivElement>(null)

  // Mobil: heutigen Tag in die Mitte scrollen
  useEffect(() => {
    const idx = dates.indexOf(today)
    if (idx > 0 && gridRef.current) {
      const col = gridRef.current.children[idx] as HTMLElement | undefined
      col?.scrollIntoView({ inline: 'center', block: 'nearest' })
    }
  }, [props.weekId])

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const hours: number[] = []
  for (let h = Math.ceil(wakeStart / 60); h <= Math.floor(wakeEnd / 60); h++) hours.push(h * 60)

  return (
    <div class="weekgrid" ref={gridRef} data-testid="weekgrid">
      {dates.map((date, wd) => {
        const dayBlocks = props.blocks
          .filter((b) => b.date === date)
          .sort((a, b) => a.start.localeCompare(b.start))
        const free = freeSlotsOfDay(dayBlocks, settings.value.wakeStart, settings.value.wakeEnd)
        const [, m, d] = date.split('-')
        return (
          <div class="day-col" key={date}>
            <div class={`day-head ${date === today ? 'today' : ''}`}>
              <span>
                {WEEKDAY_SHORT[wd]} {Number(d)}.{Number(m)}.
              </span>
              {date === today && <span class="muted">heute</span>}
            </div>
            <div class="day-body" style={{ height: `${height}px` }}>
              {hours.map((min) => (
                <div class="hour-line" key={min} style={{ top: `${(min - wakeStart) * PX_PER_MIN}px` }}>
                  {toHHMM(min)}
                </div>
              ))}
              {free.map((slot) => (
                <button
                  key={`f${slot.start}`}
                  class="free-slot"
                  style={{
                    top: `${(slot.start - wakeStart) * PX_PER_MIN}px`,
                    height: `${(slot.end - slot.start) * PX_PER_MIN - 2}px`,
                  }}
                  onClick={() => props.onSlotClick(date, slot.start, slot.end)}
                  aria-label={`Freie Zeit ${toHHMM(slot.start)}–${toHHMM(slot.end)} — Block anlegen`}
                >
                  frei · {minutesLabel(slot.end - slot.start)}
                </button>
              ))}
              {dayBlocks.map((b) => {
                const top = (toMinutes(b.start) - wakeStart) * PX_PER_MIN
                const h = (toMinutes(b.end) - toMinutes(b.start)) * PX_PER_MIN
                return (
                  <button
                    key={b.id}
                    class={`wblock ${b.done ? 'done' : ''}`}
                    style={{ top: `${top}px`, height: `${Math.max(h, 20)}px`, background: blockColor(b) }}
                    onClick={() => props.onBlockClick(b)}
                    data-testid="week-block"
                  >
                    <span class="wblock-time">
                      {b.start}–{b.end}
                    </span>{' '}
                    {b.title}
                    {b.taskIds.length > 0 && <span class="wblock-task-count">{b.taskIds.length}</span>}
                  </button>
                )
              })}
              {date === today && nowMin > wakeStart && nowMin < wakeEnd && (
                <div class="now-line" style={{ top: `${(nowMin - wakeStart) * PX_PER_MIN}px` }} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
