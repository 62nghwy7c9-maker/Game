export interface ExtractedDoc {
  numPages: number
  /** Erkannte Tabellenzeilen (Seiten aneinandergehängt) */
  rows: string[][]
  /** true, wenn das PDF gar keinen Textlayer hat (z. B. Scan) */
  hasText: boolean
}

interface Item {
  x: number
  y: number
  w: number
  str: string
}

/** 1-D-Clustering: sortierte Werte, neue Gruppe wenn Lücke > tol. Liefert Gruppen-Mittelwerte. */
function cluster1d(values: number[], tol: number): number[] {
  if (values.length === 0) return []
  const sorted = [...values].sort((a, b) => a - b)
  const centers: number[] = []
  let group: number[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > tol) {
      centers.push(group.reduce((a, b) => a + b, 0) / group.length)
      group = []
    }
    group.push(sorted[i])
  }
  centers.push(group.reduce((a, b) => a + b, 0) / group.length)
  return centers
}

const Y_TOL = 2.5 // Punkte: Items derselben Zeile
const WORD_GAP = 7 // Punkte: kleinere Lücken = gleiche Zelle (Wortabstand)
const COL_TOL = 14 // Punkte: Zellen-Anfänge, die zusammen eine Spalte bilden

/**
 * Extrahiert Text aus einem PDF und rekonstruiert eine Tabelle:
 * Items → Zeilen (y-Clustering) → Zellen (Lücken-Analyse) → Spalten (x-Clustering).
 */
export async function extractPdf(data: ArrayBuffer): Promise<ExtractedDoc> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const doc = await pdfjs.getDocument({ data }).promise
  const allRows: string[][] = []
  let hasText = false

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()

    const items: Item[] = []
    for (const it of content.items) {
      if (!('str' in it) || it.str.trim() === '') continue
      items.push({ x: it.transform[4], y: it.transform[5], w: it.width, str: it.str })
    }
    if (items.length > 0) hasText = true

    // Zeilen über y-Position clustern (PDF-y wächst nach oben → absteigend sortieren)
    const lines = new Map<number, Item[]>()
    const yCenters = cluster1d(items.map((i) => i.y), Y_TOL)
    for (const it of items) {
      const center = yCenters.reduce((best, c) => (Math.abs(c - it.y) < Math.abs(best - it.y) ? c : best), yCenters[0])
      const line = lines.get(center) ?? []
      line.push(it)
      lines.set(center, line)
    }

    // Innerhalb der Zeile: Items mit kleiner Lücke zu Zellen verschmelzen
    interface Cell {
      x: number
      text: string
    }
    const pageRows: { y: number; cells: Cell[] }[] = []
    for (const [y, line] of lines) {
      line.sort((a, b) => a.x - b.x)
      const cells: Cell[] = []
      let lastEnd = -Infinity
      for (const it of line) {
        const last = cells[cells.length - 1]
        if (last && it.x - lastEnd < WORD_GAP) {
          last.text += (it.x - lastEnd > 0.5 ? ' ' : '') + it.str
        } else {
          cells.push({ x: it.x, text: it.str })
        }
        lastEnd = it.x + it.w
      }
      pageRows.push({ y, cells })
    }
    pageRows.sort((a, b) => b.y - a.y)

    // Spaltenanker aus allen Zellen-Anfängen der Seite
    const anchors = cluster1d(
      pageRows.flatMap((r) => r.cells.map((c) => c.x)),
      COL_TOL,
    )

    for (const row of pageRows) {
      const out = new Array<string>(anchors.length).fill('')
      for (const cell of row.cells) {
        let idx = 0
        let best = Infinity
        anchors.forEach((a, i) => {
          const d = Math.abs(a - cell.x)
          if (d < best) {
            best = d
            idx = i
          }
        })
        out[idx] = out[idx] ? `${out[idx]} ${cell.text}` : cell.text
      }
      if (out.some((c) => c.trim() !== '')) allRows.push(out.map((c) => c.trim()))
    }
  }

  const numPages = doc.numPages
  await doc.destroy()
  return { numPages, rows: allRows, hasText }
}
