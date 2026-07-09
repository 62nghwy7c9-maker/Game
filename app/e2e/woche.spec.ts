import { expect, test } from '@playwright/test'
import { gotoApp, persisted } from './helpers'

test('Vorlage anwenden, Block per Frei-Slot anlegen, bearbeiten, Wochenwechsel', async ({ page }) => {
  await gotoApp(page, '#/woche')

  // Standardwoche anwenden → 11 Blöcke aus der Seed-Vorlage
  await page.getByTestId('apply-template').click()
  await expect(page.getByTestId('week-block')).toHaveCount(11)

  // Nochmal anwenden: alles kollidiert, nichts kommt dazu
  await page.getByTestId('apply-template').click()
  await expect(page.getByTestId('week-block')).toHaveCount(11)

  // Neuen Block über eine freie Fläche anlegen
  await page.locator('.free-slot').first().click()
  await page.getByTestId('block-title').fill('Testblock')
  await page.getByTestId('block-save').click()
  await expect(page.getByTestId('week-block')).toHaveCount(12)

  // Block bearbeiten
  await page.getByTestId('week-block').filter({ hasText: 'Testblock' }).first().click()
  await page.getByTestId('block-title').fill('Testblock umbenannt')
  await page.getByTestId('block-save').click()
  await expect(page.getByTestId('week-block').filter({ hasText: 'Testblock umbenannt' })).toHaveCount(1)

  // Persistenz
  await persisted(page)
  await page.reload()
  await expect(page.getByTestId('week-block')).toHaveCount(12)

  // Wochenwechsel: nächste Woche ist leer, zurück wieder gefüllt
  const label = await page.getByTestId('week-label').innerText()
  await page.getByTestId('week-next').click()
  await expect(page.getByTestId('week-label')).not.toHaveText(label)
  await expect(page.getByTestId('week-block')).toHaveCount(0)
  await page.getByTestId('week-prev').click()
  await expect(page.getByTestId('week-block')).toHaveCount(12)
})
