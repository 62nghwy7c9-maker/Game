import { expect, test } from '@playwright/test'
import { capture, gotoApp } from './helpers'

test('App funktioniert offline (Service Worker Precache)', async ({ page, context }) => {
  await gotoApp(page)

  // Warten, bis der Service Worker aktiv ist (Precache abgeschlossen)
  await page.evaluate(() => navigator.serviceWorker.ready)

  await context.setOffline(true)
  await page.reload()
  await page.locator('.view-title').first().waitFor()
  await expect(page.locator('.view-title')).toHaveText('Heute')

  // Capture funktioniert auch offline
  await capture(page, 'Offline erfasst')
  await expect(page.getByTestId('inbox-badge')).toHaveText('1')

  await context.setOffline(false)
})
