import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import type { BlockDef } from '../types'
import { areas, mappings, saveTemplateBlocks, settings, standardTemplate, updateArea } from '../state/store'
import { AI_MODELS, DEFAULT_AI_MODEL } from '../lib/ai'
import { downloadBackup, importBackupFile } from '../lib/backup'
import { isStoragePersisted, requestPersistentStorage } from '../lib/db'
import { mirrorSavedAt } from '../lib/persist'
import { BottomSheet } from '../components/BottomSheet'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { BlockForm, type BlockFormValue } from '../components/BlockForm'
import { showToast } from '../components/Toast'
import { WEEKDAY_NAMES } from '../lib/dates'
import { newId } from '../lib/id'
import { AreaDot } from '../components/AreaBadge'

export function Einstellungen() {
  const persisted = useSignal<boolean | null>(null)
  useEffect(() => {
    void isStoragePersisted().then((p) => (persisted.value = p))
  }, [])
  const editingDef = useSignal<BlockDef | null>(null)
  const creatingDef = useSignal(false)
  const pendingImport = useSignal<File | null>(null)

  const tpl = standardTemplate()
  const byWeekday = (wd: number) => tpl.blocks.filter((b) => b.weekday === wd).sort((a, b) => a.start.localeCompare(b.start))

  const saveDef = (v: BlockFormValue, existingId?: string) => {
    const def: BlockDef = {
      id: existingId ?? newId(),
      weekday: v.weekday,
      start: v.start,
      end: v.end,
      title: v.title.trim(),
      type: v.type,
      areaId: v.areaId,
    }
    const rest = tpl.blocks.filter((b) => b.id !== existingId)
    saveTemplateBlocks([...rest, def])
    editingDef.value = null
    creatingDef.value = false
  }

  const onImportPicked = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (file) pendingImport.value = file
  }

  const archived = areas.value.filter((a) => a.archived)

  return (
    <div class="view">
      <h1 class="view-title">Einstellungen</h1>

      <div class="card">
        <div class="card-title">
          <span>🔒 Datensicherheit</span>
        </div>
        <p class="muted" style={{ marginBottom: 10 }}>
          Zeitzauber sichert deine Daten auf drei Ebenen, damit nichts verloren geht.
        </p>
        <div class="list-item">
          <span style={{ flex: 1 }}>
            Dauerhafte Speicherung
            <div class="muted">Schützt davor, dass der Browser die Daten automatisch aufräumt.</div>
          </span>
          {persisted.value === true ? (
            <span style={{ color: 'var(--success)', fontWeight: 700 }} data-testid="persist-status">
              ✓ aktiv
            </span>
          ) : (
            <button
              class="btn small"
              data-testid="persist-enable"
              onClick={async () => {
                const ok = await requestPersistentStorage()
                persisted.value = ok || (await isStoragePersisted())
                showToast(
                  persisted.value
                    ? 'Dauerhafte Speicherung ist aktiv.'
                    : 'Der Browser hat die Anfrage (noch) nicht gewährt — oft hilft „Zum Home-Bildschirm".',
                )
              }}
            >
              Aktivieren
            </button>
          )}
        </div>
        <div class="list-item">
          <span style={{ flex: 1 }}>
            Automatische Gerätesicherung
            <div class="muted">Laufende Zweit-Kopie auf dem Gerät; wird bei Bedarf automatisch wiederhergestellt.</div>
          </span>
          <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ an</span>
        </div>
        {mirrorSavedAt() && (
          <p class="muted" style={{ marginTop: 6 }}>
            Letzte automatische Sicherung: {new Date(mirrorSavedAt()!).toLocaleString('de-DE')}
          </p>
        )}
        <p class="muted" style={{ marginTop: 10 }}>
          Wichtig fürs Übertragen auf ein anderes Gerät und als Schutz, falls du den Browser-Speicher löschst,
          bleibt das Backup unten. 👇
        </p>
      </div>

      <div class="card">
        <div class="card-title">
          <span>💾 Backup</span>
        </div>
        <p class="muted" style={{ marginBottom: 10 }}>
          Deine Daten liegen nur auf diesem Gerät. Exportiere regelmäßig eine Backup-Datei — sie ist auch der Weg,
          um Daten auf ein anderes Gerät zu übertragen.
        </p>
        <div class="btn-row">
          <button
            class="btn primary"
            onClick={() => {
              downloadBackup()
              showToast('Backup-Datei wird heruntergeladen.')
            }}
            data-testid="backup-export"
          >
            Backup exportieren
          </button>
          <label class="btn" style={{ cursor: 'pointer' }}>
            Backup importieren
            <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onImportPicked} data-testid="backup-import-input" />
          </label>
        </div>
        {settings.value.lastBackupAt && (
          <p class="muted" style={{ marginTop: 8 }}>
            Letztes Backup: {new Date(settings.value.lastBackupAt).toLocaleString('de-DE')}
          </p>
        )}
      </div>

      <div class="card">
        <div class="card-title">
          <span>🪄 KIannik (KI-Helfer)</span>
        </div>
        <p class="muted" style={{ marginBottom: 10 }}>
          KIannik sortiert deine Inbox jederzeit kostenlos & offline. Für echtes Brainstorming und noch bessere
          Sortierung kannst du optional deinen eigenen Claude-API-Schlüssel hinterlegen. Er bleibt{' '}
          <strong>nur auf diesem Gerät</strong> und geht ausschließlich direkt an Anthropic.
        </p>
        <label class="field">
          <span>Claude-API-Schlüssel (optional)</span>
          <input
            type="password"
            autocomplete="off"
            placeholder="sk-ant-…"
            value={settings.value.claudeApiKey ?? ''}
            onInput={(e) =>
              (settings.value = { ...settings.value, claudeApiKey: (e.target as HTMLInputElement).value.trim() || undefined })
            }
            data-testid="ai-key"
          />
        </label>
        <label class="field">
          <span>Modell</span>
          <select
            value={settings.value.aiModel ?? DEFAULT_AI_MODEL}
            onChange={(e) => (settings.value = { ...settings.value, aiModel: (e.target as HTMLSelectElement).value })}
            data-testid="ai-model"
          >
            {AI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <p class="muted" style={{ fontSize: '0.8rem' }}>
          Schlüssel gibt es unter console.anthropic.com. Ohne Schlüssel funktioniert die Sortier-Magie trotzdem.
        </p>
      </div>

      <div class="card">
        <div class="card-title">
          <span>🕐 Planbarer Tag</span>
        </div>
        <p class="muted" style={{ marginBottom: 10 }}>
          In diesem Fenster berechnet die App deine freien Zeitfenster.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <label class="field" style={{ flex: 1 }}>
            <span>Von</span>
            <input
              type="time"
              value={settings.value.wakeStart}
              onInput={(e) => (settings.value = { ...settings.value, wakeStart: (e.target as HTMLInputElement).value })}
            />
          </label>
          <label class="field" style={{ flex: 1 }}>
            <span>Bis</span>
            <input
              type="time"
              value={settings.value.wakeEnd}
              onInput={(e) => (settings.value = { ...settings.value, wakeEnd: (e.target as HTMLInputElement).value })}
            />
          </label>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>📅 Standardwoche</span>
          <button class="btn small" onClick={() => (creatingDef.value = true)} data-testid="template-add">
            + Block
          </button>
        </div>
        <p class="muted" style={{ marginBottom: 10 }}>
          Diese Blöcke werden mit „Vorlage anwenden" in eine Woche übernommen.
        </p>
        {WEEKDAY_NAMES.map((name, wd) => {
          const defs = byWeekday(wd)
          if (defs.length === 0) return null
          return (
            <div key={wd} style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: '0.85rem' }}>{name}</strong>
              {defs.map((d) => (
                <button
                  key={d.id}
                  class="list-item"
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => (editingDef.value = d)}
                >
                  <AreaDot areaId={d.areaId} />
                  <span style={{ flex: 1 }}>
                    {d.start}–{d.end} · {d.title}
                  </span>
                  <span class="muted">✎</span>
                </button>
              ))}
            </div>
          )
        })}
        {tpl.blocks.length === 0 && <p class="muted">Noch keine Blöcke in der Vorlage.</p>}
      </div>

      {archived.length > 0 && (
        <div class="card">
          <div class="card-title">
            <span>🗂️ Archivierte Bereiche</span>
          </div>
          {archived.map((a) => (
            <div class="list-item" key={a.id}>
              <span class="area-dot" style={{ background: a.color }} />
              <span style={{ flex: 1 }}>{a.name}</span>
              <button class="btn small" onClick={() => updateArea(a.id, { archived: false })}>
                Wiederherstellen
              </button>
            </div>
          ))}
        </div>
      )}

      {mappings.value.length > 0 && (
        <div class="card">
          <div class="card-title">
            <span>📄 Gespeicherte Import-Formate</span>
          </div>
          {mappings.value.map((m) => (
            <div class="list-item" key={m.id}>
              <span style={{ flex: 1 }}>{m.name}</span>
              <button
                class="btn small"
                onClick={() => (mappings.value = mappings.value.filter((x) => x.id !== m.id))}
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}

      <p class="muted" style={{ textAlign: 'center' }}>
        Zeitzauber · Version {import.meta.env.VITE_APP_VERSION ?? '0.1.0'} · Alle Daten bleiben auf deinem Gerät.
      </p>

      {(creatingDef.value || editingDef.value) && (
        <BottomSheet
          onClose={() => {
            creatingDef.value = false
            editingDef.value = null
          }}
          label="Vorlagen-Block"
        >
          <h3>{editingDef.value ? 'Vorlagen-Block bearbeiten' : 'Neuer Vorlagen-Block'}</h3>
          <BlockForm
            initial={
              editingDef.value
                ? {
                    title: editingDef.value.title,
                    type: editingDef.value.type,
                    areaId: editingDef.value.areaId,
                    weekday: editingDef.value.weekday,
                    start: editingDef.value.start,
                    end: editingDef.value.end,
                  }
                : { title: '', type: 'fokus', weekday: 0, start: '09:00', end: '10:00' }
            }
            submitLabel={editingDef.value ? 'Speichern' : 'Anlegen'}
            onSubmit={(v) => saveDef(v, editingDef.value?.id)}
            onCancel={() => {
              creatingDef.value = false
              editingDef.value = null
            }}
            onDelete={
              editingDef.value
                ? () => {
                    saveTemplateBlocks(tpl.blocks.filter((b) => b.id !== editingDef.value!.id))
                    editingDef.value = null
                  }
                : undefined
            }
          />
        </BottomSheet>
      )}

      {pendingImport.value && (
        <ConfirmDialog
          title="Backup importieren?"
          text="Der Import ersetzt ALLE aktuellen Daten auf diesem Gerät durch den Inhalt der Backup-Datei."
          confirmLabel="Importieren"
          danger
          onConfirm={() => {
            const file = pendingImport.value!
            pendingImport.value = null
            importBackupFile(file)
              .then(() => showToast('Backup importiert.'))
              .catch((err: Error) => showToast(err.message, { sticky: true, actionLabel: 'OK' }))
          }}
          onCancel={() => (pendingImport.value = null)}
        />
      )}
    </div>
  )
}
