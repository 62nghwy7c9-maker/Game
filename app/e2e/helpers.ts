import type { Page } from '@playwright/test'

export async function gotoApp(page: Page, hash = '#/heute'): Promise<void> {
  await page.goto(`./${hash}`)
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
