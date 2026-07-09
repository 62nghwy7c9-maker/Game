import { signal } from '@preact/signals'

export interface ToastItem {
  id: number
  text: string
  actionLabel?: string
  onAction?: () => void
  sticky?: boolean
}

const toasts = signal<ToastItem[]>([])
let nextId = 1

export function showToast(text: string, opts?: Omit<ToastItem, 'id' | 'text'>): void {
  const id = nextId++
  toasts.value = [...toasts.value, { id, text, ...opts }]
  if (!opts?.sticky) {
    setTimeout(() => dismissToast(id), 3500)
  }
}

export function dismissToast(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function ToastHost() {
  if (toasts.value.length === 0) return null
  return (
    <div class="toast-wrap" role="status">
      {toasts.value.map((t) => (
        <div class="toast" key={t.id}>
          <span>{t.text}</span>
          {t.actionLabel && (
            <button
              onClick={() => {
                t.onAction?.()
                dismissToast(t.id)
              }}
            >
              {t.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
