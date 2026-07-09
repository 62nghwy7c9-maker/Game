/** Datums-Helfer. Wochen sind ISO-8601 (Montag = erster Tag). */

export const WEEKDAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** ISO-Datum 'JJJJ-MM-TT' in lokaler Zeit */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

/** 0 = Montag … 6 = Sonntag */
export function isoWeekday(d: Date): number {
  return (d.getDay() + 6) % 7
}

/** ISO-Wochen-ID, z. B. '2026-W28' */
export function weekIdOf(d: Date): string {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  // Donnerstag derselben ISO-Woche bestimmt das Jahr
  t.setDate(t.getDate() - isoWeekday(t) + 3)
  const year = t.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const week1Monday = new Date(year, 0, 4 - isoWeekday(jan4))
  const week = Math.round((t.getTime() - week1Monday.getTime()) / (7 * 86400000)) + 1
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function currentWeekId(): string {
  return weekIdOf(new Date())
}

/** Montag der Woche 'JJJJ-Www' als Date */
export function mondayOfWeek(weekId: string): Date {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekId)
  if (!m) throw new Error(`Ungültige Wochen-ID: ${weekId}`)
  const year = Number(m[1])
  const week = Number(m[2])
  const jan4 = new Date(year, 0, 4)
  const week1Monday = new Date(year, 0, 4 - isoWeekday(jan4))
  return new Date(week1Monday.getFullYear(), week1Monday.getMonth(), week1Monday.getDate() + (week - 1) * 7)
}

/** Die 7 ISO-Daten (Mo–So) einer Woche */
export function datesOfWeek(weekId: string): string[] {
  const monday = mondayOfWeek(weekId)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return toIsoDate(d)
  })
}

export function addWeeks(weekId: string, delta: number): string {
  const monday = mondayOfWeek(weekId)
  monday.setDate(monday.getDate() + delta * 7)
  return weekIdOf(monday)
}

export function weekLabel(weekId: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekId)
  return m ? `KW ${Number(m[2])} · ${m[1]}` : weekId
}

/** 'HH:MM' → Minuten seit Mitternacht */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Minuten seit Mitternacht → 'HH:MM' */
export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatDateLong(iso: string): string {
  const d = fromIsoDate(iso)
  return `${WEEKDAY_NAMES[isoWeekday(d)]}, ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}

export function formatDateShort(iso: string): string {
  const d = fromIsoDate(iso)
  return `${WEEKDAY_SHORT[isoWeekday(d)]} ${d.getDate()}.${d.getMonth() + 1}.`
}

export function minutesLabel(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
