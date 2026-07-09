import { signal } from '@preact/signals'

export interface Route {
  /** erster Hash-Abschnitt, z. B. 'woche' */
  name: string
  /** weitere Abschnitte, z. B. die Wochen-ID */
  params: string[]
  query: URLSearchParams
}

function parseHash(): Route {
  const raw = location.hash.replace(/^#\/?/, '')
  const [path, queryStr] = raw.split('?')
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent)
  return {
    name: segments[0] || 'heute',
    params: segments.slice(1),
    query: new URLSearchParams(queryStr || ''),
  }
}

export const route = signal<Route>(parseHash())

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.value = parseHash()
  })
}

export function navigate(path: string): void {
  location.hash = path.startsWith('/') ? path : `/${path}`
}
