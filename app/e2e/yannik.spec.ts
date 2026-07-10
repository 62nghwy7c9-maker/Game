import { expect, test } from '@playwright/test'
import { capture, gotoApp } from './helpers'

test('Yannik sortiert die Inbox offline nach Bereichen', async ({ page }) => {
  await gotoApp(page)
  await capture(page, 'Kunden-Meeting vorbereiten')
  await capture(page, 'Lauftraining Ausdauer')
  await expect(page.getByTestId('inbox-badge')).toHaveText('2')

  // Yannik-Maskottchen einblenden und Assistent öffnen
  await page.getByTestId('mascot-summon').click()
  await page.getByTestId('mascot-assistant').click()

  // Offline-Sortierung starten
  await page.getByTestId('yannik-sort').click()
  const proposals = page.getByTestId('yannik-proposals')
  await expect(proposals).toBeVisible()
  await expect(proposals.getByText('Beruf')).toBeVisible()
  await expect(proposals.getByText('Training')).toBeVisible()

  // Übernehmen und prüfen, dass die Aufgaben nun einen Bereich haben
  await page.getByTestId('yannik-apply').click()

  await gotoApp(page, '#/inbox')
  await expect(page.getByText('Kunden-Meeting vorbereiten')).toBeVisible()
  // Bereich-Punkte tragen den Bereichsnamen als Titel — Aufgaben wurden einsortiert
  await expect(page.locator('.area-dot[title="Beruf"]')).toBeVisible()
  await expect(page.locator('.area-dot[title="Training"]')).toBeVisible()
})
