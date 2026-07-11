import type { ComponentChildren } from 'preact'
import { useEffect } from 'preact/hooks'

export function BottomSheet(props: { onClose: () => void; children: ComponentChildren; label?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      class="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <div class="sheet" role="dialog" aria-modal="true" aria-label={props.label}>
        {props.children}
      </div>
    </div>
  )
}
