import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Fallback-Build: eine einzelne HTML-Datei (docs/offline/wochenkompass.html),
 * die ohne Webserver direkt im Browser geöffnet werden kann.
 * Kein Service Worker / keine Installation — Daten liegen trotzdem in IndexedDB.
 */
export default defineConfig({
  base: './',
  build: {
    outDir: '../docs/offline',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
  },
  plugins: [
    preact(),
    // disable: true liefert trotzdem das virtuelle Modul 'virtual:pwa-register' (No-op)
    VitePWA({ disable: true }),
    viteSingleFile(),
  ],
})
