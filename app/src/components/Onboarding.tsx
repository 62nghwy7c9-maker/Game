import { signal } from '@preact/signals'
import potterImg from '../assets/yannik-potter.png'
import { introVisible } from './IntroSplash'

/**
 * Einmaliges Willkommen beim allerersten Start: Yannik Potter stellt sich vor
 * und erklärt kurz, was die App kann und wie der KI-Helfer KIannik funktioniert.
 * Erscheint nur einmal pro Gerät (localStorage-Flag).
 */

function onboarded(): boolean {
  try {
    return localStorage.getItem('zz-onboarded') === '1'
  } catch {
    return false
  }
}

function markOnboarded(): void {
  try {
    localStorage.setItem('zz-onboarded', '1')
  } catch {
    /* ignorieren */
  }
}

export const onboardingVisible = signal(!onboarded())

const step = signal(0)

interface Slide {
  title: string
  body: preact.ComponentChildren
}

const SLIDES: Slide[] = [
  {
    title: 'Hallo, ich bin Yannik Potter 🧙',
    body: (
      <>
        Willkommen bei <strong>Zeitzauber</strong> — deiner App gegen das ewige Hin und Her im Kopf. Ich führe dich
        durch die Zaubersprüche. ✨
      </>
    ),
  },
  {
    title: 'Erst sammeln, dann sortieren',
    body: (
      <>
        Alles, was dir einfällt, wirfst du mit dem <strong>+</strong> in die Inbox. Später ordnest du es in Ruhe
        deinen Lebensbereichen und Zeitblöcken zu — kein Gedanke geht verloren.
      </>
    ),
  },
  {
    title: 'Mein Gehilfe: KIannik 🪄',
    body: (
      <>
        Tipp unten links auf mein Gesicht → <strong>KIannik</strong> sortiert deine Inbox automatisch nach Bereichen —
        kostenlos und ohne Internet. Mit eigenem Schlüssel hilft er sogar beim Brainstormen.
      </>
    ),
  },
]

export function Onboarding() {
  // Erst nach der Intro-Animation zeigen
  if (introVisible.value || !onboardingVisible.value) return null

  const s = SLIDES[step.value]
  const last = step.value === SLIDES.length - 1

  const finish = () => {
    markOnboarded()
    onboardingVisible.value = false
  }

  const next = () => {
    if (last) finish()
    else step.value = step.value + 1
  }

  return (
    <div class="onb-backdrop" role="dialog" aria-modal="true" aria-label="Willkommen bei Zeitzauber" data-testid="onboarding">
      <div class="onb-card">
        <img src={potterImg} alt="Yannik Potter" class="onb-img" />
        <h2 class="onb-title">{s.title}</h2>
        <p class="onb-body">{s.body}</p>
        <div class="onb-dots">
          {SLIDES.map((_, i) => (
            <span key={i} class={`onb-dot${i === step.value ? ' active' : ''}`} />
          ))}
        </div>
        <button class="btn primary" style={{ width: '100%' }} onClick={next} data-testid="onboarding-next">
          {last ? 'Los geht’s! 🪄' : 'Weiter'}
        </button>
        {!last && (
          <button class="onb-skip" onClick={finish} data-testid="onboarding-skip">
            Überspringen
          </button>
        )}
      </div>
    </div>
  )
}
