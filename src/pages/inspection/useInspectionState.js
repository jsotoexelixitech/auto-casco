import { useCallback, useState } from 'react'
import { ESTADO_PIEZA } from '../../data/mockData'
import { getActiveSequences, pruneObsoleteDetailPhotos, removeAllDetailPhotosForParent, applyDetailValidation } from '../../utils/sequencesConfig'

export const EMPTY_PERSONA = () => ({
  nombres: '',
  apellidos: '',
  documento: '',
  razonSocial: '',
  email: '',
  telefono: '',
  fechaNacimiento: '',
})

/** Snapshot de valores leídos por OCR (solo claves que el documento rellenó). */
export const EMPTY_OCR_BASELINE = () => ({
  titular: null,
  tomador: null,
  vehiculo: null,
})

export function normalizeOcrCmp(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

/**
 * true si el campo tiene baseline OCR y el valor actual difiere.
 * @param {Record<string, string>|null} baseline
 * @param {string} key
 * @param {unknown} currentValue
 */
export function isOcrFieldEdited(baseline, key, currentValue) {
  if (!baseline || typeof baseline !== 'object') return false
  if (!Object.prototype.hasOwnProperty.call(baseline, key)) return false
  return normalizeOcrCmp(baseline[key]) !== normalizeOcrCmp(currentValue)
}

const initialPhotoState = () =>
  getActiveSequences().reduce((acc, s) => {
    acc[s.id] = {
      uploaded: false,
      analyzing: false,
      analyzed: false,
      thumbnail: null,
      placa: null,
      placaMatch: null,
      piezas: s.piezas.reduce((p, name) => {
        p[name] = { estado: ESTADO_PIEZA.BUENO, comentario: '' }
        return p
      }, {}),
      issues: [],
    }
    return acc
  }, {})

export function useInspectionState() {
  const [docs, setDocs] = useState({
    cedula: null,
    rif: null,
    cedulaTomador: null,
    rifTomador: null,
    carnet: null,
    certificadoOrigen: null,
    naturaleza: null, // titular: 'natural' | 'juridica'
    tipoTitular: 'natural',
    naturalezaTomador: null,
    tipoTomador: 'natural',
  })
  const [titular, setTitular] = useState(EMPTY_PERSONA())
  const [tomador, setTomador] = useState(EMPTY_PERSONA())
  const [tomadorEsTitular, setTomadorEsTitular] = useState(false)
  const [ocrBaseline, setOcrBaseline] = useState(EMPTY_OCR_BASELINE())
  const [vehiculo, setVehiculo] = useState({
    marca: '',
    modelo: '',
    version: '',
    anio: '',
    color: '',
    placa: '',
    serial: '',
    tipo: 'Particular',
    puestos: '',
    kilometraje: '',
    is0km: false,
  })
  const [ubicacion, setUbicacion] = useState({
    lat: null,
    lng: null,
    direccion: '',
    capturando: false,
  })
  const [photos, setPhotos] = useState(initialPhotoState())
  const [danios, setDanios] = useState([])
  const [video360, setVideo360] = useState({ uploaded: false, url: null, processing: false })
  const [tipoInspeccion, setTipoInspeccion] = useState('auto')
  const [descripcionDanios, setDescripcionDanios] = useState('')
  const [observacionesRiesgo, setObservacionesRiesgo] = useState('')
  const [iaDiagnostico, setIaDiagnostico] = useState('')
  const [iaDiagnosticoKey, setIaDiagnosticoKey] = useState('')
  const [valrepPlanes, setValrepPlanes] = useState([])
  const [valrepPlanesKey, setValrepPlanesKey] = useState('')
  const [valrepPlanesStatus, setValrepPlanesStatus] = useState('idle') // idle | loading | ready | error
  const [valrepPlanesError, setValrepPlanesError] = useState('')
  const [emissionValidation, setEmissionValidation] = useState({ status: 'idle', message: '', reason: '' })

  const setPhoto = useCallback((id, patch) => {
    setPhotos((prev) => {
      const p = prev[id] || { piezas: {}, issues: [] }
      return {
        ...prev,
        [id]: { ...p, ...patch },
      }
    })
  }, [])

  /**
   * Guarda el resultado de análisis de una secuencia.
   * En fotos de detalle, valida/corrige el estado de la pieza en la secuencia padre.
   */
  const commitPhotoAnalysis = useCallback((seqId, { patch = {}, piezasUpdates = {} } = {}) => {
    setPhotos((prev) => {
      const previous = prev[seqId] || { piezas: {}, issues: [] }
      const mergedPiezas = { ...(previous.piezas || {}) }

      for (const [name, data] of Object.entries(piezasUpdates)) {
        mergedPiezas[name] = {
          ...(mergedPiezas[name] || { estado: ESTADO_PIEZA.BUENO, comentario: '' }),
          ...data,
        }
      }

      let next = {
        ...prev,
        [seqId]: {
          ...previous,
          ...patch,
          piezas: mergedPiezas,
        },
      }

      const isDetail = seqId.startsWith('seq-detail-') || previous.isDynamicDetail || patch.isDynamicDetail

      if (isDetail) {
        const parentSeqId = patch.parentSeqId || previous.parentSeqId
        const piezaNombre =
          patch.piezaNombre || previous.piezaNombre || Object.keys(piezasUpdates)[0]
        const piezaUpdate = (piezaNombre && piezasUpdates[piezaNombre]) || mergedPiezas[piezaNombre]
        const applied = applyDetailValidation(next, {
          detailSeqId: seqId,
          parentSeqId,
          piezaNombre,
          piezaUpdate,
          detailThumbnail: patch.thumbnail || previous.thumbnail,
        })
        return applied.photos
      }

      return pruneObsoleteDetailPhotos(next, seqId, mergedPiezas)
    })
  }, [])

  const removeDetailPhotosForParent = useCallback((parentSeqId) => {
    setPhotos((prev) => removeAllDetailPhotosForParent(prev, parentSeqId))
  }, [])

  const setPiezaEstado = useCallback((seqId, piezaName, estado) => {
    setPhotos((prev) => {
      const p = prev[seqId] || { piezas: {} }
      const pPiezas = p.piezas || {}
      return {
        ...prev,
        [seqId]: {
          ...p,
          piezas: {
            ...pPiezas,
            [piezaName]: { ...(pPiezas[piezaName] || {}), estado },
          },
        },
      }
    })
  }, [])

  const setPiezaComentario = useCallback((seqId, piezaName, comentario) => {
    setPhotos((prev) => {
      const p = prev[seqId] || { piezas: {} }
      const pPiezas = p.piezas || {}
      return {
        ...prev,
        [seqId]: {
          ...p,
          piezas: {
            ...pPiezas,
            [piezaName]: { ...(pPiezas[piezaName] || {}), comentario },
          },
        },
      }
    })
  }, [])

  const reset = useCallback(() => {
    setPhotos(initialPhotoState())
    setDanios([])
    setVideo360({ uploaded: false, url: null, processing: false })
    setIaDiagnostico('')
    setIaDiagnosticoKey('')
    setValrepPlanes([])
    setValrepPlanesKey('')
    setValrepPlanesStatus('idle')
    setValrepPlanesError('')
    setEmissionValidation({ status: 'idle', message: '', reason: '' })
    setTitular(EMPTY_PERSONA())
    setTomador(EMPTY_PERSONA())
    setTomadorEsTitular(false)
    setOcrBaseline(EMPTY_OCR_BASELINE())
  }, [])

  return {
    tipoInspeccion,
    setTipoInspeccion,
    docs,
    setDocs,
    titular,
    setTitular,
    tomador,
    setTomador,
    tomadorEsTitular,
    setTomadorEsTitular,
    ocrBaseline,
    setOcrBaseline,
    vehiculo,
    setVehiculo,
    ubicacion,
    setUbicacion,
    photos,
    setPhoto,
    commitPhotoAnalysis,
    removeDetailPhotosForParent,
    setPiezaEstado,
    setPiezaComentario,
    danios,
    setDanios,
    video360,
    setVideo360,
    descripcionDanios,
    setDescripcionDanios,
    observacionesRiesgo,
    setObservacionesRiesgo,
    iaDiagnostico,
    setIaDiagnostico,
    iaDiagnosticoKey,
    setIaDiagnosticoKey,
    valrepPlanes,
    setValrepPlanes,
    valrepPlanesKey,
    setValrepPlanesKey,
    valrepPlanesStatus,
    setValrepPlanesStatus,
    valrepPlanesError,
    setValrepPlanesError,
    emissionValidation,
    setEmissionValidation,
    reset,
  }
}
