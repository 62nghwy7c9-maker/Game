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

void loadAll()

render(<App />, document.getElementById('app')!)

const updateSW = registerSW({
  onNeedRefresh() {
    showToast('Neue Version verfügbar.', {
      sticky: true,
      actionLabel: 'Neu laden',
      onAction: () => void updateSW(true),
    })
  },
})
