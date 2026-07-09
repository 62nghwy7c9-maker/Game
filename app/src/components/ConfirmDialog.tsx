import { BottomSheet } from './BottomSheet'

export function ConfirmDialog(props: {
  title: string
  text: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <BottomSheet onClose={props.onCancel} label={props.title}>
      <h3>{props.title}</h3>
      <p class="muted" style={{ marginBottom: 14 }}>
        {props.text}
      </p>
      <div class="btn-row">
        <button class={`btn ${props.danger ? 'danger' : 'primary'}`} onClick={props.onConfirm}>
          {props.confirmLabel}
        </button>
        <button class="btn" onClick={props.onCancel}>
          Abbrechen
        </button>
      </div>
    </BottomSheet>
  )
}
