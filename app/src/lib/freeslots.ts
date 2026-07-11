import type { Block } from '../types'
import { toMinutes } from './dates'

export interface FreeSlot {
  /** Minuten seit Mitternacht */
  start: number
  end: number
}

/**
 * Freie Lücken eines Tages innerhalb des Wachfensters,
 * mindestens `minMinutes` lang. Überlappende Blöcke werden zusammengefasst.
 */
export function freeSlotsOfDay(
  blocks: Block[],
  wakeStart: string,
  wakeEnd: string,
  minMinutes = 30,
): FreeSlot[] {
  const dayStart = toMinutes(wakeStart)
  const dayEnd = toMinutes(wakeEnd)
  if (dayEnd <= dayStart) return []

  const busy = blocks
    .map((b) => ({ start: toMinutes(b.start), end: toMinutes(b.end) }))
    .filter((b) => b.end > b.start && b.end > dayStart && b.start < dayEnd)
    .sort((a, b) => a.start - b.start)

  const merged: FreeSlot[] = []
  for (const b of busy) {
    const last = merged[merged.length - 1]
    if (last && b.start <= last.end) {
      last.end = Math.max(last.end, b.end)
    } else {
      merged.push({ ...b })
    }
  }

  const free: FreeSlot[] = []
  let cursor = dayStart
  for (const b of merged) {
    if (b.start - cursor >= minMinutes) free.push({ start: cursor, end: Math.min(b.start, dayEnd) })
    cursor = Math.max(cursor, b.end)
  }
  if (dayEnd - cursor >= minMinutes) free.push({ start: cursor, end: dayEnd })
  return free
}

/** Prüft, ob ein Zeitfenster mit bestehenden Blöcken kollidiert. */
export function overlapsAny(blocks: Block[], start: string, end: string, ignoreId?: string): boolean {
  const s = toMinutes(start)
  const e = toMinutes(end)
  return blocks.some((b) => {
    if (ignoreId && b.id === ignoreId) return false
    return toMinutes(b.start) < e && toMinutes(b.end) > s
  })
}
