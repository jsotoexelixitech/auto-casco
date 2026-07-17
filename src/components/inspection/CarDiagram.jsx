import { DIAGRAM_STATUS_FILL, DIAGRAM_STATUS_STROKE, BRAND } from '../../theme/tokens'
import { ESTADO_PIEZA } from '../../data/mockData'
import { isOptionalSequence } from '../../utils/sequencesConfig'

/**
 * Marcadores compactos (píldoras) sin solape.
 * Perímetro → techo → fila interior → maletero → daños debajo del carro.
 */
const ZONES = {
  front:         { label: 'Frontal',  x: 78,  y: 8,   w: 84, h: 36 },
  'front-right': { label: 'Del.Der',  x: 168, y: 58,  w: 48, h: 88 },
  'rear-right':  { label: 'Tras.Der', x: 168, y: 268, w: 48, h: 88 },
  rear:          { label: 'Trasera',  x: 78,  y: 368, w: 84, h: 36 },
  'rear-left':   { label: 'Tras.Izq', x: 24,  y: 268, w: 48, h: 88 },
  'front-left':  { label: 'Del.Izq',  x: 24,  y: 58,  w: 48, h: 88 },
  roof:          { label: 'Techo',    x: 85,  y: 100, w: 70, h: 26 },
  dashboard:     { label: 'Tablero',  x: 85,  y: 148, w: 70, h: 24 },
  interior:      { label: 'Interior', x: 85,  y: 180, w: 70, h: 24 },
  serial:        { label: 'Serial',   x: 85,  y: 212, w: 70, h: 24 },
  trunk:         { label: 'Maletero', x: 85,  y: 318, w: 70, h: 28 },
  damages:       { label: 'Daños',    x: 78,  y: 412, w: 84, h: 26 },
}

function zoneSequences(sequences, zone) {
  return sequences.filter((s) => s.diagramZone === zone)
}

/** True si alguna pieza de la foto tiene daño Regular o Malo. */
function photoHasDamage(photo) {
  if (!photo?.piezas) return false
  return Object.values(photo.piezas).some(
    (p) => p?.estado === ESTADO_PIEZA.REGULAR || p?.estado === ESTADO_PIEZA.MALO,
  )
}

function zoneHasDamage(zoneSeqs, photos) {
  return zoneSeqs.some((s) => photoHasDamage(photos[s.id]))
}

/**
 * Estados de relleno:
 * - active: capturando sin foto aún (azul)
 * - ok: cargada sin daños (verde)
 * - damaged: cargada con daños (ámbar)
 * - pending / next: aún no cargada
 *
 * Si ya está cargada y es la zona activa → se mantiene ok/damaged y selected=true (solo borde azul).
 */
function getZoneAppearance(zone, sequences, photos, activeSeqId) {
  const zoneSeqs = zoneSequences(sequences, zone)
  if (zoneSeqs.length === 0) return { status: 'hidden', selected: false }

  const required = zoneSeqs.filter((s) => !isOptionalSequence(s))
  const toCheck = required.length > 0 ? required : zoneSeqs
  const allDone = toCheck.every((s) => photos[s.id]?.uploaded)
  const isSelected = zoneSeqs.some((s) => s.id === activeSeqId)
  const capturedStatus = allDone
    ? (zoneHasDamage(toCheck, photos) ? 'damaged' : 'ok')
    : null

  if (isSelected) {
    if (capturedStatus) {
      return { status: capturedStatus, selected: true }
    }
    return { status: 'active', selected: true }
  }

  if (capturedStatus) {
    return { status: capturedStatus, selected: false }
  }

  const activeIdx = sequences.findIndex((s) => s.id === activeSeqId)
  const firstPendingIdx = sequences.findIndex(
    (s) => zoneSeqs.some((z) => z.id === s.id) && !photos[s.id]?.uploaded,
  )
  if (activeIdx >= 0 && firstPendingIdx === activeIdx + 1) {
    return { status: 'next', selected: false }
  }

  return { status: 'pending', selected: false }
}

