import type { MappingTargetField, SavedMapping } from '../types'

export const TARGET_FIELDS: { value: MappingTargetField; label: string }[] = [
  { value: 'ignorieren', label: '— nicht übernehmen —' },
  { value: 'platz', label: 'Platz' },
  { value: 'name', label: 'Name' },
  { value: 'verein', label: 'Verein' },
  { value: 'jahrgang', label: 'Jahrgang' },
  { value: 'ergebnis', label: 'Ergebnis / Zeit' },
  { value: 'disziplin', label: 'Disziplin' },
  { value: 'ak', label: 'Altersklasse' },
  { value: 'frei1', label: 'Frei 1' },
  { value: 'frei2', label: 'Frei 2' },
]

export function fieldLabel(f: MappingTargetField): string {
  return TARGET_FIELDS.find((t) => t.value === f)?.label ?? f
}

/** Fingerprint zur Wiedererkennung: Spaltenzahl + normalisierte Headerzellen */
export function fingerprintOf(headerCells: string[]): string {
  const norm = headerCells.map((c) => c.toLowerCase().replace(/\s+/g, '')).join('|')
  return `${headerCells.length}:${norm}`
}

export function findSavedMapping(mappings: SavedMapping[], headerCells: string[]): SavedMapping | undefined {
  const fp = fingerprintOf(headerCells)
  return mappings.find((m) => m.fingerprint === fp)
}

/**
 * Wendet ein Spalten-Mapping auf Rohzeilen an:
 * nur gemappte Spalten, in Mapping-Reihenfolge, Header aus Feld-Labels.
 */
export function applyMapping(
  rows: string[][],
  headerRowIndex: number,
  columns: { sourceIndex: number; targetField: MappingTargetField }[],
): { header: string[]; rows: string[][] } {
  const used = columns.filter((c) => c.targetField !== 'ignorieren')
  const header = used.map((c) => fieldLabel(c.targetField))
  const dataRows = rows.slice(headerRowIndex + 1).map((r) => used.map((c) => r[c.sourceIndex] ?? ''))
  return { header, rows: dataRows }
}
