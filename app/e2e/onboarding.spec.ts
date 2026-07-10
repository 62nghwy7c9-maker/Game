import { expect, test } from '@playwright/test'

test('Erster Start zeigt Yannik Potter und erklärt die App', async ({ page }) => {
  await page.goto('./#/heute')
  // Intro-Animation wegklicken
  const intro = page.getByTestId('intro-splash')
  if (await intro.count()) {
    await intro.click({ timeout: 1500 }).catch(() => {})
    await intro.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
  }
  // Onboarding erscheint
  const onb = page.getByTestId('onboarding')
  await expect(onb).toBeVisible()
  await expect(onb.getByText('Yannik Potter')).toBeVisible()

  // Durchklicken bis zum Ende
  await page.getByTestId('onboarding-next').click()
  await page.getByTestId('onboarding-next').click()
  await expect(onb.getByRole('heading', { name: /KIannik/ })).toBeVisible()
  await page.getByTestId('onboarding-next').click()
  await expect(onb).toHaveCount(0)

  // Erscheint nach Reload nicht erneut
  await page.reload()
  await page.locator('.view-title').first().waitFor()
  await expect(page.getByTestId('onboarding')).toHaveCount(0)
})
