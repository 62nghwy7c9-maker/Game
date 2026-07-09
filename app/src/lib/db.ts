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
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist()
  } catch {
    // nicht unterstützt — unkritisch
  }
}
