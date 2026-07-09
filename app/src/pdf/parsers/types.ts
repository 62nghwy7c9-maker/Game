import type { ExtractedDoc } from '../extract'

export interface ParsedTable {
  /** Spaltenüberschriften (generisch „Spalte N", solange kein Mapping gewählt ist) */
  columns: string[]
  rows: string[][]
  warnings: string[]
}

/**
 * Erweiterungspunkt für dedizierte Protokoll-Formate (z. B. SELTEC, EasyWK):
 * neuen Parser als Datei anlegen und in registry.ts registrieren.
 */
export interface ProtocolParser {
  id: string
  name: string
  /** Konfidenz 0..1, dass dieser Parser das Dokument versteht */
  detect(doc: ExtractedDoc): number
  parse(doc: ExtractedDoc): ParsedTable
}
