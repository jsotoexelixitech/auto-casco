import { DIAGRAM_STATUS_FILL, DIAGRAM_STATUS_STROKE } from '../../theme/tokens'

const ZONES = {
  'front':       { label: 'Frontal',  x: 80,  y: 10,  w: 80, h: 55 },
  'front-right': { label: 'Del.Der',  x: 160, y: 60,  w: 55, h: 100 },
  'rear-right':  { label: 'Tras.Der', x: 160, y: 260, w: 55, h: 100 },
  'rear':        { label: 'Trasera',  x: 80,  y: 360, w: 80, h: 55 },
  'rear-left':   { label: 'Tras.Izq', x: 25,  y: 260, w: 55, h: 100 },
  'front-left':  { label: 'Del.Izq',  x: 25,  y: 60,  w: 55, h: 100 },
  'serial':      { label: 'Serial',   x: 95,  y: 185, w: 50, h: 30 },
  'interior':    { label: 'Interior', x: 80,  y: 160, w: 80, h: 60 },
  'dashboard':   { label: 'Tablero',  x: 85,  y: 140, w: 70, h: 25 },
  'trunk':       { label: 'Maletero', x: 85,  y: 320, w: 70, h: 40 },
  'damages':     { label: 'Daños',    x: 85,  y: 220, w: 70, h: 25 },
}

export default function CarDiagram({ sequences, photos, activeSeqId }) {
  function getZoneStatus(zone) {
    const seq = sequences.find((s) => s.diagramZone === zone)
    if (!seq) return 'hidden'
    const ph = photos[seq.id]
    if (seq.id === activeSeqId) return 'active'
    if (ph?.uploaded) return 'done'
    const activeIdx = sequences.findIndex((s) => s.id === activeSeqId)
    const seqIdx = sequences.findIndex((s) => s.id === seq.id)
    if (seqIdx === activeIdx + 1) return 'next'
    return 'pending'
  }

  return (
    <svg viewBox="0 0 240 430" className="w-full max-w-[180px] mx-auto drop-shadow-sm" aria-label="Plano digital del vehículo">
      <rect x="55" y="55" width="130" height="310" rx="28" fill="#f1f5f9" stroke="#c8ccdb" strokeWidth="2" />
      <rect x="70" y="130" width="100" height="140" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <ellipse cx="60"  cy="110" rx="16" ry="22" fill="#334155" />
      <ellipse cx="180" cy="110" rx="16" ry="22" fill="#334155" />
      <ellipse cx="60"  cy="320" rx="16" ry="22" fill="#334155" />
      <ellipse cx="180" cy="320" rx="16" ry="22" fill="#334155" />

      {Object.entries(ZONES).map(([zone, z]) => {
        const status = getZoneStatus(zone)
        if (status === 'hidden') return null
        return (
          <g key={zone}>
            <rect
              x={z.x} y={z.y} width={z.w} height={z.h} rx="6"
              fill={DIAGRAM_STATUS_FILL[status]}
              stroke={DIAGRAM_STATUS_STROKE[status]}
              strokeWidth={status === 'active' ? 2.5 : 1.5}
              opacity={status === 'pending' ? 0.5 : 0.85}
            />
            {status === 'done' && (
              <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">✓</text>
            )}
            {status === 'active' && (
              <>
                <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="6" fill="none" stroke="#16a34a" strokeWidth="3" opacity="0.6">
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite" />
                </rect>
                <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 5} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">{z.label}</text>
              </>
            )}
          </g>
        )
      })}
      <text x="120" y="425" textAnchor="middle" fill="#7a7f95" fontSize="9" fontWeight="500">Plano digital del vehículo</text>
    </svg>
  )
}
