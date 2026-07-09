export interface Area {
  id: string
  name: string
  color: string
  order: number
  archived: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'inbox' | 'offen' | 'erledigt' | 'verworfen'

export interface Task {
  id: string
  title: string
  notes?: string
  areaId?: string
  status: TaskStatus
  /** ISO-Datum (JJJJ-MM-TT), wenn für einen Tag eingeplant */
  plannedDate?: string
  /** Block-ID, wenn einem Zeitblock zugewiesen */
  plannedBlockId?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type BlockType = 'fokus' | 'puffer' | 'training' | 'admin' | 'termin' | 'sonstiges'

export interface BlockDef {
  id: string
  /** 0 = Montag … 6 = Sonntag */
  weekday: number
  /** 'HH:MM' */
  start: string
  /** 'HH:MM' */
  end: string
  title: string
  type: BlockType
  areaId?: string
}

export interface Block extends BlockDef {
  /** ISO-Datum des konkreten Tages */
  date: string
  taskIds: string[]
  done?: boolean
}

export interface WeekTemplate {
  id: string
  name: string
  blocks: BlockDef[]
  updatedAt: string
}

export interface Week {
  /** ISO-Woche, z. B. '2026-W28' */
  id: string
  blocks: Block[]
  appliedTemplateAt?: string
  createdAt: string
  updatedAt: string
}

export interface Top3Item {
  taskId?: string
  text: string
  done: boolean
}

export interface DayPlan {
  /** ISO-Datum */
  id: string
  top3: Top3Item[]
  note?: string
  updatedAt: string
}

export interface ReviewStats {
  erledigteTasks: number
  top3Gesamt: number
  top3Erledigt: number
  inboxVorher: number
  inboxNachher: number
}

export interface Review {
  /** Week-ID */
  id: string
  gutGelaufen: string
  planGesprengt: string
  erkenntnis: string
  stats: ReviewStats
  completedAt: string
}

export type MappingTargetField =
  | 'platz'
  | 'name'
  | 'verein'
  | 'jahrgang'
  | 'ergebnis'
  | 'disziplin'
  | 'ak'
  | 'frei1'
  | 'frei2'
  | 'ignorieren'

export interface SavedMapping {
  id: string
  name: string
  /** Erkennung: Spaltenzahl + normalisierte Headerzellen */
  fingerprint: string
  headerRowIndex: number
  columns: { sourceIndex: number; targetField: MappingTargetField }[]
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  title: string
  /** Markdown-Text mit [[Verlinkungen]] und #Tags */
  body: string
  createdAt: string
  updatedAt: string
}

export interface Settings {
  schemaVersion: number
  /** 'HH:MM' — Beginn des planbaren Tages */
  wakeStart: string
  /** 'HH:MM' — Ende des planbaren Tages */
  wakeEnd: string
  onboardingDone: boolean
  lastBackupAt?: string
}

export interface BackupFile {
  app: 'wochenkompass'
  schemaVersion: number
  exportedAt: string
  areas: Area[]
  tasks: Task[]
  weeks: Week[]
  templates: WeekTemplate[]
  dayPlans: DayPlan[]
  reviews: Review[]
  mappings: SavedMapping[]
  notes: Note[]
  settings: Settings
}
