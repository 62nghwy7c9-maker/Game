import { openCapture } from './CaptureSheet'

export function CaptureFab() {
  return (
    <button class="fab" onClick={openCapture} aria-label="Schnell erfassen" data-testid="capture-fab">
      +
    </button>
  )
}
