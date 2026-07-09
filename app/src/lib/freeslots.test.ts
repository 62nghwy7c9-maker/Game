import { describe, expect, it } from 'vitest'
import { freeSlotsOfDay, overlapsAny } from './freeslots'
import type { Block } from '../types'

function block(start: string, end: string): Block {
  return {
    id: start,
    weekday: 0,
    start,
    end,
    title: 't',
    type: 'fokus',
    date: '2026-07-06',
    taskIds: [],
  }
}

describe('freeSlotsOfDay', () => {
  it('leerer Tag = ein großer Slot', () => {
    expect(freeSlotsOfDay([], '06:00', '22:00')).toEqual([{ start: 360, end: 1320 }])
  })
  it('Lücken zwischen Blöcken', () => {
    const slots = freeSlotsOfDay([block('09:00', '10:00'), block('12:00', '13:00')], '08:00', '14:00')
    expect(slots).toEqual([
      { start: 480, end: 540 },
      { start: 600, end: 720 },
      { start: 780, end: 840 },
    ])
  })
  it('überlappende Blöcke werden zusammengefasst', () => {
    const slots = freeSlotsOfDay([block('09:00', '11:00'), block('10:00', '12:00')], '08:00', '14:00')
    expect(slots).toEqual([
      { start: 480, end: 540 },
      { start: 720, end: 840 },
    ])
  })
  it('zu kurze Lücken fallen weg', () => {
    const slots = freeSlotsOfDay([block('08:00', '10:00'), block('10:15', '12:00')], '08:00', '12:00')
    expect(slots).toEqual([])
  })
  it('Blöcke außerhalb des Wachfensters stören nicht', () => {
    const slots = freeSlotsOfDay([block('04:00', '05:00')], '06:00', '08:00')
    expect(slots).toEqual([{ start: 360, end: 480 }])
  })
})

describe('overlapsAny', () => {
  const blocks = [block('09:00', '10:00')]
  it('Überschneidung erkannt', () => {
    expect(overlapsAny(blocks, '09:30', '10:30')).toBe(true)
  })
  it('angrenzend ist keine Überschneidung', () => {
    expect(overlapsAny(blocks, '10:00', '11:00')).toBe(false)
  })
  it('ignoreId schließt den eigenen Block aus', () => {
    expect(overlapsAny(blocks, '09:00', '10:00', '09:00')).toBe(false)
  })
})
