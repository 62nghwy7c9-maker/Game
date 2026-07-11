import type { ExtractedDoc } from '../extract'
import type { ParsedTable, ProtocolParser } from './types'

/**
 * Fallback: nimmt die rekonstruierten Zeilen so, wie sie sind,
 * normalisiert auf die häufigste Spaltenzahl.
 */
export const genericTableParser: ProtocolParser = {
  id: 'generic',
  name: 'Generische Tabelle',

  detect(doc: ExtractedDoc): number {
    return doc.rows.length > 0 ? 0.1 : 0
  },

  parse(doc: ExtractedDoc): ParsedTable {
    const warnings: string[] = []
    const counts = new Map<number, number>()
    for (const r of doc.rows) counts.set(r.length, (counts.get(r.length) ?? 0) + 1)
    const width = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0

    const ragged = doc.rows.filter((r) => r.length !== width).length
    if (ragged > 0) {
      warnings.push(
        `${ragged} von ${doc.rows.length} Zeilen weichen von der typischen Spaltenzahl (${width}) ab — bitte Vorschau prüfen.`,
      )
    }

    const rows = doc.rows.map((r) => {
      if (r.length === width) return r
      if (r.length < width) return [...r, ...new Array<string>(width - r.length).fill('')]
      return [...r.slice(0, width - 1), r.slice(width - 1).join(' ')]
    })

    return {
      columns: Array.from({ length: width }, (_, i) => `Spalte ${i + 1}`),
      rows,
      warnings,
    }
  },
}
