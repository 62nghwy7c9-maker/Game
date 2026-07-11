import type { Area, Task } from '../types'

/**
 * Offline-Heuristik für Yannik: ordnet Freitext einem Lebensbereich zu —
 * ganz ohne Netz, kostenlos, sofort. Basiert auf deutschen Schlüsselwörtern
 * plus dem Namen des Bereichs selbst.
 */

/** Schlüsselwörter je Standard-Bereichsname (klein geschrieben). */
const KEYWORDS: Record<string, string[]> = {
  beruf: [
    'arbeit', 'büro', 'buero', 'job', 'chef', 'kollege', 'kollegin', 'meeting', 'besprechung',
    'projekt', 'kunde', 'kundin', 'mail', 'email', 'e-mail', 'präsentation', 'praesentation',
    'deadline', 'rechnung', 'angebot', 'kalkulation', 'firma', 'geschäft', 'geschaeft', 'termin',
    'bewerbung', 'gehalt', 'vertrag', 'report', 'bericht', 'aufgabe',
  ],
  verein: [
    'verein', 'vorstand', 'mitglied', 'sitzung', 'ehrenamt', 'wettkampf', 'protokoll', 'turnier',
    'anmeldung', 'liste', 'jugend', 'trainer', 'trainerin', 'saison', 'meldung', 'kampfrichter',
    'urkunde', 'ausrichten', 'helfer', 'spende', 'beitrag', 'satzung',
  ],
  training: [
    'training', 'sport', 'laufen', 'joggen', 'workout', 'fitness', 'gym', 'fahrrad', 'rad',
    'schwimmen', 'dehnen', 'kraft', 'ausdauer', 'lauf', 'einheit', 'plan', 'regeneration',
    'wettkampf', 'muskel', 'aufwärmen', 'aufwaermen', 'technik',
  ],
  haushalt: [
    'putzen', 'einkaufen', 'einkauf', 'wäsche', 'waesche', 'waschen', 'müll', 'muell', 'kochen',
    'aufräumen', 'aufraeumen', 'reparieren', 'reparatur', 'garten', 'staubsaugen', 'geschirr',
    'küche', 'kueche', 'bad', 'reinigen', 'besorgen', 'rechnung', 'strom', 'miete', 'handwerker',
  ],
  privat: [
    'familie', 'freund', 'freundin', 'geburtstag', 'urlaub', 'arzt', 'termin', 'geschenk',
    'treffen', 'essen', 'kino', 'buch', 'hobby', 'eltern', 'kind', 'kinder', 'partner', 'partnerin',
    'reise', 'wochenende', 'anrufen', 'besuch', 'feier',
  ],
}

/** Normalisiert Text für den Vergleich (klein, ohne Satzzeichen). */
function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `
}

export interface AreaSuggestion {
  areaId: string
  areaName: string
  score: number
  hits: string[]
}

/**
 * Bewertet alle aktiven Bereiche für einen Text und liefert die beste
 * Zuordnung (oder null, wenn nichts passt).
 */
export function suggestAreaForText(text: string, areas: Area[]): AreaSuggestion | null {
  const hay = normalize(text)
  let best: AreaSuggestion | null = null

  for (const area of areas) {
    const key = area.name.trim().toLowerCase()
    const words = new Set<string>(KEYWORDS[key] ?? [])
    // Der Bereichsname selbst zählt ebenfalls als Treffer.
    for (const part of key.split(/\s+/)) if (part.length > 2) words.add(part)

    const hits: string[] = []
    for (const w of words) {
      if (hay.includes(` ${w}`) || hay.includes(`${w} `)) hits.push(w)
    }
    // Namenstreffer wiegt schwerer als ein reines Stichwort.
    let score = hits.length
    if (hay.includes(` ${key} `)) score += 2

    if (score > 0 && (!best || score > best.score)) {
      best = { areaId: area.id, areaName: area.name, score, hits }
    }
  }
  return best
}

export interface SortProposal {
  taskId: string
  title: string
  areaId: string
  areaName: string
  reason: string
}

/**
 * Erzeugt Zuordnungsvorschläge für alle noch nicht einsortierten Inbox-Einträge
 * (Status 'inbox', ohne areaId). Verändert nichts — reine Vorschläge.
 */
export function proposeInboxSorting(tasks: Task[], areas: Area[]): SortProposal[] {
  const active = areas.filter((a) => !a.archived)
  const proposals: SortProposal[] = []
  for (const task of tasks) {
    if (task.status !== 'inbox' || task.areaId) continue
    const text = `${task.title} ${task.notes ?? ''}`
    const s = suggestAreaForText(text, active)
    if (!s) continue
    proposals.push({
      taskId: task.id,
      title: task.title,
      areaId: s.areaId,
      areaName: s.areaName,
      reason: s.hits.length > 0 ? `Stichwort: ${s.hits.slice(0, 3).join(', ')}` : `passt zu „${s.areaName}"`,
    })
  }
  return proposals
}
