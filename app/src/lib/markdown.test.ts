import { describe, expect, it } from 'vitest'
import { extractLinks, extractTags, renderMarkdown, snippet } from './markdown'

describe('extractLinks', () => {
  it('findet [[Verlinkungen]] ohne Duplikate', () => {
    expect(extractLinks('siehe [[Verein]] und [[Training]] und nochmal [[verein]]')).toEqual(['Verein', 'Training'])
  })
  it('leer ohne Links', () => {
    expect(extractLinks('nur Text')).toEqual([])
  })
})

describe('extractTags', () => {
  it('findet #tags, ignoriert Überschriften am Zeilenanfang', () => {
    expect(extractTags('# Titel\ntext mit #verein und #training')).toEqual(['verein', 'training'])
  })
  it('keine Duplikate, mit Umlauten', () => {
    expect(extractTags('#Idee #idee #Prüfung')).toEqual(['Idee', 'Prüfung'])
  })
})

describe('renderMarkdown', () => {
  it('rendert Wikilinks als anklickbare Links', () => {
    const html = renderMarkdown('siehe [[Andere Notiz]]')
    expect(html).toContain('class="wikilink"')
    expect(html).toContain('data-title="Andere Notiz"')
  })
  it('rendert Tags', () => {
    const html = renderMarkdown('text #wichtig')
    expect(html).toContain('class="tag"')
    expect(html).toContain('data-tag="wichtig"')
  })
  it('rendert Überschriften und Listen', () => {
    const html = renderMarkdown('# Titel\n- eins\n- zwei')
    expect(html).toContain('<h1')
    expect(html).toContain('<li>')
  })
})

describe('snippet', () => {
  it('entfernt Markup und kürzt', () => {
    expect(snippet('# Titel **fett** [[Link]]')).toBe('Titel fett Link')
  })
})
