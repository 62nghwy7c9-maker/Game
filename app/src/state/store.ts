import { computed, effect, signal } from '@preact/signals'
import type {
  Area,
  Block,
  BlockDef,
  DayPlan,
  Review,
  SavedMapping,
  Settings,
  Task,
  Top3Item,
  Week,
  WeekTemplate,
} from '../types'
import { dbGet, dbSet, requestPersistentStorage, type CollectionKey } from '../lib/db'
import { CURRENT_SCHEMA_VERSION, migrate } from '../lib/migrations'
import { newId, nowIso } from '../lib/id'
import { addWeeks, currentWeekId, datesOfWeek, todayIso, toMinutes } from '../lib/dates'
import { overlapsAny } from '../lib/freeslots'
import type { BackupFile } from '../types'

// ---------- Signals ----------

export const areas = signal<Area[]>([])
export const tasks = signal<Task[]>([])
export const weeks = signal<Week[]>([])
export const templates = signal<WeekTemplate[]>([])
export const dayPlans = signal<DayPlan[]>([])
export const reviews = signal<Review[]>([])
export const mappings = signal<SavedMapping[]>([])
export const settings = signal<Settings>(defaultSettings())
export const ready = signal(false)

export const inboxTasks = computed(() => tasks.value.filter((t) => t.status === 'inbox'))
export const activeAreas = computed(() =>
  areas.value.filter((a) => !a.archived).sort((a, b) => a.order - b.order),
)

function defaultSettings(): Settings {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    wakeStart: '06:00',
    wakeEnd: '22:00',
    onboardingDone: false,
  }
}

// ---------- Laden & Persistieren ----------

const AREA_SEED: [string, string][] = [
  ['Beruf', 'var(--area-blau)'],
  ['Verein', 'var(--area-lila)'],
  ['Training', 'var(--area-gruen)'],
  ['Haushalt', 'var(--area-orange)'],
  ['Privat', 'var(--area-tuerkis)'],
]

function seedAreas(): Area[] {
  const t = nowIso()
  return AREA_SEED.map(([name, color], i) => ({
    id: newId(),
    name,
    color,
    order: i,
    archived: false,
    createdAt: t,
    updatedAt: t,
  }))
}

function seedTemplate(seedAreaList: Area[]): WeekTemplate {
  const areaId = (name: string) => seedAreaList.find((a) => a.name === name)?.id
  const def = (weekday: number, start: string, end: string, title: string, type: BlockDef['type'], area?: string): BlockDef => ({
    id: newId(),
    weekday,
    start,
    end,
    title,
    type,
    areaId: area ? areaId(area) : undefined,
  })
  return {
    id: 'standard',
    name: 'Standardwoche',
    updatedAt: nowIso(),
    blocks: [
      def(0, '09:00', '10:30', 'Fokusblock', 'fokus', 'Beruf'),
      def(2, '09:00', '10:30', 'Fokusblock', 'fokus', 'Beruf'),
      def(1, '18:30', '20:00', 'Training', 'training', 'Training'),
      def(3, '18:30', '20:00', 'Training', 'training', 'Training'),
      def(0, '17:00', '17:30', 'Puffer für Ungeplantes', 'puffer'),
      def(1, '17:00', '17:30', 'Puffer für Ungeplantes', 'puffer'),
      def(2, '17:00', '17:30', 'Puffer für Ungeplantes', 'puffer'),
      def(3, '17:00', '17:30', 'Puffer für Ungeplantes', 'puffer'),
      def(4, '16:00', '17:00', 'Puffer für Ungeplantes', 'puffer'),
      def(5, '10:00', '11:00', 'Admin-Krimskrams (gebündelt)', 'admin'),
      def(6, '18:00', '18:30', 'Wochenrückblick & Planung', 'sonstiges'),
    ],
  }
}

export async function loadAll(): Promise<void> {
  const [a, t, w, tpl, dp, rv, mp, st] = await Promise.all([
    dbGet<Area[]>('areas'),
    dbGet<Task[]>('tasks'),
    dbGet<Week[]>('weeks'),
    dbGet<WeekTemplate[]>('templates'),
    dbGet<DayPlan[]>('dayPlans'),
    dbGet<Review[]>('reviews'),
    dbGet<SavedMapping[]>('mappings'),
    dbGet<Settings>('settings'),
  ])

  if (st && st.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const migrated = migrate({
      app: 'wochenkompass',
      schemaVersion: st.schemaVersion,
      exportedAt: nowIso(),
      areas: a ?? [],
      tasks: t ?? [],
      weeks: w ?? [],
      templates: tpl ?? [],
      dayPlans: dp ?? [],
      reviews: rv ?? [],
      mappings: mp ?? [],
      settings: st,
    })
    areas.value = migrated.areas
    tasks.value = migrated.tasks
    weeks.value = migrated.weeks
    templates.value = migrated.templates
    dayPlans.value = migrated.dayPlans
    reviews.value = migrated.reviews
    mappings.value = migrated.mappings
    settings.value = migrated.settings
  } else {
    const firstStart = !st
    const seededAreas = a && a.length > 0 ? a : seedAreas()
    areas.value = seededAreas
    tasks.value = t ?? []
    weeks.value = w ?? []
    templates.value = tpl && tpl.length > 0 ? tpl : [seedTemplate(seededAreas)]
    dayPlans.value = dp ?? []
    reviews.value = rv ?? []
    mappings.value = mp ?? []
    settings.value = st ?? defaultSettings()
    if (firstStart) {
      await Promise.all([
        dbSet('areas', areas.value),
        dbSet('templates', templates.value),
        dbSet('settings', settings.value),
      ])
    }
  }

  ready.value = true
  void requestPersistentStorage()
}

