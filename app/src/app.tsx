import { route } from './router'
import { ready } from './state/store'
import { TabBar } from './components/TabBar'
import { CaptureFab } from './components/CaptureFab'
import { CaptureSheet } from './components/CaptureSheet'
import { ToastHost } from './components/Toast'
import { IntroSplash } from './components/IntroSplash'
import { Mascot } from './components/Mascot'
import { YannikAssistant } from './components/YannikAssistant'
import { Onboarding } from './components/Onboarding'
import { Heute } from './views/Heute'
import { Woche } from './views/Woche'
import { InboxView } from './views/InboxView'
import { TriageView } from './views/TriageView'
import { Bereiche } from './views/Bereiche'
import { BereichDetail } from './views/BereichDetail'
import { Rueckblick } from './views/Rueckblick'
import { ImportView } from './views/ImportView'
import { Einstellungen } from './views/Einstellungen'
import { Mehr } from './views/Mehr'
import { NotizenView } from './views/NotizenView'
import { NotizDetail } from './views/NotizDetail'
import { GraphView } from './views/GraphView'

function CurrentView() {
  switch (route.value.name) {
    case 'woche':
      return <Woche />
    case 'inbox':
      return <InboxView />
    case 'triage':
      return <TriageView />
    case 'bereiche':
      return <Bereiche />
    case 'bereich':
      return <BereichDetail />
    case 'rueckblick':
      return <Rueckblick />
    case 'import':
      return <ImportView />
    case 'notizen':
      return <NotizenView />
    case 'notiz':
      return <NotizDetail />
    case 'graph':
      return <GraphView />
    case 'einstellungen':
      return <Einstellungen />
    case 'mehr':
      return <Mehr />
    default:
      return <Heute />
  }
}

export function App() {
  if (!ready.value) {
    return (
      <div class="app-shell">
        <div class="empty-state" style={{ marginTop: '30vh' }}>
          Lade …
        </div>
      </div>
    )
  }
  return (
    <>
      <div class="app-shell">
        <CurrentView />
      </div>
      <TabBar />
      <CaptureFab />
      <CaptureSheet />
      <ToastHost />
      <Mascot />
      <YannikAssistant />
      <IntroSplash />
      <Onboarding />
    </>
  )
}
