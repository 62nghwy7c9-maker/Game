import type { Page } from '@playwright/test'

export async function gotoApp(page: Page, hash = '#/heute'): Promise<void> {
  await page.goto(`./${hash}`)
  // Intro-Splash (einmal pro Session) wegklicken, damit es Klicks nicht blockiert
  const intro = page.getByTestId('intro-splash')
  if (await intro.count()) {
    await intro.click({ timeout: 1500 }).catch(() => {})
    await intro.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
  }
  // Maskottchen einklappen, damit die Sprechblase keine Klicks abfängt
  const mascotClose = page.getByTestId('mascot-close')
  if (await mascotClose.count()) {
    await mascotClose.click({ timeout: 1000 }).catch(() => {})
  }
  await page.locator('.view-title').first().waitFor()
}

/** Erfasst einen Inbox-Eintrag über den FAB. */
export async function capture(page: Page, text: string): Promise<void> {
  await page.getByTestId('capture-fab').click()
  await page.getByTestId('capture-input').fill(text)
  await page.getByTestId('capture-save').click()
  await page.getByTestId('capture-done').click()
}

/** Wartet, bis die debounced IndexedDB-Persistierung sicher durch ist. */
export async function persisted(page: Page): Promise<void> {
  await page.waitForTimeout(700)
}
