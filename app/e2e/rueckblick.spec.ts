import { expect, test } from '@playwright/test'
import { gotoApp } from './helpers'

test('Wochenrückblick: kompletter Durchlauf erzeugt Review und gefüllte Folgewoche', async ({ page }) => {
  await gotoApp(page, '#/rueckblick')

  // Schritt 1: Statistik
  await expect(page.getByTestId('review-step1')).toBeVisible()
  await page.getByTestId('review-next').click()

  // Schritt 2: drei Fragen
  await page.getByTestId('review-q1').fill('Training war konstant.')
  await page.getByTestId('review-q2').fill('Buchungssoftware-Ausfall am Mittwoch.')
  await page.getByTestId('review-q3').fill('Puffer am Vormittag einplanen.')
  await page.getByTestId('review-next').click()

  // Schritt 3: Inbox ist leer
  await expect(page.getByTestId('review-step3')).toBeVisible()
  await page.getByTestId('review-next').click()

  // Schritt 4: Vorlage auf nächste Woche anwenden
  await page.getByTestId('review-apply-template').click()
  await expect(page.getByTestId('review-apply-template')).toHaveText(/angewendet/)
  await page.getByTestId('review-next').click()

  // Schritt 5: Top-3 für Montag + Abschluss
  await page.getByTestId('top3-add').click()
  await page.getByTestId('top3-input').fill('Wochenstart: Fokusblock nutzen')
  await page.getByTestId('top3-save').click()
  await page.getByTestId('review-finish').click()

  // Zurück auf Heute
  await expect(page.locator('.view-title')).toHaveText('Heute')

  // Review gespeichert
  await gotoApp(page, '#/rueckblick')
  await expect(page.getByText('Frühere Rückblicke')).toBeVisible()
  await expect(page.getByText('Puffer am Vormittag einplanen.')).toBeVisible()

  // Folgewoche ist gefüllt
  await gotoApp(page, '#/woche')
  await page.getByTestId('week-next').click()
  await expect(page.getByTestId('week-block')).toHaveCount(11)
})
