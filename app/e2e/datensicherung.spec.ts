import { expect, test } from '@playwright/test'
import { capture, gotoApp } from './helpers'

test('Automatische Gerätesicherung stellt Daten nach DB-Verlust wieder her', async ({ page }) => {
  await gotoApp(page)
  await capture(page, 'Sicherungstest')
  await expect(page.getByTestId('inbox-badge')).toHaveText('1')

  // Warten, bis der localStorage-Spiegel geschrieben ist
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('zz-mirror')?.includes('Sicherungstest') ?? false))
    .toBe(true)

  // Hauptdatenbank (IndexedDB) löschen — Spiegel in localStorage bleibt erhalten
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('wochenkompass')
      req.onsuccess = () => resolve(null)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    })
  })

  await page.reload()
  await gotoApp(page)

  // Daten sind aus der automatischen Sicherung wiederhergestellt
  await expect(page.getByTestId('inbox-badge')).toHaveText('1')
  await gotoApp(page, '#/inbox')
  await expect(page.getByText('Sicherungstest')).toBeVisible()
})

test('Einstellungen zeigen den Datensicherheits-Status', async ({ page }) => {
  await gotoApp(page, '#/einstellungen')
  await expect(page.getByText('Datensicherheit')).toBeVisible()
  await expect(page.getByText('Automatische Gerätesicherung')).toBeVisible()
})
