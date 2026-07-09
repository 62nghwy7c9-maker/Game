import type { BackupFile } from '../types'

export const CURRENT_SCHEMA_VERSION = 2

/**
 * Migrationskette: MIGRATIONS[n] hebt Daten von Version n+1 auf n+2 … —
 * d. h. Index 0 migriert v1→v2 usw. Wird sowohl beim App-Start als auch
 * beim Backup-Import angewendet.
 */
export const MIGRATIONS: ((data: BackupFile) => BackupFile)[] = [
  // v1 → v2: Notiz-Vault ergänzt
  (d) => ({ ...d, notes: d.notes ?? [] }),
]

export function migrate(data: BackupFile): BackupFile {
  let d = data
  let v = d.schemaVersion || 1
  if (v > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Dieses Backup stammt aus einer neueren App-Version (Schema ${v}). Bitte zuerst die App aktualisieren.`,
    )
  }
  while (v < CURRENT_SCHEMA_VERSION) {
    d = MIGRATIONS[v - 1](d)
    v += 1
    d.schemaVersion = v
    if (d.settings) d.settings.schemaVersion = v
  }
  return d
}
