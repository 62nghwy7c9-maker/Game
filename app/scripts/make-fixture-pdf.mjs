// Erzeugt e2e/fixtures/protokoll-beispiel.pdf — eine synthetische Wettkampf-Ergebnisliste.
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { mkdirSync, writeFileSync } from 'node:fs'

const doc = await PDFDocument.create()
const page = doc.addPage([595, 842]) // A4
const font = await doc.embedFont(StandardFonts.Helvetica)
const bold = await doc.embedFont(StandardFonts.HelveticaBold)

const cols = [50, 90, 250, 420, 490]

function row(y, cells, f = font) {
  cells.forEach((text, i) => page.drawText(String(text), { x: cols[i], y, size: 10, font: f }))
}

page.drawText('Ergebnisliste 100m Freistil - Bezirksmeisterschaft', { x: 50, y: 790, size: 14, font: bold })

let y = 750
row(y, ['Platz', 'Name', 'Verein', 'Jahrgang', 'Zeit'], bold)
const data = [
  ['1', 'Anna Muster', 'SV Neptun Musterstadt', '2008', '01:02,45'],
  ['2', 'Ben Beispiel', 'TSV Beispielhausen', '2007', '01:03,10'],
  ['3', 'Clara Probe', 'SV Neptun Musterstadt', '2008', '01:04,88'],
  ['4', 'David Demo', 'SC Wasserfreunde', '2009', '01:05,02'],
  ['5', 'Emil Test', 'TSV Beispielhausen', '2008', '01:07,30'],
  ['6', 'Frida Fall', 'SV Neptun Musterstadt', '2009', '01:08,15'],
]
for (const r of data) {
  y -= 22
  row(y, r)
}

mkdirSync('e2e/fixtures', { recursive: true })
writeFileSync('e2e/fixtures/protokoll-beispiel.pdf', await doc.save())
console.log('wrote e2e/fixtures/protokoll-beispiel.pdf')
