import { signal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'

/** Steuert, ob das Intro noch sichtbar ist (einmal pro App-Start). */
export const introVisible = signal(!sessionStoragePlayed())

function sessionStoragePlayed(): boolean {
  try {
    return sessionStorage.getItem('wk-intro-played') === '1'
  } catch {
    return false
  }
}

function markPlayed(): void {
  try {
    sessionStorage.setItem('wk-intro-played', '1')
  } catch {
    // ignorieren
  }
}

const DURATION = 3000

interface Node {
  x: number
  y: number
  tx: number
  ty: number
  seed: number
}

export function IntroSplash() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!introVisible.value) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let dpr = 1
    let nodes: Node[] = []
    const N = 46

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cx = w / 2
      const cy = h * 0.42
      const R = Math.min(w, h) * 0.28
      nodes = Array.from({ length: N }, (_, i) => {
        const ang = (i / N) * Math.PI * 2 + i * 0.7
        const rad = R * (0.35 + 0.65 * ((i * 97) % 100) / 100)
        return {
          // Start: chaotisch verstreut vom Rand
          x: cx + Math.cos(ang * 3) * w,
          y: cy + Math.sin(ang * 2) * h,
          // Ziel: gehirnförmige Wolke
          tx: cx + Math.cos(ang) * rad * (1 + 0.25 * Math.sin(ang * 3)),
          ty: cy + Math.sin(ang) * rad * 0.8,
          seed: i,
        }
      })
    }
    setup()

    const start = performance.now()
    let raf = 0

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      // Einflug-Fortschritt (ease-out)
      const ease = 1 - Math.pow(1 - Math.min(1, t * 1.5), 3)

      ctx.clearRect(0, 0, w, h)
      const pts = nodes.map((n) => ({
        x: n.x + (n.tx - n.x) * ease + Math.sin(now * 0.001 + n.seed) * 2 * ease,
        y: n.y + (n.ty - n.y) * ease + Math.cos(now * 0.0012 + n.seed) * 2 * ease,
      }))

      // Verbindungen
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const d = Math.hypot(dx, dy)
          if (d < 84) {
            ctx.strokeStyle = `rgba(56,189,248,${((1 - d / 84) * 0.5 * ease).toFixed(3)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }
      // Knoten
      for (let i = 0; i < pts.length; i++) {
        const pulse = (Math.sin(now * 0.004 + nodes[i].seed) + 1) / 2
        ctx.fillStyle = `rgba(56,189,248,${(0.5 + 0.5 * pulse).toFixed(3)})`
        ctx.shadowColor = 'rgba(56,189,248,0.9)'
        ctx.shadowBlur = 8 + pulse * 8
        ctx.beginPath()
        ctx.arc(pts[i].x, pts[i].y, Math.max(0.1, (1.6 + pulse * 1.8) * ease), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      if (t < 1 && !reduce) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const dismiss = () => {
      const root = rootRef.current
      if (!root) {
        introVisible.value = false
        return
      }
      root.classList.add('intro-out')
      markPlayed()
      window.setTimeout(() => {
        introVisible.value = false
      }, 520)
    }

    const autoTimer = window.setTimeout(dismiss, reduce ? 1200 : DURATION + 350)
    const onResize = () => setup()
    window.addEventListener('resize', onResize)
    const root = rootRef.current
    root?.addEventListener('click', dismiss)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(autoTimer)
      window.removeEventListener('resize', onResize)
      root?.removeEventListener('click', dismiss)
    }
  }, [])

  if (!introVisible.value) return null

  return (
    <div class="intro" ref={rootRef} role="dialog" aria-label="Wochenkompass" data-testid="intro-splash">
      <canvas ref={canvasRef} class="intro-canvas" aria-hidden="true" />
      <div class="intro-content">
        <div class="intro-title">Wochenkompass</div>
        <div class="intro-tag mono">Fokus statt Pingpong</div>
      </div>
      <div class="intro-skip mono">Tippen zum Überspringen</div>
    </div>
  )
}
