import { route } from '../router'
import { inboxTasks } from '../state/store'

interface Tab {
  name: string
  label: string
  routes: string[]
  icon: string
}

const TABS: Tab[] = [
  {
    name: 'heute',
    label: 'Heute',
    routes: ['heute'],
    icon: 'M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z',
  },
  {
    name: 'woche',
    label: 'Woche',
    routes: ['woche'],
    icon: 'M4 5h16a1 1 0 011 1v13a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm1 5v8h14v-8zM7 3v3M17 3v3',
  },
  {
    name: 'inbox',
    label: 'Inbox',
    routes: ['inbox', 'triage'],
    icon: 'M4 5h16v10h-5l-2 3-2-3H4zm4 4h8M8 12h5',
  },
  {
    name: 'bereiche',
    label: 'Bereiche',
    routes: ['bereiche', 'bereich'],
    icon: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z',
  },
  {
    name: 'mehr',
    label: 'Mehr',
    routes: ['mehr', 'rueckblick', 'import', 'einstellungen'],
    icon: 'M5 12h.01M12 12h.01M19 12h.01',
  },
]

export function TabBar() {
  const current = route.value.name
  const inboxCount = inboxTasks.value.length
  return (
    <nav class="tabbar" aria-label="Hauptnavigation">
      {TABS.map((tab) => (
        <a key={tab.name} href={`#/${tab.name}`} class={tab.routes.includes(current) ? 'active' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
            <path d={tab.icon} />
          </svg>
          {tab.label}
          {tab.name === 'inbox' && inboxCount > 0 && <span class="tab-badge" data-testid="inbox-badge">{inboxCount}</span>}
        </a>
      ))}
    </nav>
  )
}
