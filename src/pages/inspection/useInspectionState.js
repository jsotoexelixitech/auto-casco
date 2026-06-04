import { useCallback, useState } from 'react'
import { ESTADO_PIEZA } from '../../data/mockData'
import { getActiveSequences } from '../../utils/sequencesConfig'

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
    carnet: null,
    naturaleza: null, // 'natural' | 'juridica'
  })
  const [tomador, setTomador] = useState({
    nombres: '',
    apellidos: '',
    documento: '',
    razonSocial: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
  })
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

  const setPhoto = useCallback((id, patch) => {
    setPhotos((prev) => {
      const p = prev[id] || { piezas: {}, issues: [] }
      return {
        ...prev,
        [id]: { ...p, ...patch },
      }
    })
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
  }, [])

  return {
    tipoInspeccion,
    setTipoInspeccion,
    docs,
    setDocs,
    tomador,
    setTomador,
    vehiculo,
    setVehiculo,
    ubicacion,
    setUbicacion,
    photos,
    setPhoto,
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
    reset,
  }
}
