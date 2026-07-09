import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { gotoApp } from './helpers'

const FIXTURE = fileURLToPath(new URL('./fixtures/protokoll-beispiel.pdf', import.meta.url))

test('PDF-Import: Extraktion, Mapping, Filter und exakter CSV-Export', async ({ page }) => {
  await gotoApp(page, '#/import')

  await page.getByTestId('pdf-input').setInputFiles(FIXTURE)
  await expect(page.getByTestId('preview-table')).toBeVisible({ timeout: 15_000 })

  // Kopfzeile ist Zeile 2 (Zeile 1 = Dokumenttitel)
  await page.getByTestId('header-row-1').click()

  // Spalten zuordnen
  await page.getByTestId('colmap-0').selectOption('platz')
  await page.getByTestId('colmap-1').selectOption('name')
  await page.getByTestId('colmap-2').selectOption('verein')
  await page.getByTestId('colmap-3').selectOption('jahrgang')
  await page.getByTestId('colmap-4').selectOption('ergebnis')

  // Nur der eigene Verein
  await page.getByTestId('import-filter').fill('SV Neptun')

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('export-csv').click()
  const download = await downloadPromise
  const csv = readFileSync((await download.path())!, 'utf8')

  expect(csv.replace(/^\uFEFF/, '')).toBe(
    [
      'Platz;Name;Verein;Jahrgang;Ergebnis / Zeit',
      '1;Anna Muster;SV Neptun Musterstadt;2008;01:02,45',
      '3;Clara Probe;SV Neptun Musterstadt;2008;01:04,88',
      '6;Frida Fall;SV Neptun Musterstadt;2009;01:08,15',
    ].join('\r\n'),
  )

  // Format speichern → wird beim nächsten Import wiedererkannt
  await page.getByTestId('save-format').click()
  await page.getByTestId('format-name').fill('Schwimmen Bezirk')
  await page.getByTestId('format-save').click()

  await page.getByTestId('pdf-input').setInputFiles(FIXTURE)
  await expect(page.getByText('Format „Schwimmen Bezirk" erkannt')).toBeVisible({ timeout: 15_000 })
})
