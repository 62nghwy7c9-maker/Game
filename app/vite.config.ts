import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // relative Basis: funktioniert egal, ob Pages den Ordner /docs oder das Repo-Root ausliefert
  base: './',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,ico,woff2}'],
      },
      manifest: {
        name: 'Zeitzauber',
        short_name: 'Zeitzauber',
        description:
          'Zeitzauber: Wochenplanung mit Zeitblöcken, Capture-Inbox, Triage, Notiz-Vault und Wochenrückblick — deine Daten bleiben auf deinem Gerät.',
        lang: 'de',
        display: 'standalone',
        background_color: '#070b12',
        theme_color: '#070b12',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Schnell erfassen',
            short_name: 'Erfassen',
            url: './index.html#/inbox?capture=1',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
})
