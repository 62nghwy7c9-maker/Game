import { useSignal } from '@preact/signals'
import type { MappingTargetField } from '../types'
import { mappings } from '../state/store'
import type { ParsedTable } from '../pdf/parsers/types'
import { parseWithBestParser } from '../pdf/parsers/registry'
import { extractPdf } from '../pdf/extract'
import { downloadCsv, toTsv } from '../pdf/exportCsv'
import { TARGET_FIELDS, applyMapping, findSavedMapping, fingerprintOf } from '../pdf/mapping'
import { showToast } from '../components/Toast'
import { newId, nowIso } from '../lib/id'
import { todayIso } from '../lib/dates'

type ColMap = MappingTargetField[]

export function ImportView() {
  const busy = useSignal(false)
  const error = useSignal<string | null>(null)
  const fileName = useSignal('')
  const table = useSignal<ParsedTable | null>(null)
  const parserName = useSignal('')
  const headerRow = useSignal(0)
  const colMap = useSignal<ColMap>([])
  const filter = useSignal('')
  const hideEmpty = useSignal(true)
  const mappingName = useSignal('')
  const savingMapping = useSignal(false)

  const reset = () => {
    table.value = null
    error.value = null
    headerRow.value = 0
    colMap.value = []
    filter.value = ''
    mappingName.value = ''
  }

  const onFile = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    reset()
    fileName.value = file.name
    busy.value = true
    try {
      const doc = await extractPdf(await file.arrayBuffer())
      if (!doc.hasText) {
        error.value =
          'Dieses PDF enthält nur ein Bild (Scan ohne Textebene) — Texterkennung (OCR) wird noch nicht unterstützt.'
        return
      }
      if (doc.rows.length === 0) {
        error.value = 'Im PDF wurde keine Tabelle gefunden.'
        return
      }
      const { parser, table: parsed } = parseWithBestParser(doc)
      table.value = parsed
      parserName.value = parser.name
      colMap.value = new Array(parsed.columns.length).fill('ignorieren')

      // gespeichertes Format wiedererkennen (Header in den ersten 5 Zeilen suchen)
      for (let i = 0; i < Math.min(5, parsed.rows.length); i++) {
        const saved = findSavedMapping(mappings.value, parsed.rows[i])
        if (saved) {
          headerRow.value = saved.headerRowIndex
          const cm = new Array<MappingTargetField>(parsed.columns.length).fill('ignorieren')
          for (const c of saved.columns) if (c.sourceIndex < cm.length) cm[c.sourceIndex] = c.targetField
          colMap.value = cm
          showToast(`Format „${saved.name}" erkannt und angewendet.`)
          break
        }
      }
    } catch (err) {
      error.value = `PDF konnte nicht gelesen werden: ${err instanceof Error ? err.message : String(err)}`
    } finally {
      busy.value = false
    }
  }

  const mapped = () => {
    const t = table.value!
    const anyMapped = colMap.value.some((f) => f !== 'ignorieren')
    if (!anyMapped) {
      return { header: t.columns, rows: t.rows.slice(headerRow.value + 1) }
    }
    return applyMapping(
      t.rows,
      headerRow.value,
      colMap.value.map((f, i) => ({ sourceIndex: i, targetField: f })),
    )
  }

  const filteredRows = () => {
    const { header, rows } = mapped()
    let out = rows
    if (hideEmpty.value) out = out.filter((r) => r.some((c) => c.trim() !== ''))
    const q = filter.value.trim().toLowerCase()
    if (q) out = out.filter((r) => r.some((c) => c.toLowerCase().includes(q)))
    return { header, rows: out }
  }

  const exportCsv = () => {
    const { header, rows } = filteredRows()
    downloadCsv([header, ...rows], `protokoll-${todayIso()}.csv`)
    showToast('CSV wird heruntergeladen — öffnet direkt in Excel.')
  }

  const copyTsv = async () => {
    const { header, rows } = filteredRows()
    try {
      await navigator.clipboard.writeText(toTsv([header, ...rows]))
      showToast('In die Zwischenablage kopiert — in Excel/Sheets einfügen.')
    } catch {
      showToast('Kopieren nicht möglich — bitte CSV-Export nutzen.')
    }
  }

  const saveMapping = () => {
    const t = table.value!
    const headerCells = t.rows[headerRow.value] ?? []
    mappings.value = [
      ...mappings.value,
      {
        id: newId(),
        name: mappingName.value.trim(),
        fingerprint: fingerprintOf(headerCells),
        headerRowIndex: headerRow.value,
        columns: colMap.value
          .map((f, i) => ({ sourceIndex: i, targetField: f }))
          .filter((c) => c.targetField !== 'ignorieren'),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ]
    savingMapping.value = false
    mappingName.value = ''
    showToast('Format gespeichert — wird beim nächsten Import automatisch erkannt.')
  }

  const t = table.value

  return (
    <div class="view">
      <h1 class="view-title">Protokoll-Import</h1>
      <p class="view-subtitle">
        Wettkampfprotokoll (PDF) einlesen, Spalten zuordnen, als Excel-Tabelle exportieren — statt abtippen.
      </p>

      <div class="card">
        <label class="btn primary" style={{ cursor: 'pointer' }}>
          {busy.value ? 'Lese PDF …' : 'PDF auswählen'}
          <input type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={onFile} disabled={busy.value} data-testid="pdf-input" />
        </label>
        {fileName.value && <span class="muted" style={{ marginLeft: 10 }}>{fileName.value}</span>}
        {error.value && (
          <p style={{ color: 'var(--danger)', marginTop: 10 }} data-testid="import-error">
            {error.value}
          </p>
        )}
        {t && (
          <p class="muted" style={{ marginTop: 8 }}>
            Erkannt mit: {parserName.value} · {t.rows.length} Zeilen, {t.columns.length} Spalten
            {t.warnings.map((w) => (
              <span key={w} style={{ display: 'block', color: 'var(--warning)' }}>
                ⚠ {w}
              </span>
            ))}
          </p>
        )}
      </div>

      {t && (
        <>
          <div class="card">
            <div class="card-title">
              <span>1 · Kopfzeile antippen</span>
            </div>
            <p class="muted" style={{ marginBottom: 8 }}>
              Welche Zeile enthält die Spaltenüberschriften? (Aktuell: Zeile {headerRow.value + 1})
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table class="import-table">
                <tbody>
                  {t.rows.slice(0, 8).map((r, i) => (
                    <tr
                      key={i}
                      class={i === headerRow.value ? 'is-header' : ''}
                      onClick={() => (headerRow.value = i)}
                      data-testid={`header-row-${i}`}
                    >
                      <td class="muted">{i + 1}</td>
                      {r.map((c, j) => (
                        <td key={j}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-title">
              <span>2 · Spalten zuordnen</span>
            </div>
            {t.columns.map((_, i) => (
              <div class="list-item" key={i}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong>Spalte {i + 1}:</strong>{' '}
                  <span class="muted">{t.rows[headerRow.value]?.[i] || '(leer)'}</span>
                </span>
                <select
                  style={{ width: 'auto' }}
                  value={colMap.value[i]}
                  onChange={(e) => {
                    const cm = [...colMap.value]
                    cm[i] = (e.target as HTMLSelectElement).value as MappingTargetField
                    colMap.value = cm
                  }}
                  data-testid={`colmap-${i}`}
                >
                  {TARGET_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <p class="muted" style={{ marginTop: 6 }}>
              Ohne Zuordnung wird die Tabelle unverändert exportiert.
            </p>
          </div>

          <div class="card">
            <div class="card-title">
              <span>3 · Filtern &amp; exportieren</span>
            </div>
            <label class="field">
              <span>Nur Zeilen mit … (z. B. dein Vereinsname)</span>
              <input
                type="search"
                value={filter.value}
                onInput={(e) => (filter.value = (e.target as HTMLInputElement).value)}
                data-testid="import-filter"
              />
            </label>
            <label class="field">
              <input type="checkbox" checked={hideEmpty.value} onChange={(e) => (hideEmpty.value = (e.target as HTMLInputElement).checked)} />{' '}
              Leere Zeilen ausblenden
            </label>

            <p class="muted" style={{ margin: '8px 0' }}>
              Vorschau ({filteredRows().rows.length} Zeilen):
            </p>
            <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
              <table class="import-table" data-testid="preview-table">
                <thead>
                  <tr>
                    {filteredRows().header.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows().rows.slice(0, 100).map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td key={j}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="btn-row">
              <button class="btn primary" onClick={exportCsv} data-testid="export-csv">
                CSV herunterladen
              </button>
              <button class="btn" onClick={copyTsv}>
                In Zwischenablage kopieren
              </button>
              <button class="btn" onClick={() => (savingMapping.value = true)} data-testid="save-format">
                Format speichern …
              </button>
            </div>
            {savingMapping.value && (
              <div style={{ marginTop: 10 }}>
                <label class="field">
                  <span>Name des Formats (z. B. „Schwimmen Bezirk")</span>
                  <input
                    type="text"
                    value={mappingName.value}
                    onInput={(e) => (mappingName.value = (e.target as HTMLInputElement).value)}
                    data-testid="format-name"
                  />
                </label>
                <div class="btn-row">
                  <button class="btn primary small" disabled={!mappingName.value.trim()} onClick={saveMapping} data-testid="format-save">
                    Speichern
                  </button>
                  <button class="btn small" onClick={() => (savingMapping.value = false)}>
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
