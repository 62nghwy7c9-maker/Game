import { navigate } from '../router'

const ENTRIES = [
  { route: '/rueckblick', icon: '🔄', title: 'Wochenrückblick', text: 'Das wöchentliche Ritual: zurückschauen, aufräumen, nächste Woche planen.' },
  { route: '/import', icon: '📄', title: 'Protokoll-Import', text: 'Wettkampfprotokoll (PDF) einlesen und als Tabelle exportieren.' },
  { route: '/einstellungen', icon: '⚙️', title: 'Einstellungen', text: 'Standardwoche, Wachzeiten, Backup, Bereiche.' },
]

export function Mehr() {
  return (
    <div class="view">
      <h1 class="view-title">Mehr</h1>
      <p class="view-subtitle">Rituale und Werkzeuge.</p>
      {ENTRIES.map((e) => (
        <button
          key={e.route}
          class="card"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
          onClick={() => navigate(e.route)}
        >
          <div class="card-title" style={{ marginBottom: 2 }}>
            <span>
              {e.icon} {e.title}
            </span>
          </div>
          <div class="muted">{e.text}</div>
        </button>
      ))}
    </div>
  )
}
