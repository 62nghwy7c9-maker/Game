import { describe, expect, it } from 'vitest'
import { toCsv, toTsv } from './exportCsv'

describe('toCsv', () => {
  it('beginnt mit BOM und nutzt Semikolon', () => {
    const csv = toCsv([
      ['Platz', 'Name'],
      ['1', 'Anna Müller'],
    ])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.slice(1)).toBe('Platz;Name\r\n1;Anna Müller')
  })
  it('escapet Semikolon, Anführungszeichen und Zeilenumbrüche', () => {
    const csv = toCsv([['a;b', 'sagt "hi"', 'x\ny']])
    expect(csv.slice(1)).toBe('"a;b";"sagt ""hi""";"x\ny"')
  })
})

describe('toTsv', () => {
  it('Tab-getrennt, Tabs in Zellen ersetzt', () => {
    expect(toTsv([['a\tb', 'c'], ['d', 'e']])).toBe('a b\tc\nd\te')
  })
})
