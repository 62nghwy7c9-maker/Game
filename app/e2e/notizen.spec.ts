import { expect, test } from '@playwright/test'
import { gotoApp, persisted } from './helpers'

test('Notiz-Vault: anlegen, [[Verlinkung]], Backlink, #Tag-Filter, Graph', async ({ page }) => {
  await gotoApp(page, '#/notizen')

  // Erste Notiz mit Verlinkung und Tag
  await page.getByTestId('new-note').click()
  await page.getByTestId('note-title').fill('Verein')
  await page.getByTestId('note-body').fill('Orga rund um den #verein. Siehe [[Wettkampf]].')

  // Lese-Modus rendert Wikilink + Tag
  await page.getByTestId('mode-read').click()
  await expect(page.locator('.md a.wikilink')).toHaveText('Wettkampf')
  await expect(page.locator('.md a.tag')).toHaveText('#verein')

  // Klick auf [[Wettkampf]] legt die Zielnotiz an und öffnet sie
  await page.locator('.md a.wikilink').click()
  await expect(page.getByTestId('note-title')).toHaveValue('Wettkampf')

  // Diese Zielnotiz zeigt einen Backlink von „Verein"
  await expect(page.getByTestId('backlinks')).toContainText('Verein')

  // Persistenz
  await persisted(page)
  await page.reload()
  await gotoApp(page, '#/notizen')
  await expect(page.getByTestId('note-item')).toHaveCount(2)

  // Tag-Filter: nur die Notiz mit #verein
  await page.locator('.chip', { hasText: 'verein' }).first().click()
  await expect(page.getByTestId('note-item')).toHaveCount(1)
  await expect(page.getByTestId('note-item')).toContainText('Verein')

  // Graph zeigt einen Canvas
  await gotoApp(page, '#/graph')
  await expect(page.getByTestId('graph-canvas')).toBeVisible()
})

test('Notizen-Tab und Capture im Notiz-Modus', async ({ page }) => {
  await gotoApp(page)

  // Eigener Tab „Notizen" ist in der Leiste
  await page.locator('.tabbar a[href="#/notizen"]').click()
  await expect(page.locator('.view-title')).toHaveText('Notizen')

  // Über den +-Knopf im Notiz-Modus eine Notiz anlegen
  await page.getByTestId('capture-fab').click()
  await page.getByTestId('capture-mode-note').click()
  await page.getByTestId('capture-input').fill('Schnellgedanke')
  await page.getByTestId('capture-note-create').click()

  // Landet direkt im Notiz-Editor
  await expect(page.getByTestId('note-title')).toHaveValue('Schnellgedanke')
})
