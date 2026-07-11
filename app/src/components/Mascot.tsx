import { signal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { route } from '../router'
import mascotImg from '../assets/mascot.png'
import faceImg from '../assets/yannik-face.png'
import { openAssistant } from './YannikAssistant'

/** Lustiges Zauberer-Guide-Maskottchen mit kontextabhängigen Tipps. */

const WELCOME =
  'Willkommen bei Zeitzauber! Alohomora 🪄 — ich bin Yannik Potter, dein Hauszauberer, und zeig dir die App. Tipp mich an, wenn du einen Rat brauchst.'

const TIPS: Record<string, string[]> = {
  heute: [
    'Setz deine 3 wichtigsten Zaubersprüche für heute — äh, die Top-3. Der Rest ist nur Pingpong. 🪄',
    'Das Netz oben pulsiert stärker, je voller deine Inbox ist. Ein bisschen wie mein Kessel …',
  ],
  woche: [
    'Tipp auf eine freie Fläche und *schwupps* — ein neuer Zeitblock erscheint. Ganz ohne Zauberstab.',
    '„Vorlage anwenden" beschwört deine Standardwoche. Puffer-Blöcke sind dein Schutzschild gegen Chaos.',
  ],
  inbox: [
    'Alles, was dir durch den Kopf schwirrt, fangen wir hier wie einen Schnatz. Danach: Triage!',
    'Bei der Triage gibt es vier Wege — wähl weise, junger Zauberer.',
  ],
  triage: ['Ein Eintrag nach dem anderen. Vier Knöpfe, fertig. Kinderleicht wie „Wingardium Leviosa".'],
  notizen: [
    'Verbinde Notizen mit [[Titel]] — wie Zaubersprüche, die sich gegenseitig rufen.',
    'Der Graph zeigt dein Wissensnetz. Sieht fast so gut aus wie die Große Halle. ✨',
    'Mit #tags findest du alles wieder — schneller als ein Beschwörungsregister.',
  ],
  notiz: ['Oben umschalten: „Schreiben" fürs Zaubern, „Lesen" fürs Bewundern. [[Links]] öffnen andere Notizen.'],
  graph: ['Knoten antippen öffnet die Notiz. Ziehen verschiebt, Mausrad zoomt. Magisch, oder?'],
  bereiche: ['Jeder Lebensbereich sein eigenes Haus — ganz ohne Sprechenden Hut.'],
  bereich: ['Aufgaben, Blöcke und Notizen dieses Bereichs an einem Ort. Ordnung ist der halbe Zauber.'],
  rueckblick: ['Das wöchentliche Ritual: zurückblicken, Inbox leeren, nächste Woche beschwören. 🔮'],
  import: ['Wettkampf-PDF rein, Spalten zuordnen, CSV raus. Spart dir Stunden Abschreib-Fluch.'],
  einstellungen: ['Hier stellst du deine Standardwoche und Backups ein. Vergiss den Backup-Zauber nicht!'],
  mehr: ['Rückblick, Notizen, Import — alle Werkzeuge in meiner Zauberkiste.'],
}

const collapsed = signal(true)
const tipIdx = signal(0)
const greeting = signal(false)

function welcomed(): boolean {
  try {
    return localStorage.getItem('wk-mascot-welcomed') === '1'
  } catch {
    return false
  }
}

export function Mascot() {
  useEffect(() => {
    if (!welcomed()) {
      collapsed.value = false
      greeting.value = true
      try {
        localStorage.setItem('wk-mascot-welcomed', '1')
      } catch {
        /* ignorieren */
      }
    }
  }, [])

  const name = route.value.name
  const isWelcome = greeting.value
  const tips = TIPS[name] ?? TIPS.mehr
  const text = isWelcome ? WELCOME : tips[tipIdx.value % tips.length]

  const summon = () => {
    collapsed.value = false
    greeting.value = false
    tipIdx.value = 0
  }
  const nextTip = () => {
    greeting.value = false
    tipIdx.value = tipIdx.value + 1
  }

  if (collapsed.value) {
    return (
      <button class="mascot-btn" onClick={summon} aria-label="Yannik Potter um Rat fragen" data-testid="mascot-summon">
        <img src={faceImg} alt="Yannik Potter" />
      </button>
    )
  }

  return (
    <div class="mascot" data-testid="mascot">
      <div class="mascot-bubble" data-testid="mascot-bubble">
        <button
          class="mascot-close"
          onClick={() => (collapsed.value = true)}
          aria-label="Zauberer ausblenden"
          data-testid="mascot-close"
        >
          ✕
        </button>
        <p>{text}</p>
        {isWelcome ? (
          <button class="mascot-more" onClick={nextTip}>
            Zeig mir einen Tipp →
          </button>
        ) : (
          tips.length > 1 && (
            <button class="mascot-more" onClick={nextTip}>
              Noch ein Tipp →
            </button>
          )
        )}
        <button
          class="yannik-cta"
          onClick={() => {
            collapsed.value = true
            openAssistant()
          }}
          data-testid="mascot-assistant"
        >
          🪄 KIannik: Inbox sortieren & Brainstorming
        </button>
      </div>
      <img
        src={mascotImg}
        alt="Yannik Potter, dein Hauszauberer"
        class="mascot-figure"
        onClick={isWelcome ? () => (collapsed.value = true) : nextTip}
        data-testid="mascot-figure"
      />
    </div>
  )
}