/** Persistiert jede Collection debounced, sobald sich ihr Signal ändert. */
function autoPersist(key: CollectionKey, sig: { value: unknown }): void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let first = true
  effect(() => {
    const value = sig.value
    if (!ready.value) return
    if (first) {
      // erster Lauf nach ready: nur beobachten, nichts schreiben
      first = false
      return
    }
    clearTimeout(timer)
    timer = setTimeout(() => void dbSet(key, value), 250)
  })
}

autoPersist('areas', areas)
autoPersist('tasks', tasks)
autoPersist('weeks', weeks)
autoPersist('templates', templates)
autoPersist('dayPlans', dayPlans)
autoPersist('reviews', reviews)
autoPersist('mappings', mappings)
autoPersist('settings', settings)

/** Sofort alles wegschreiben (z. B. vor Backup-Import oder in Tests). */
export async function flushAll(): Promise<void> {
  await Promise.all([
    dbSet('areas', areas.value),
    dbSet('tasks', tasks.value),
    dbSet('weeks', weeks.value),
    dbSet('templates', templates.value),
    dbSet('dayPlans', dayPlans.value),
    dbSet('reviews', reviews.value),
    dbSet('mappings', mappings.value),
    dbSet('settings', settings.value),
  ])
}

// ---------- Bereiche ----------

export const AREA_COLORS = [
  'var(--area-blau)',
  'var(--area-gruen)',
  'var(--area-orange)',
  'var(--area-rot)',
  'var(--area-lila)',
  'var(--area-tuerkis)',
  'var(--area-pink)',
  'var(--area-braun)',
  'var(--area-grau)',
  'var(--area-indigo)',
]

export function addArea(name: string, color: string): Area {
  const t = nowIso()
  const area: Area = {
    id: newId(),
    name,
    color,
    order: areas.value.length,
    archived: false,
    createdAt: t,
    updatedAt: t,
  }
  areas.value = [...areas.value, area]
  return area
}

export function updateArea(id: string, patch: Partial<Area>): void {
  areas.value = areas.value.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: nowIso() } : a))
}

export function areaById(id?: string): Area | undefined {
  return id ? areas.value.find((a) => a.id === id) : undefined
}

// ---------- Tasks ----------

export function captureTask(title: string, areaId?: string): Task {
  const t = nowIso()
  const task: Task = {
    id: newId(),
    title: title.trim(),
    areaId,
    status: 'inbox',
    createdAt: t,
    updatedAt: t,
  }
  tasks.value = [...tasks.value, task]
  return task
}

export function updateTask(id: string, patch: Partial<Task>): void {
  tasks.value = tasks.value.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t))
}

export function toggleTaskDone(id: string): void {
  const task = tasks.value.find((t) => t.id === id)
  if (!task) return
  if (task.status === 'erledigt') {
    updateTask(id, { status: 'offen', completedAt: undefined })
  } else {
    updateTask(id, { status: 'erledigt', completedAt: nowIso() })
  }
}

export function deleteTask(id: string): void {
  tasks.value = tasks.value.filter((t) => t.id !== id)
  // Referenzen aus Blöcken entfernen
  weeks.value = weeks.value.map((w) => ({
    ...w,
    blocks: w.blocks.map((b) => (b.taskIds.includes(id) ? { ...b, taskIds: b.taskIds.filter((x) => x !== id) } : b)),
  }))
}

// ---------- Wochen & Blöcke ----------

export function ensureWeek(weekId: string): Week {
  const existing = weeks.value.find((w) => w.id === weekId)
  if (existing) return existing
  const t = nowIso()
  const week: Week = { id: weekId, blocks: [], createdAt: t, updatedAt: t }
  weeks.value = [...weeks.value, week]
  return week
}

export function weekById(weekId: string): Week | undefined {
  return weeks.value.find((w) => w.id === weekId)
}

export function updateWeek(weekId: string, mutate: (w: Week) => Week): void {
  ensureWeek(weekId)
  weeks.value = weeks.value.map((w) => (w.id === weekId ? { ...mutate(w), updatedAt: nowIso() } : w))
}

export function addBlock(weekId: string, block: Omit<Block, 'id' | 'taskIds'>): Block {
  const full: Block = { ...block, id: newId(), taskIds: [] }
  updateWeek(weekId, (w) => ({ ...w, blocks: [...w.blocks, full] }))
  return full
}

