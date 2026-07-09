import { areaById } from '../state/store'

export function AreaDot(props: { areaId?: string }) {
  const area = areaById(props.areaId)
  if (!area) return null
  return <span class="area-dot" style={{ background: area.color }} title={area.name} />
}

export function AreaBadge(props: { areaId?: string }) {
  const area = areaById(props.areaId)
  if (!area) return null
  return (
    <span class="chip" style={{ cursor: 'default', borderColor: area.color }}>
      <span class="area-dot" style={{ background: area.color }} />
      {area.name}
    </span>
  )
}
