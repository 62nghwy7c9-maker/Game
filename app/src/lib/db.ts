import { createStore, get, set, entries } from 'idb-keyval'

const store = createStore('wochenkompass', 'daten')

export type CollectionKey =
  | 'areas'
  | 'tasks'
  | 'weeks'
  | 'templates'
  | 'dayPlans'
  | 'reviews'
  | 'mappings'
  | 'notes'
  | 'settings'

export async function dbGet<T>(key: CollectionKey): Promise<T | undefined> {
  return get<T>(key, store)
}

export async function dbSet(key: CollectionKey, value: unknown): Promise<void> {
  await set(key, value, store)
}

export async function dbEntries(): Promise<[IDBValidKey, unknown][]> {
  return entries(store)
}

/** Dauerhafte Speicherung anfordern (Schutz vor Browser-Aufräumen, v. a. iOS). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist()
  } catch {
    // nicht unterstützt — unkritisch
  }
  return false
}

/** Ist die dauerhafte Speicherung bereits gewährt? */
export async function isStoragePersisted(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted) return await navigator.storage.persisted()
  } catch {
    // nicht unterstützt
  }
  return false
}
