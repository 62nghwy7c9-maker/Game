import { expect, test } from '@playwright/test'
import { capture, gotoApp } from './helpers'

test('Triage: alle vier Wege leeren die Inbox', async ({ page }) => {
  await gotoApp(page)

  // Pufferblöcke sicherstellen: Vorlage auf diese UND nächste Woche anwenden
  await gotoApp(page, '#/woche')
  await page.getByTestId('apply-template').click()
  await expect(page.getByTestId('week-block')).toHaveCount(11)
  await page.getByTestId('week-next').click()
  await page.getByTestId('apply-template').click()
  await expect(page.getByTestId('week-block')).toHaveCount(11)

  // Vier Einträge erfassen
  await capture(page, 'Aufgabe sofort')
  await capture(page, 'Aufgabe Puffer')
  await capture(page, 'Aufgabe Wochenplanung')
  await capture(page, 'Aufgabe Detail')
  await expect(page.getByTestId('inbox-badge')).toHaveText('4')

  await gotoApp(page, '#/inbox')
  await page.getByTestId('start-triage').click()

  // Weg 1: sofort erledigt
  await expect(page.getByTestId('triage-title')).toHaveText('Aufgabe sofort')
  await page.getByTestId('triage-sofort').click()

  // Weg 2: in nächsten Pufferblock
  await expect(page.getByTestId('triage-title')).toHaveText('Aufgabe Puffer')
  await page.getByTestId('triage-puffer').click()

  // Weg 3: in die Wochenplanung
  await expect(page.getByTestId('triage-title')).toHaveText('Aufgabe Wochenplanung')
  await page.getByTestId('triage-woche').click()

  // Weg 4: Bereich & Datum
  await expect(page.getByTestId('triage-title')).toHaveText('Aufgabe Detail')
  await page.getByTestId('triage-detail').click()
  await page.locator('.chip', { hasText: 'Verein' }).click()
  await page.getByTestId('triage-detail-save').click()

  // Fertig: Inbox leer
  await expect(page.getByTestId('triage-done')).toBeVisible()
  await expect(page.getByTestId('inbox-badge')).toHaveCount(0)

  // Die Detail-Aufgabe liegt jetzt im Bereich „Verein"
  await gotoApp(page, '#/bereiche')
  await page.getByTestId('area-card').filter({ hasText: 'Verein' }).click()
  await expect(page.getByText('Aufgabe Detail')).toBeVisible()
})
