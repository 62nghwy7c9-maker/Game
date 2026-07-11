import { useEffect } from 'preact/hooks'
import { deleteTask, inboxTasks } from '../state/store'
import { navigate, route } from '../router'
import { openCapture } from '../components/CaptureSheet'
import { AreaDot } from '../components/AreaBadge'

export function InboxView() {
  const items = inboxTasks.value

  // PWA-Shortcut „Schnell erfassen" (#/inbox?capture=1)
  useEffect(() => {
    if (route.value.query.get('capture') === '1') {
      openCapture()
      navigate('/inbox')
    }
  }, [])

  return (
    <div class="view">
      <h1 class="view-title">Inbox</h1>
      <p class="view-subtitle">
        Alles, was dir zwischendurch einfällt — erst sammeln, dann in Ruhe einsortieren.
      </p>

      {items.length === 0 ? (
        <div class="empty-state">
          <div class="big">✨</div>
          <p>Inbox leer — alles einsortiert.</p>
          <p class="muted">Mit dem +-Knopf erfasst du jederzeit neue Gedanken.</p>
        </div>
      ) : (
        <>
          <button class="btn primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => navigate('/triage')} data-testid="start-triage">
            Triage starten ({items.length})
          </button>
          <div class="card">
            {items.map((t) => (
              <div class="list-item" key={t.id}>
                <div style={{ flex: 1 }}>
                  <div>{t.title}</div>
                  <div class="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AreaDot areaId={t.areaId} />
                  </div>
                </div>
                <button class="btn small" onClick={() => deleteTask(t.id)} aria-label="Löschen">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
