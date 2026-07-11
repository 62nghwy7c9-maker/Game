function escapeCsvCell(cell: string, sep: string): string {
  if (cell.includes(sep) || cell.includes('"') || cell.includes('\n')) {
    return `"${cell.replace(/"/g, '""')}"`
  }
  return cell
}

/** CSV mit Semikolon und BOM — öffnet in deutschem Excel direkt korrekt. */
export function toCsv(rows: string[][], sep = ';'): string {
  return '\uFEFF' + rows.map((r) => r.map((c) => escapeCsvCell(c, sep)).join(sep)).join('\r\n')
}

/** TSV für die Zwischenablage — direkt in Excel/Sheets einfügbar. */
export function toTsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => c.replace(/\t/g, ' ')).join('\t')).join('\n')
}

export function downloadCsv(rows: string[][], filename: string): void {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
