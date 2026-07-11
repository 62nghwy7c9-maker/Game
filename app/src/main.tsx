import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import { App } from './app'
import { loadAll } from './state/store'
import { showToast } from './components/Toast'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/base.css'
import './styles/week.css'
import './styles/notes.css'

void loadAll()

render(<App />, document.getElementById('app')!)

// Neue Versionen sofort und automatisch übernehmen — kein Hängenbleiben auf
// altem Zwischenspeicher. Kurzer Hinweis, dann Neuladen.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    showToast('Aktualisiere auf neue Version …')
    setTimeout(() => void updateSW(true), 800)
  },
})
