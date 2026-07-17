import { calcularPiezas } from './planEngine'
import { filterPhotosForCurrentSequences } from './sequencesConfig'

/**
 * Huella estable de los datos que alimentan el diagnóstico (paso 3: fotos/análisis).
 * Si no cambia, no hace falta regenerar el texto.
 */
export function getIaDiagnosticoSourceKey({
  photos = {},
  vehiculo = {},
  danios = [],
} = {}) {
  const photosVigentes = filterPhotosForCurrentSequences(vehiculo, photos)
  const photoParts = Object.keys(photosVigentes)
    .sort()
    .map((id) => {
      const p = photosVigentes[id]
      if (!p?.uploaded && !p?.analyzed) return null
      const piezas = p.piezas
        ? Object.keys(p.piezas)
            .sort()
            .map((nombre) => {
              const pieza = p.piezas[nombre]
              return `${nombre}:${pieza?.estado ?? ''}:${pieza?.comentario ?? ''}`
            })
            .join(',')
        : ''
      return `${id}:u${p.uploaded ? 1 : 0}:a${p.analyzed ? 1 : 0}:${piezas}`
    })
    .filter(Boolean)

  const veh = [vehiculo.marca, vehiculo.modelo, vehiculo.placa].filter(Boolean).join('|')
  const dan = danios
    .map((d) => `${d.id ?? ''}:${d.severidad ?? ''}:${d.ubicacion ?? ''}`)
    .join(';')

  return `${veh}::${photoParts.join('|')}::${dan}`
}

/**
 * Genera un diagnóstico coherente a partir del análisis de fotos vigentes
 * y daños registrados (si existen). No incluye observaciones del inspector.
 */
export function buildIaDiagnostico({
  danios = [],
  photos = {},
  vehiculo = {},
} = {}) {
  const photosVigentes = filterPhotosForCurrentSequences(vehiculo, photos)
  const piezas = calcularPiezas(photosVigentes)
  const fotosAnalizadas = piezas.analizadas
  const graves = danios.filter((d) => d.severidad === 'grave').length
  const moderados = danios.filter((d) => d.severidad === 'moderado').length
  const ubicaciones = danios.map((d) => d.ubicacion).filter(Boolean)
  const vehLabel = [vehiculo.marca, vehiculo.modelo, vehiculo.placa]
    .filter(Boolean)
    .join(' ')

  const partes = []

  if (vehLabel) {
    partes.push(`Análisis del vehículo ${vehLabel}.`)
  } else {
    partes.push('Análisis de inspección vehicular completado.')
  }

  if (fotosAnalizadas > 0) {
    partes.push(
      `Se revisaron ${fotosAnalizadas} zona(s) fotográfica(s): ${piezas.buenas} pieza(s) en buen estado, ${piezas.regulares} pieza(s) con observación regular y ${piezas.malas} pieza(s) con daño grave.`,
    )
  } else {
    partes.push('No hay zonas fotográficas analizadas por la IA todavía.')
  }

  if (danios.length === 0 && piezas.regulares === 0 && piezas.malas === 0) {
    partes.push(
      'No se detectaron daños relevantes. El estado general del vehículo es óptimo según la evidencia disponible.',
    )
  } else if (danios.length === 0 && (piezas.regulares > 0 || piezas.malas > 0)) {
    const foco = []
    if (piezas.malas > 0) foco.push(`${piezas.malas} pieza(s) en estado malo`)
    if (piezas.regulares > 0) foco.push(`${piezas.regulares} pieza(s) en estado regular`)
    partes.push(
      `Se identificaron hallazgos en las fotos (${foco.join(' y ')}). Se recomienda revisión técnica de esos componentes antes de la emisión.`,
    )
  } else {
    const detalleUbic = ubicaciones.length
      ? ` Ubicaciones: ${ubicaciones.join(', ')}.`
      : ''
    partes.push(
      `Hay ${danios.length} daño(s) registrados (graves: ${graves}, moderados: ${moderados}).${detalleUbic} Se recomienda evaluación técnica de los componentes afectados.`,
    )
  }

  return partes.join(' ')
}

export function generateIaDiagnosticoAsync(data, { delayMs = 2000 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildIaDiagnostico(data)), delayMs)
  })
}
