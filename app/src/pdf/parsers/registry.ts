import type { ExtractedDoc } from '../extract'
import type { ParsedTable, ProtocolParser } from './types'
import { genericTableParser } from './generic'

/** Dedizierte Parser hier VOR dem generischen eintragen. */
const PARSERS: ProtocolParser[] = [genericTableParser]

export function parseWithBestParser(doc: ExtractedDoc): { parser: ProtocolParser; table: ParsedTable } {
  let best = genericTableParser
  let bestScore = -1
  for (const p of PARSERS) {
    const score = p.detect(doc)
    if (score > bestScore) {
      best = p
      bestScore = score
    }
  }
  return { parser: best, table: best.parse(doc) }
}
