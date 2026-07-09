import { useEffect, useRef } from 'preact/hooks'
import { noteByTitle, notes } from '../state/store'
import { navigate } from '../router'
import { extractLinks } from '../lib/markdown'

interface GNode {
  id: string
  title: string
  x: number
  y: number
  vx: number
  vy: number
  deg: number
}
interface GEdge {
  a: number
  b: number
}

/** Kraftbasierter Notiz-Graph auf Canvas. Knoten antippen öffnet die Notiz. */
export function GraphView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const list = notes.value
    const index = new Map(list.map((n, i) => [n.id, i]))
    const nodes: GNode[] = list.map((n) => ({
      id: n.id,
      title: n.title || '(ohne Titel)',
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
      deg: 0,
    }))
    const edges: GEdge[] = []
    for (const n of list) {
      const from = index.get(n.id)!
      for (const link of extractLinks(n.body)) {
        const target = noteByTitle(link)
        if (target && target.id !== n.id) {
          const to = index.get(target.id)
          if (to !== undefined) {
            edges.push({ a: from, b: to })
            nodes[from].deg++
            nodes[to].deg++
          }
        }
      }
    }

    let raf = 0
    let w = 0
    let h = 0
    let dpr = 1
    // Ansicht: Verschiebung + Zoom
    const cam = { x: 0, y: 0, scale: 1 }
    let cx = 0
    let cy = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cx = w / 2
      cy = h / 2
    }
    resize()

    const step = () => {
      // einfache Kraftsimulation
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          let dx = a.x - b.x
          let dy = a.y - b.y
          let d2 = dx * dx + dy * dy || 0.01
          const rep = 1400 / d2
          const d = Math.sqrt(d2)
          dx /= d
          dy /= d
          a.vx += dx * rep
          a.vy += dy * rep
          b.vx -= dx * rep
          b.vy -= dy * rep
        }
      }
      for (const e of edges) {
        const a = nodes[e.a]
        const b = nodes[e.b]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01
        const f = (d - 70) * 0.02
        const ux = dx / d
        const uy = dy / d
        a.vx += ux * f
        a.vy += uy * f
        b.vx -= ux * f
        b.vy -= uy * f
      }
      for (const n of nodes) {
        n.vx += -n.x * 0.002
        n.vy += -n.y * 0.002
        n.vx *= 0.85
        n.vy *= 0.85
        n.x += n.vx
        n.y += n.vy
      }
    }

    const toScreen = (n: GNode) => ({
      x: cx + cam.x + n.x * cam.scale,
      y: cy + cam.y + n.y * cam.scale,
    })

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(56,189,248,0.28)'
      for (const e of edges) {
        const a = toScreen(nodes[e.a])
        const b = toScreen(nodes[e.b])
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      for (const n of nodes) {
        const p = toScreen(n)
        const r = (4 + Math.min(n.deg, 8) * 1.4) * Math.min(cam.scale, 1.6)
        ctx.beginPath()
        ctx.fillStyle = '#38bdf8'
        ctx.shadowColor = 'rgba(56,189,248,0.7)'
        ctx.shadowBlur = 8
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        if (cam.scale > 0.7 || n.deg > 1) {
          ctx.fillStyle = 'rgba(231,238,246,0.9)'
          ctx.font = '11px Inter Variable, system-ui, sans-serif'
          ctx.textAlign = 'center'
          const label = n.title.length > 18 ? n.title.slice(0, 18) + '…' : n.title
          ctx.fillText(label, p.x, p.y + r + 12)
        }
      }
    }

    let frames = 0
    const loop = () => {
      if (frames < 320) {
        step()
        frames++
      }
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // Interaktion: Ziehen zum Verschieben, Tippen zum Öffnen
    let dragging = false
    let moved = false
    let lastX = 0
    let lastY = 0
    const down = (x: number, y: number) => {
      dragging = true
      moved = false
      lastX = x
      lastY = y
    }
    const move = (x: number, y: number) => {
      if (!dragging) return
      const dx = x - lastX
      const dy = y - lastY
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true
      cam.x += dx
      cam.y += dy
      lastX = x
      lastY = y
    }
    const up = (x: number, y: number) => {
      dragging = false
      if (moved) return
      // Tap: nächsten Knoten treffen
      let best: GNode | null = null
      let bestD = 24 * 24
      for (const n of nodes) {
        const p = toScreen(n)
        const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y)
        if (d < bestD) {
          bestD = d
          best = n
        }
      }
      if (best) navigate(`/notiz/${best.id}`)
    }

    const rect = () => canvas.getBoundingClientRect()
    const onDown = (e: PointerEvent) => {
      const r = rect()
      down(e.clientX - r.left, e.clientY - r.top)
    }
    const onMove = (e: PointerEvent) => {
      const r = rect()
      move(e.clientX - r.left, e.clientY - r.top)
    }
    const onUp = (e: PointerEvent) => {
      const r = rect()
      up(e.clientX - r.left, e.clientY - r.top)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cam.scale = Math.max(0.3, Math.min(3, cam.scale * (e.deltaY < 0 ? 1.1 : 0.9)))
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const empty = notes.value.length === 0

  return (
    <div class="graph-wrap">
      <div class="graph-bar">
        <button class="btn small" onClick={() => navigate('/notizen')} aria-label="Zurück">
          ‹
        </button>
        <h1 class="view-title">Graph</h1>
      </div>
      {empty ? (
        <div class="empty-state" style={{ paddingTop: '35vh' }}>
          <div class="big">🕸</div>
          <p>Noch keine Notizen — leg welche an und verbinde sie mit [[Titel]].</p>
        </div>
      ) : (
        <canvas ref={canvasRef} data-testid="graph-canvas" />
      )}
    </div>
  )
}
