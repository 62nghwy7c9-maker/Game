import { useEffect, useRef } from 'preact/hooks'
import { inboxTasks } from '../state/store'
import { currentWeekId, formatDateLong, todayIso } from '../lib/dates'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Gute Nacht'
  if (h < 11) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
}

const LINK_DIST = 95

/**
 * Pulsierendes Neuronen-Netz als Kopfbereich der Heute-Ansicht.
 * Reagiert auf die App-Daten: je voller die Inbox, desto aktiver das Netz.
 */
export function BrainHeader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inboxCount = inboxTasks.value.length

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Aktivität des Netzes: ruhig bei leerer Inbox, lebhaft bei vielen offenen Einträgen
    const intensity = Math.min(1, inboxCount / 8)

    let raf = 0
    let nodes: Node[] = []
    let w = 0
    let h = 0

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(w / 26) + 16
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * (0.12 + 0.3 * intensity),
        vy: (Math.random() - 0.5) * (0.1 + 0.24 * intensity),
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < -6) n.x = w + 6
        if (n.x > w + 6) n.x = -6
        if (n.y < -6) n.y = h + 6
        if (n.y > h + 6) n.y = -6
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * (0.16 + 0.2 * intensity)
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      for (const n of nodes) {
        const pulse = (Math.sin(t * 0.0012 * (1 + intensity) + n.phase) + 1) / 2
        const r = 1.4 + pulse * 1.6
        ctx.fillStyle = `rgba(56, 189, 248, ${(0.45 + 0.5 * pulse).toFixed(3)})`
        ctx.shadowColor = 'rgba(56, 189, 248, 0.8)'
        ctx.shadowBlur = 5 + pulse * 7
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    setup()
    if (reduceMotion) {
      draw(1000)
    } else {
      raf = requestAnimationFrame(loop)
    }

    const onResize = () => {
      setup()
      if (reduceMotion) draw(1000)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [inboxCount])

  return (
    <div class="brain-head">
      <canvas ref={canvasRef} class="brain-canvas" aria-hidden="true" />
      <div class="brain-overlay">
        <h1 class="view-title brain-eyebrow">Heute</h1>
        <div class="brain-greeting">{greeting()}</div>
        <div class="brain-meta mono">
          {formatDateLong(todayIso())} · KW {Number(currentWeekId().slice(6))}
        </div>
      </div>
    </div>
  )
}
