import { describe, expect, it } from 'vitest'
import {
  addWeeks,
  datesOfWeek,
  fromIsoDate,
  isoWeekday,
  mondayOfWeek,
  toHHMM,
  toIsoDate,
  toMinutes,
  weekIdOf,
} from './dates'

describe('weekIdOf (ISO-Wochen)', () => {
  it('normale Woche', () => {
    expect(weekIdOf(new Date(2026, 6, 9))).toBe('2026-W28') // Do 9.7.2026
  })
  it('Jahresanfang gehört zur W01, wenn der Donnerstag im neuen Jahr liegt', () => {
    expect(weekIdOf(new Date(2026, 0, 1))).toBe('2026-W01') // Do 1.1.2026
  })
  it('Jahresanfang gehört zum Vorjahr (W53)', () => {
    expect(weekIdOf(new Date(2021, 0, 1))).toBe('2020-W53') // Fr 1.1.2021
  })
  it('Jahresende kann schon W01 des Folgejahres sein', () => {
    expect(weekIdOf(new Date(2025, 11, 29))).toBe('2026-W01') // Mo 29.12.2025
  })
})

describe('mondayOfWeek / datesOfWeek', () => {
  it('Roundtrip Montag → weekId → Montag', () => {
    const monday = mondayOfWeek('2026-W28')
    expect(toIsoDate(monday)).toBe('2026-07-06')
    expect(weekIdOf(monday)).toBe('2026-W28')
    expect(isoWeekday(monday)).toBe(0)
  })
  it('W53 über den Jahreswechsel', () => {
    expect(datesOfWeek('2020-W53')).toEqual([
      '2020-12-28',
      '2020-12-29',
      '2020-12-30',
      '2020-12-31',
      '2021-01-01',
      '2021-01-02',
      '2021-01-03',
    ])
  })
  it('7 Tage, Mo–So', () => {
    const dates = datesOfWeek('2026-W28')
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-07-06')
    expect(dates[6]).toBe('2026-07-12')
  })
})

describe('addWeeks', () => {
  it('über den Jahreswechsel vorwärts', () => {
    expect(addWeeks('2026-W53', 1)).toBe('2027-W01')
  })
  it('rückwärts', () => {
    expect(addWeeks('2026-W01', -1)).toBe('2025-W52')
  })
})

describe('Zeit-Helfer', () => {
  it('toMinutes/toHHMM Roundtrip', () => {
    expect(toMinutes('06:30')).toBe(390)
    expect(toHHMM(390)).toBe('06:30')
    expect(toHHMM(0)).toBe('00:00')
  })
  it('fromIsoDate lokale Zeit', () => {
    const d = fromIsoDate('2026-07-09')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)
    expect(d.getDate()).toBe(9)
  })
})
