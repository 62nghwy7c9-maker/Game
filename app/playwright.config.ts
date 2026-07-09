import { defineConfig, devices } from '@playwright/test'

const CHROMIUM = '/opt/pw-browsers/chromium'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/Game/',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/Game/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'mobil',
      use: { ...devices['Pixel 5'], launchOptions: { executablePath: CHROMIUM } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: CHROMIUM } },
    },
  ],
})
