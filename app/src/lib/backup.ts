import type { BackupFile } from '../types'
import { buildBackup, restoreBackup, settings } from '../state/store'
import { nowIso } from './id'
import { todayIso } from './dates'

export function downloadBackup(): void {
  const data = buildBackup()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zeitzauber-backup-${todayIso()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  settings.value = { ...settings.value, lastBackupAt: nowIso() }
}

export function validateBackup(raw: unknown): BackupFile {
  const d = raw as Partial<BackupFile>
  if (!d || typeof d !== 'object' || d.app !== 'wochenkompass') {
    throw new Error('Das ist keine Zeitzauber-Backup-Datei.')
  }
  if (typeof d.schemaVersion !== 'number') throw new Error('Backup ohne Schema-Version — Datei beschädigt?')
  for (const key of ['areas', 'tasks', 'weeks', 'templates', 'dayPlans', 'reviews', 'mappings'] as const) {
    if (!Array.isArray(d[key])) throw new Error(`Backup unvollständig: „${key}" fehlt.`)
  }
  if (!d.settings || typeof d.settings !== 'object') throw new Error('Backup unvollständig: Einstellungen fehlen.')
  return d as BackupFile
}

export async function importBackupFile(file: File): Promise<void> {
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.')
  }
  await restoreBackup(validateBackup(raw))
}

export function daysSinceLastBackup(): number | null {
  const last = settings.value.lastBackupAt
  if (!last) return null
  return Math.floor((Date.now() - new Date(last).getTime()) / 86400000)
}
