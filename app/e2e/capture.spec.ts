import { expect, test } from '@playwright/test'
import { capture, gotoApp, persisted } from './helpers'

test('Capture aus jeder View, Serien-Erfassung, Badge und Persistenz', async ({ page }) => {
  await gotoApp(page)

  // Serien-Erfassung: Enter speichert, Sheet bleibt offen
  await page.getByTestId('capture-fab').click()
  await page.getByTestId('capture-input').fill('Erster Gedanke')
  await page.getByTestId('capture-input').press('Enter')
  await expect(page.getByTestId('capture-input')).toHaveValue('')
  await page.getByTestId('capture-input').fill('Zweiter Gedanke')
  await page.getByTestId('capture-save').click()
  await page.getByTestId('capture-done').click()

  await expect(page.getByTestId('inbox-badge')).toHaveText('2')

  // Capture funktioniert auch aus der Wochen-View
  await gotoApp(page, '#/woche')
  await capture(page, 'Dritter Gedanke')
  await expect(page.getByTestId('inbox-badge')).toHaveText('3')

  // Persistenz über Reload
  await persisted(page)
  await page.reload()
  await expect(page.getByTestId('inbox-badge')).toHaveText('3')

  // Einträge stehen in der Inbox
  await gotoApp(page, '#/inbox')
  await expect(page.getByText('Erster Gedanke')).toBeVisible()
  await expect(page.getByText('Dritter Gedanke')).toBeVisible()
})
