import { describe, expect, it } from 'vitest'
import { proposeInboxSorting, suggestAreaForText } from './aiSort'
import type { Area, Task } from '../types'

function area(name: string, id = name.toLowerCase(), archived = false): Area {
  return { id, name, color: '#000', order: 0, archived, createdAt: '', updatedAt: '' }
}

function task(title: string, over: Partial<Task> = {}): Task {
  return { id: title, title, status: 'inbox', createdAt: '', updatedAt: '', ...over }
}

const AREAS = [area('Beruf'), area('Verein'), area('Training'), area('Haushalt'), area('Privat')]

describe('suggestAreaForText', () => {
  it('ordnet Arbeits-Stichwörter dem Beruf zu', () => {
    const s = suggestAreaForText('Präsentation für das Kunden-Meeting vorbereiten', AREAS)
    expect(s?.areaName).toBe('Beruf')
  })

  it('erkennt Sport als Training', () => {
    const s = suggestAreaForText('Lauftraining Ausdauer', AREAS)
    expect(s?.areaName).toBe('Training')
  })

  it('erkennt Vereins-Begriffe', () => {
    const s = suggestAreaForText('Wettkampf-Protokoll für den Verein abtippen', AREAS)
    expect(s?.areaName).toBe('Verein')
  })

  it('nutzt den Bereichsnamen selbst als Treffer', () => {
    const s = suggestAreaForText('Etwas für den Haushalt', AREAS)
    expect(s?.areaName).toBe('Haushalt')
  })

  it('gibt null zurück, wenn nichts passt', () => {
    expect(suggestAreaForText('xyzzy blubb', AREAS)).toBeNull()
  })

  it('ignoriert archivierte Bereiche nicht selbst (Filter passiert im Aufrufer)', () => {
    const only = [area('Beruf')]
    expect(suggestAreaForText('Meeting', only)?.areaName).toBe('Beruf')
  })
})

describe('proposeInboxSorting', () => {
  it('schlägt nur für untriagierte Inbox-Einträge ohne Bereich vor', () => {
    const tasks = [
      task('Kunden-Meeting vorbereiten'),
      task('Schon einsortiert', { areaId: 'training' }),
      task('Erledigte Sache', { status: 'erledigt' }),
      task('Lauftraining'),
    ]
    const props = proposeInboxSorting(tasks, AREAS)
    const ids = props.map((p) => p.taskId)
    expect(ids).toContain('Kunden-Meeting vorbereiten')
    expect(ids).toContain('Lauftraining')
    expect(ids).not.toContain('Schon einsortiert')
    expect(ids).not.toContain('Erledigte Sache')
  })

  it('überspringt archivierte Bereiche', () => {
    const areas = [area('Training', 'training', true), area('Beruf')]
    const props = proposeInboxSorting([task('Lauftraining Ausdauer')], areas)
    expect(props.every((p) => p.areaId !== 'training')).toBe(true)
  })
})