export function updateBlock(weekId: string, blockId: string, patch: Partial<Block>): void {
  updateWeek(weekId, (w) => ({
    ...w,
    blocks: w.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
  }))
}

export function deleteBlock(weekId: string, blockId: string): void {
  updateWeek(weekId, (w) => ({ ...w, blocks: w.blocks.filter((b) => b.id !== blockId) }))
  tasks.value = tasks.value.map((t) =>
    t.plannedBlockId === blockId ? { ...t, plannedBlockId: undefined, updatedAt: nowIso() } : t,
  )
}

export function standardTemplate(): WeekTemplate {
  return templates.value[0] ?? seedTemplate(areas.value)
}

export function saveTemplateBlocks(blocks: BlockDef[]): void {
  const tpl = standardTemplate()
  templates.value = [{ ...tpl, blocks, updatedAt: nowIso() }, ...templates.value.slice(1)]
}

/**
 * Wendet die Standardwoche auf eine Woche an. Bestehende Blöcke bleiben;
 * Template-Blöcke, die kollidieren, werden übersprungen.
 * Liefert { added, skipped }.
 */
export function applyTemplate(weekId: string): { added: number; skipped: number } {
  const tpl = standardTemplate()
  const dates = datesOfWeek(weekId)
  let added = 0
  let skipped = 0
  updateWeek(weekId, (w) => {
    const blocks = [...w.blocks]
    for (const def of tpl.blocks) {
      const date = dates[def.weekday]
      const sameDay = blocks.filter((b) => b.date === date)
      if (overlapsAny(sameDay, def.start, def.end)) {
        skipped += 1
        continue
      }
      blocks.push({ ...def, id: newId(), date, taskIds: [] })
      added += 1
    }
    return { ...w, blocks, appliedTemplateAt: nowIso() }
  })
  return { added, skipped }
}

/** Nächster Pufferblock ab jetzt (diese oder nächste Woche). */
export function nextPufferBlock(): { weekId: string; block: Block } | null {
  const today = todayIso()
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (const weekId of [currentWeekId(), addWeeks(currentWeekId(), 1)]) {
    const week = weekById(weekId)
    if (!week) continue
    const candidates = week.blocks
      .filter((b) => b.type === 'puffer')
      .filter((b) => b.date > today || (b.date === today && toMinutes(b.end) > nowMin))
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    if (candidates.length > 0) return { weekId, block: candidates[0] }
  }
  return null
}

export function assignTaskToBlock(taskId: string, weekId: string, blockId: string): void {
  const week = weekById(weekId)
  const block = week?.blocks.find((b) => b.id === blockId)
  if (!block) return
  updateWeek(weekId, (w) => ({
    ...w,
    blocks: w.blocks.map((b) =>
      b.id === blockId && !b.taskIds.includes(taskId) ? { ...b, taskIds: [...b.taskIds, taskId] } : b,
    ),
  }))
  updateTask(taskId, { status: 'offen', plannedBlockId: blockId, plannedDate: block.date })
}

// ---------- Tagesplan (Top-3) ----------

export function dayPlanOf(dateIso: string): DayPlan {
  return dayPlans.value.find((d) => d.id === dateIso) ?? { id: dateIso, top3: [], updatedAt: nowIso() }
}

export function saveDayPlan(dateIso: string, top3: Top3Item[], note?: string): void {
  const plan: DayPlan = { id: dateIso, top3: top3.slice(0, 3), note, updatedAt: nowIso() }
  const exists = dayPlans.value.some((d) => d.id === dateIso)
  dayPlans.value = exists ? dayPlans.value.map((d) => (d.id === dateIso ? plan : d)) : [...dayPlans.value, plan]
}

// ---------- Rückblick ----------

export function saveReview(review: Review): void {
  const exists = reviews.value.some((r) => r.id === review.id)
  reviews.value = exists ? reviews.value.map((r) => (r.id === review.id ? review : r)) : [...reviews.value, review]
}

// ---------- Backup ----------

export function buildBackup(): BackupFile {
  return {
    app: 'wochenkompass',
    schemaVersion: settings.value.schemaVersion,
    exportedAt: nowIso(),
    areas: areas.value,
    tasks: tasks.value,
    weeks: weeks.value,
    templates: templates.value,
    dayPlans: dayPlans.value,
    reviews: reviews.value,
    mappings: mappings.value,
    settings: settings.value,
  }
}

export async function restoreBackup(data: BackupFile): Promise<void> {
  const migrated = migrate(data)
  areas.value = migrated.areas
  tasks.value = migrated.tasks
  weeks.value = migrated.weeks
  templates.value = migrated.templates
  dayPlans.value = migrated.dayPlans
  reviews.value = migrated.reviews
  mappings.value = migrated.mappings
  settings.value = { ...migrated.settings, schemaVersion: CURRENT_SCHEMA_VERSION }
  await flushAll()
}
