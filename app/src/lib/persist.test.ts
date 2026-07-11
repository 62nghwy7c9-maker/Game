import { beforeEach, describe, expect, it } from 'vitest'
import { loadMirror, mirrorSavedAt, saveMirror } from './persist'
import type { BackupFile } from '../types'

// Minimaler localStorage-Ersatz für die Node-Testumgebung
beforeEach(() => {
  const store = new Map<string, string>()
  ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage
})

function sample(): BackupFile {
  return {
    app: 'wochenkompass',
    schemaVersion: 2,
    exportedAt: '2026-07-10T00:00:00.000Z',
    areas: [],
    tasks: [],
    weeks: [],
    templates: [],
    dayPlans: [],
    reviews: [],
    mappings: [],
    notes: [],
    settings: { schemaVersion: 2, wakeStart: '06:00', wakeEnd: '22:00', onboardingDone: false },
  }
}

describe('Geräte-Spiegel (persist)', () => {
  it('speichert und lädt einen gültigen Spiegel', () => {
    expect(loadMirror()).toBeNull()
    saveMirror(sample())
    const back = loadMirror()
    expect(back?.app).toBe('wochenkompass')
    expect(mirrorSavedAt()).not.toBeNull()
  })

  it('lehnt fremde/kaputte Daten ab', () => {
    localStorage.setItem('zz-mirror', '{"app":"etwas-anderes"}')
    expect(loadMirror()).toBeNull()
    localStorage.setItem('zz-mirror', 'kein json')
    expect(loadMirror()).toBeNull()
  })
})
