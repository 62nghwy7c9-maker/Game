import type { BackupFile } from '../types'

/**
 * Automatische Zweit-Sicherung auf dem Gerät: neben der Haupt-Datenbank
 * (IndexedDB) wird zusätzlich eine vollständige Kopie in localStorage
 * gespiegelt. Fällt die Hauptdatenbank aus oder ist sie leer, kann daraus
 * automatisch wiederhergestellt werden.
 */

const MIRROR_KEY = 'zz-mirror'
const MIRROR_AT_KEY = 'zz-mirror-at'

export function saveMirror(data: BackupFile): void {
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(data))
    localStorage.setItem(MIRROR_AT_KEY, new Date().toISOString())
  } catch {
    // Quota erschöpft oder Privat-Modus — unkritisch, Hauptspeicher bleibt maßgeblich
  }
}

export function loadMirror(): BackupFile | null {
  try {
    const raw = localStorage.getItem(MIRROR_KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as BackupFile
    return d && d.app === 'wochenkompass' ? d : null
  } catch {
    return null
  }
}

export function mirrorSavedAt(): string | null {
  try {
    return localStorage.getItem(MIRROR_AT_KEY)
  } catch {
    return null
  }
}
