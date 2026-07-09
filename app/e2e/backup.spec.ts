import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { capture, gotoApp, persisted } from './helpers'

test('Backup: Export → Daten löschen → Import stellt alles wieder her', async ({ page }) => {
  await gotoApp(page)
  await capture(page, 'Backup-Testaufgabe')
  await expect(page.getByTestId('inbox-badge')).toHaveText('1')
  await persisted(page)

  // Export herunterladen
  await gotoApp(page, '#/einstellungen')
  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('backup-export').click()
  const download = await downloadPromise
  const path = await download.path()
  const backup = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
  expect(backup.app).toBe('wochenkompass')
  expect(backup.tasks.some((t: { title: string }) => t.title === 'Backup-Testaufgabe')).toBe(true)

  // Kompletten Datenbestand löschen
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('wochenkompass')
      req.onsuccess = resolve
      req.onerror = reject
      req.onblocked = resolve
    })
  })
  await page.reload()
  await page.locator('.view-title').first().waitFor()
  await expect(page.getByTestId('inbox-badge')).toHaveCount(0)

  // Import stellt den Stand wieder her
  await gotoApp(page, '#/einstellungen')
  await page.getByTestId('backup-import-input').setInputFiles(path!)
  await page.getByRole('button', { name: 'Importieren' }).click()
  await expect(page.getByTestId('inbox-badge')).toHaveText('1')
  await gotoApp(page, '#/inbox')
  await expect(page.getByText('Backup-Testaufgabe')).toBeVisible()
})