function zoneTitle(zone, sequences, status, selected) {
  const names = zoneSequences(sequences, zone).map((s) => s.nombre).filter(Boolean)
  const base = names.length > 0 ? names.join(' · ') : (ZONES[zone]?.label ?? zone)
  if (selected && (status === 'ok' || status === 'damaged')) {
    return `${base} · Seleccionada`
  }
  if (status === 'ok') return `${base} · Sin daños`
  if (status === 'damaged') return `${base} · Con daños`
  if (status === 'active') return `${base} · Capturando`
  return base
}

export default function CarDiagram({ sequences, photos, activeSeqId, onZoneSelect }) {
  const handleZoneActivate = (zone, status) => {
    if (status === 'hidden' || !onZoneSelect) return
    onZoneSelect(zone)
  }

  return (
    <svg
      viewBox="0 0 240 450"
      className="w-full max-w-[180px] mx-auto drop-shadow-sm"
      aria-label="Plano digital del vehículo"
    >
      <rect x="55" y="50" width="130" height="310" rx="28" fill="#f1f5f9" stroke="#c8ccdb" strokeWidth="2" />
      <rect x="72" y="118" width="96" height="120" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <ellipse cx="60" cy="105" rx="15" ry="20" fill="#334155" />
      <ellipse cx="180" cy="105" rx="15" ry="20" fill="#334155" />
      <ellipse cx="60" cy="315" rx="15" ry="20" fill="#334155" />
      <ellipse cx="180" cy="315" rx="15" ry="20" fill="#334155" />

      {Object.entries(ZONES).map(([zone, z]) => {
        const { status, selected } = getZoneAppearance(zone, sequences, photos, activeSeqId)
        if (status === 'hidden') return null

        const cx = z.x + z.w / 2
        const cy = z.y + z.h / 2
        const isCaptured = status === 'ok' || status === 'damaged'
        const showLabel = status === 'active' || status === 'next' || status === 'pending'
        const fillOpacity = status === 'pending' ? 0.7 : status === 'next' ? 0.8 : 0.92
        const clickable = typeof onZoneSelect === 'function'

        return (
          <g
            key={zone}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={zoneTitle(zone, sequences, status, selected)}
            style={clickable ? { cursor: 'pointer' } : undefined}
            onClick={clickable ? () => handleZoneActivate(zone, status) : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleZoneActivate(zone, status)
                    }
                  }
                : undefined
            }
          >
            <title>{zoneTitle(zone, sequences, status, selected)}</title>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx="10"
              fill={DIAGRAM_STATUS_FILL[status]}
              stroke={selected ? BRAND.navy : DIAGRAM_STATUS_STROKE[status]}
              strokeWidth={selected ? 3 : 1.4}
              opacity={fillOpacity}
            />
            {selected && (
              <rect
                x={z.x - 1.5}
                y={z.y - 1.5}
                width={z.w + 3}
                height={z.h + 3}
                rx="11"
                fill="none"
                stroke={BRAND.mid}
                strokeWidth="2.5"
                opacity="0.7"
                pointerEvents="none"
              >
                <animate attributeName="opacity" from="0.75" to="0.25" dur="1.2s" repeatCount="indefinite" />
              </rect>
            )}
            {isCaptured && (
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="700"
                pointerEvents="none"
              >
                ✓
              </text>
            )}
            {showLabel && (
              <text
                x={cx}
                y={cy + 3.5}
                textAnchor="middle"
                fill={status === 'pending' ? '#475569' : 'white'}
                fontSize="8"
                fontWeight="700"
                pointerEvents="none"
              >
                {z.label}
              </text>
            )}
          </g>
        )
      })}

      <text x="120" y="448" textAnchor="middle" fill="#7a7f95" fontSize="8" fontWeight="500">
        Plano digital del vehículo
      </text>
    </svg>
  )
}
