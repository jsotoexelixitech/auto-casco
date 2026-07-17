import { useState, useEffect, useRef, useId, useMemo, useCallback } from 'react'
import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'
import { extractDocumentOcr } from '../../services/aiDocumentOcr'
import { OcrDocumentInvalidError } from '../../utils/ocrValidation'
import ValidatedField from '../../components/ui/ValidatedField'
import {
  normalizeDocumentoFromOcr,
  normalizePersonName,
  normalizeRazonSocial,
  normalizeVehicleAscii,
  normalizeVehicleModelo,
  normalizeVehicleAnio,
} from '../../utils/fieldValidators'
import { readFileAsBase64 } from '../../services/aiVehicleAnalysis'
import { validateEmissionAuto } from '../../services/valrepApi'
import { getStep1SectionStatus, validateVehicleSection } from './step1Validation'
import { EMPTY_PERSONA, isOcrFieldEdited } from './useInspectionState'

export default function Step1Documents({ state, validateTrigger = 0 }) {
  const {
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
    emissionValidation,
    setEmissionValidation,
  } = state
  const toast = useToast()
  // scanning is now an object tracking multiple active uploads: { cedula: true, certificado: true }
  const [scanning, setScanning] = useState({})
  const [uploadWarnings, setUploadWarnings] = useState({})
  const [tipoSwitchPending, setTipoSwitchPending] = useState(null)
  const [mismoTitularPending, setMismoTitularPending] = useState(false)
  const [vehicleSwitchPending, setVehicleSwitchPending] = useState(null) // null | boolean
  const emissionValidateTimerRef = useRef(null)
  const emissionValidateSeqRef = useRef(0)

  const tipoPersona = docs.tipoTitular ?? 'natural'
  const setTipoPersona = (next) => setDocs((prev) => ({ ...prev, tipoTitular: next }))
  const is0km = vehiculo?.is0km || false
  const isScanning = Object.values(scanning).some(Boolean)
  /** El check "mismo titular" solo aplica si el titular es persona natural. */
  const puedeTomadorSerTitular = tipoPersona === 'natural'
  const tomadorEsMismoTitular = tomadorEsTitular && puedeTomadorSerTitular

  // Si el tomador es el titular, mantener datos sincronizados (solo titular natural)
  useEffect(() => {
    if (!tomadorEsMismoTitular) return
    setTomador({ ...titular })
  }, [titular, tomadorEsMismoTitular, setTomador])

  // Titular jurídico: el tomador debe pedirse siempre (persona natural)
  useEffect(() => {
    if (tipoPersona !== 'juridica') return
    if (tomadorEsTitular) setTomadorEsTitular(false)
    setDocs((prev) => {
      if (prev.tipoTomador === 'natural' && !prev.rifTomador && !prev.naturalezaTomador) {
        return prev
      }
      return {
        ...prev,
        tipoTomador: 'natural',
        rifTomador: null,
        naturalezaTomador: null,
      }
    })
  }, [tipoPersona, tomadorEsTitular, setTomadorEsTitular, setDocs])

  const sectionStatus = useMemo(() => {
    const base = getStep1SectionStatus(
      { docs, titular, tomador, tomadorEsTitular, vehiculo, emissionValidation },
      tipoPersona,
      uploadWarnings,
    )
    if (isScanning) {
      return {
        identityComplete: false,
        tomadorComplete: false,
        vehicleComplete: false,
        stepComplete: false,
      }
    }
    return base
  }, [docs, titular, tomador, tomadorEsTitular, vehiculo, emissionValidation, tipoPersona, uploadWarnings, isScanning])

  const hasIdentitySectionData = () =>
    !!docs.cedula ||
    !!docs.rif ||
    !!titular.nombres?.trim() ||
    !!titular.apellidos?.trim() ||
    !!titular.documento?.trim() ||
    !!titular.razonSocial?.trim()

  const clearIdentitySection = () => {
    setDocs((prev) => ({
      ...prev,
      cedula: null,
      rif: null,
      naturaleza: null,
    }))
    setTitular((prev) => ({
      ...prev,
      nombres: '',
      apellidos: '',
      documento: '',
      razonSocial: '',
      fechaNacimiento: '',
    }))
    setOcrBaseline((prev) => ({ ...prev, titular: null }))
    setUploadWarnings((prev) => ({ ...prev, cedula: null, rif: null }))
  }

  const hasTomadorSectionData = () =>
    !!docs.cedulaTomador ||
    !!docs.rifTomador ||
    !!tomador.nombres?.trim() ||
    !!tomador.apellidos?.trim() ||
    !!tomador.documento?.trim() ||
    !!tomador.razonSocial?.trim()

  const clearTomadorSection = () => {
    setDocs((prev) => ({
      ...prev,
      cedulaTomador: null,
      rifTomador: null,
      naturalezaTomador: null,
    }))
    setTomador(EMPTY_PERSONA())
    setOcrBaseline((prev) => ({ ...prev, tomador: null }))
    setUploadWarnings((prev) => ({ ...prev, cedulaTomador: null, rifTomador: null }))
  }

  const patchTitular = (patch) => {
    setTitular((prev) => ({ ...prev, ...patch }))
  }

  const patchTomador = (patch) => {
    if (tomadorEsMismoTitular) return
    setTomador((prev) => ({ ...prev, ...patch }))
  }

  const applyTomadorEsTitular = (checked) => {
    if (checked && !puedeTomadorSerTitular) return
    setTomadorEsTitular(checked)
    if (checked) {
      setTomador({ ...titular })
      setDocs((prev) => ({
        ...prev,
        cedulaTomador: null,
        rifTomador: null,
        naturalezaTomador: null,
        tipoTomador: 'natural',
      }))
      setOcrBaseline((prev) => ({ ...prev, tomador: null }))
      setUploadWarnings((prev) => ({ ...prev, cedulaTomador: null, rifTomador: null }))
    } else {
      clearTomadorSection()
      setDocs((prev) => ({
        ...prev,
        tipoTomador: 'natural',
      }))
    }
  }

  const handleTomadorEsTitularChange = (checked) => {
    if (checked && !puedeTomadorSerTitular) return
    // Al marcar "mismo titular" con datos ya cargados → confirmar pérdida
    if (checked && !tomadorEsTitular && hasTomadorSectionData()) {
      setMismoTitularPending(true)
      return
    }
    applyTomadorEsTitular(checked)
  }

  const confirmMismoTitular = () => {
    setMismoTitularPending(false)
    applyTomadorEsTitular(true)
  }

  const cancelMismoTitular = () => setMismoTitularPending(false)

  const requestTipoPersonaChange = (next) => {
    if (next === tipoPersona) return
    if (hasIdentitySectionData()) {
      setTipoSwitchPending(next)
      return
    }
    setTipoPersona(next)
  }

  const confirmTipoPersonaSwitch = () => {
    if (!tipoSwitchPending) return
    clearIdentitySection()
    if (tipoSwitchPending === 'juridica' && tomadorEsTitular) {
      setTomadorEsTitular(false)
      clearTomadorSection()
    }
    setTipoPersona(tipoSwitchPending)
    setDocs((prev) => ({ ...prev, tipoTomador: 'natural' }))
    setTipoSwitchPending(null)
  }

  const cancelTipoPersonaSwitch = () => setTipoSwitchPending(null)

  const hasVehicleSectionData = () =>
    !!docs.carnet ||
    !!docs.certificadoOrigen ||
    !!vehiculo?.marca?.trim() ||
    !!vehiculo?.placa?.trim() ||
    !!vehiculo?.serial?.trim()

  const clearVehicleSection = () => {
    setDocs((prev) => ({ ...prev, carnet: null, certificadoOrigen: null }))
    setVehiculo((prev) => ({
      ...prev,
      marca: '',
      modelo: '',
      anio: '',
      color: '',
      placa: '',
      serial: '',
      puestos: '',
      tipo: 'Particular',
    }))
    setOcrBaseline((prev) => ({ ...prev, vehiculo: null }))
    setUploadWarnings((prev) => ({ ...prev, certificado: null, origen: null }))
  }

  const applyVehicleMode = (next0km) => {
    clearVehicleSection()
    setVehiculo((prev) => ({ ...prev, is0km: next0km }))
    setVehicleSwitchPending(null)
  }

  const requestVehicleModeChange = (next0km) => {
    if (next0km === is0km) return
    if (hasVehicleSectionData()) {
      setVehicleSwitchPending(next0km)
      return
    }
    setVehiculo((prev) => ({ ...prev, is0km: next0km }))
  }

  const confirmVehicleModeSwitch = () => {
    if (vehicleSwitchPending === null) return
    applyVehicleMode(vehicleSwitchPending)
  }

  const cancelVehicleModeSwitch = () => setVehicleSwitchPending(null)

  const hasVehicleExtractedData = !!vehiculo?.marca?.trim()

  const runEmissionValidation = useCallback(async (placaRaw, serialRaw) => {
    const placa = normalizeVehicleAscii(placaRaw ?? '')
    const serial = normalizeVehicleAscii(serialRaw ?? '')

    if (!placa || !serial) {
      setEmissionValidation({ status: 'idle', message: '', reason: '' })
      return
    }

    const seq = ++emissionValidateSeqRef.current
    setEmissionValidation({ status: 'loading', message: 'Validando vehículo para emisión…', reason: '' })

    try {
      const { valid, message, reason } = await validateEmissionAuto(placa, serial)
      if (seq !== emissionValidateSeqRef.current) return
      setEmissionValidation({
        status: valid ? 'valid' : 'invalid',
        message,
        reason: reason ?? '',
      })
    } catch (err) {
      if (seq !== emissionValidateSeqRef.current) return
      setEmissionValidation({
        status: 'error',
        message: 'No se pudo validar el vehículo para emisión',
        reason: err?.message || '',
      })
    }
  }, [setEmissionValidation])

  useEffect(() => {
    if (is0km) {
      setEmissionValidation({ status: 'idle', message: '', reason: '' })
      return undefined
    }

    const placa = vehiculo?.placa?.trim()
    const serial = vehiculo?.serial?.trim()
    if (!placa || !serial) {
      setEmissionValidation({ status: 'idle', message: '', reason: '' })
      return undefined
    }

    if (emissionValidateTimerRef.current) {
      clearTimeout(emissionValidateTimerRef.current)
    }

    emissionValidateTimerRef.current = setTimeout(() => {
      runEmissionValidation(placa, serial)
    }, 600)

    return () => {
      if (emissionValidateTimerRef.current) {
        clearTimeout(emissionValidateTimerRef.current)
      }
    }
  }, [is0km, vehiculo?.placa, vehiculo?.serial, runEmissionValidation])

  const vehicleFieldErrors = useMemo(() => {
    if (!validateTrigger) return { doc: null, data: null }
    const result = validateVehicleSection({ docs, vehiculo })
    if (result.valid) return { doc: null, data: null }

    if (is0km) {
      return {
        doc: !docs.certificadoOrigen ? 'Carga el Certificado de Origen' : null,
        data: null,
      }
    }

    if (!docs.carnet) {
      return { doc: 'Carga el Carnet de Circulación', data: null }
    }

    if (!hasVehicleExtractedData) {
      return {
        doc: null,
        data: 'Revisa y completa los datos del vehículo extraídos del carnet',
      }
    }

    return { doc: null, data: result.errors[0] ?? null }
  }, [validateTrigger, docs, vehiculo, is0km, hasVehicleExtractedData])

  const vehicleEmissionAlert =
    !is0km && (emissionValidation.status === 'invalid' || emissionValidation.status === 'error')
  const vehicleDataAlert = !!vehicleFieldErrors.data || vehicleEmissionAlert

  const identityDocError = useMemo(() => {
    if (!validateTrigger) return null
    if (tipoPersona === 'natural' && !docs.cedula) return 'Carga tu Cédula de Identidad'
    if (tipoPersona === 'juridica' && !docs.rif) return 'Carga el Registro de Información Fiscal (RIF)'
    return null
  }, [validateTrigger, tipoPersona, docs.cedula, docs.rif])

  const tomadorDocError = useMemo(() => {
    if (!validateTrigger || tomadorEsMismoTitular) return null
    if (!docs.cedulaTomador) return 'Carga la Cédula de Identidad del tomador'
    return null
  }, [validateTrigger, tomadorEsMismoTitular, docs.cedulaTomador])

  const clearDocumentBeforeUpload = (kind) => {
    setUploadWarnings((prev) => ({ ...prev, [kind]: null }))

    if (kind === 'cedula') {
      setDocs((prev) => ({ ...prev, cedula: null }))
      setTitular((prev) => ({
        ...prev,
        nombres: '',
        apellidos: '',
        documento: '',
        fechaNacimiento: '',
      }))
      setOcrBaseline((prev) => ({ ...prev, titular: null }))
    } else if (kind === 'rif') {
      setDocs((prev) => ({ ...prev, rif: null }))
      setTitular((prev) => ({
        ...prev,
        razonSocial: '',
        documento: '',
      }))
      setOcrBaseline((prev) => ({ ...prev, titular: null }))
    } else if (kind === 'cedulaTomador') {
      setDocs((prev) => ({ ...prev, cedulaTomador: null }))
      setTomador((prev) => ({
        ...prev,
        nombres: '',
        apellidos: '',
        documento: '',
        fechaNacimiento: '',
      }))
      setOcrBaseline((prev) => ({ ...prev, tomador: null }))
    } else if (kind === 'rifTomador') {
      setDocs((prev) => ({ ...prev, rifTomador: null }))
      setTomador((prev) => ({
        ...prev,
        razonSocial: '',
        documento: '',
      }))
      setOcrBaseline((prev) => ({ ...prev, tomador: null }))
    } else if (kind === 'certificado') {
      setDocs((prev) => ({ ...prev, carnet: null }))
      setVehiculo((prev) => ({
        ...prev,
        marca: '',
        modelo: '',
        anio: '',
        color: '',
        placa: '',
        serial: '',
        tipo: 'AUTOMOVIL',
        puestos: '',
      }))
      setOcrBaseline((prev) => ({ ...prev, vehiculo: null }))
    } else if (kind === 'origen') {
      setDocs((prev) => ({ ...prev, certificadoOrigen: null }))
    }
  }

  const handleFileSelect = async (kind, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    clearDocumentBeforeUpload(kind)

    if (kind === 'origen') {
      setDocs((prev) => ({ ...prev, certificadoOrigen: file }))
      toast.success('Certificado de origen cargado correctamente', { title: 'Documento recibido' })
      e.target.value = ''
      return
    }

    setScanning(prev => ({ ...prev, [kind]: true }))
    toast.info(`Extrayendo datos con OCR de ${kind}…`, { title: 'Análisis IA en curso' })

    try {
      const base64 = await readFileAsBase64(file)
      const ocrDocType =
        kind === 'cedulaTomador' ? 'cedula'
          : kind === 'rifTomador' ? 'rif'
            : kind
      const ocrResult = await extractDocumentOcr(base64, ocrDocType)
      
      if (kind === 'cedula') {
        const data = ocrResult
        const snapshot = {
          nombres: normalizePersonName(data.nombre || ''),
          apellidos: normalizePersonName(data.apellido || ''),
          documento: normalizeDocumentoFromOcr(data.identificacion || '', 'cedula', data.tipoDoc),
          fechaNacimiento: data.fechaNacimiento || '',
        }
        setDocs(prev => ({ ...prev, cedula: file, naturaleza: 'natural' }))
        setTitular(prev => ({ ...prev, ...snapshot }))
        setOcrBaseline(prev => ({ ...prev, titular: snapshot }))
        toast.success('Cédula procesada · Datos extraídos', { title: 'OCR completado' })
      } else if (kind === 'rif') {
        const data = ocrResult
        const snapshot = {
          razonSocial: normalizeRazonSocial(data.razonSocial || ''),
          documento: normalizeDocumentoFromOcr(data.rif || '', 'rif'),
        }
        setDocs(prev => ({ ...prev, rif: file, naturaleza: 'juridica' }))
        setTitular(prev => ({ ...prev, ...snapshot }))
        setOcrBaseline(prev => ({ ...prev, titular: snapshot }))
        toast.success('RIF procesado · Persona Jurídica detectada', { title: 'OCR completado' })
      } else if (kind === 'cedulaTomador') {
        const data = ocrResult
        const snapshot = {
          nombres: normalizePersonName(data.nombre || ''),
          apellidos: normalizePersonName(data.apellido || ''),
          documento: normalizeDocumentoFromOcr(data.identificacion || '', 'cedula', data.tipoDoc),
          fechaNacimiento: data.fechaNacimiento || '',
        }
        setDocs(prev => ({ ...prev, cedulaTomador: file, naturalezaTomador: 'natural' }))
        setTomador(prev => ({ ...prev, ...snapshot }))
        setOcrBaseline(prev => ({ ...prev, tomador: snapshot }))
        toast.success('Cédula del tomador procesada', { title: 'OCR completado' })
      } else if (kind === 'rifTomador') {
        const data = ocrResult
        const snapshot = {
          razonSocial: normalizeRazonSocial(data.razonSocial || ''),
          documento: normalizeDocumentoFromOcr(data.rif || '', 'rif'),
        }
        setDocs(prev => ({ ...prev, rifTomador: file, naturalezaTomador: 'juridica' }))
        setTomador(prev => ({ ...prev, ...snapshot }))
        setOcrBaseline(prev => ({ ...prev, tomador: snapshot }))
        toast.success('RIF del tomador procesado', { title: 'OCR completado' })
      } else if (kind === 'certificado') {
        const data = ocrResult
        const snapshot = {
          marca: normalizeVehicleAscii(data.marca || ''),
          modelo: normalizeVehicleModelo(data.modelo || ''),
          serial: normalizeVehicleAscii(data.serial || '').slice(0, 30),
          placa: normalizeVehicleAscii(data.placa || '').slice(0, 7),
          color: normalizeVehicleAscii(data.color || ''),
          anio: normalizeVehicleAnio(String(data.anio || '')),
        }
        setDocs(prev => ({ ...prev, carnet: file }))
        setVehiculo(prev => ({
          ...prev,
          ...snapshot,
          tipo: data.tipo || 'AUTOMOVIL',
          puestos: data.puestos || '5',
        }))
        setOcrBaseline(prev => ({ ...prev, vehiculo: snapshot }))
        toast.success(`Carnet procesado · ${data.marca} ${data.modelo} ${data.anio}`, {
          title: 'OCR completado',
        })
      }
    } catch (err) {
      if (err instanceof OcrDocumentInvalidError) {
        setUploadWarnings(prev => ({ ...prev, [kind]: err.message }))
        toast.warning(err.message, { title: 'Documento no válido' })
      } else {
        console.error(err)
        toast.error(err.message, { title: 'Error en OCR' })
      }
    } finally {
      setScanning(prev => ({ ...prev, [kind]: false }))
      e.target.value = '' // Reset
    }
  }


  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 lg:space-y-8">
      
      {/* Encabezado Principal */}
      {/* <div className="text-center space-y-1 mb-4 px-4">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 text-primary mb-1 shadow-inner">
          <Icon name="document_scanner" className="text-[22px]" filled />
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold text-on-surface tracking-tight">
          Recepción de Documentos
        </h2>
        <p className="text-sm text-on-surface-variant max-w-2xl mx-auto leading-snug">
          Carga tus documentos y nuestra IA extraerá toda la información al instante.
        </p>
      </div> */}

      {/* BLOQUE 1: IDENTIDAD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/40 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <SectionStepBadge number={1} complete={sectionStatus.identityComplete} />
          <div>
            <h3 className="text-headline-sm font-bold text-on-surface">Identidad del Titular</h3>
            <p className="text-sm text-on-surface-variant">Carga el documento, revisa los datos extraídos y completa tu contacto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-6 lg:gap-10 relative z-10 items-stretch">
          <div className="flex flex-col gap-6 h-full min-h-0">
            {/* Tipo de Persona Selector */}
            <div className="flex bg-surface-container/50 p-1.5 rounded-xl w-max shrink-0">
              <button
                type="button"
                onClick={() => requestTipoPersonaChange('natural')}
                className={clsx(
                  'relative px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300',
                  tipoPersona === 'natural'
                    ? 'text-primary shadow-sm bg-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                Persona Natural
              </button>
              <button
                type="button"
                onClick={() => requestTipoPersonaChange('juridica')}
                className={clsx(
                  'relative px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300',
                  tipoPersona === 'juridica'
                    ? 'text-primary shadow-sm bg-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                Persona Jurídica
              </button>
            </div>

            {tipoPersona === 'natural' ? (
              <UploadCard
                fill
                requiredError={identityDocError}
                icon="badge"
                title="Cédula de Identidad"
                subtitle="Formato V- o E-"
                done={!!docs.cedula}
                file={docs.cedula}
                loading={scanning['cedula']}
                warning={uploadWarnings.cedula}
                onFile={(e) => handleFileSelect('cedula', e)}
              />
            ) : (
              <UploadCard
                fill
                requiredError={identityDocError}
                icon="domain"
                title="Registro de Información Fiscal"
                subtitle="Formato J, G o C"
                done={!!docs.rif}
                file={docs.rif}
                loading={scanning['rif']}
                warning={uploadWarnings.rif}
                onFile={(e) => handleFileSelect('rif', e)}
              />
            )}
          </div>
          
          <div className="flex flex-col space-y-4 min-w-0">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
              <Icon name="auto_awesome" className="text-[14px]" filled /> Datos Principales
            </h4>
            <div className="bg-surface-container/20 p-5 sm:p-6 rounded-2xl border border-outline-variant/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ValidatedField
                validateTrigger={validateTrigger}
                className="sm:col-span-1"
                fieldType="documento"
                documentMode={tipoPersona === 'natural' ? 'cedula' : 'rif'}
                label={tipoPersona === 'natural' ? 'Documento Identidad' : 'RIF'}
                value={titular.documento}
                onChange={(v) => patchTitular({ documento: v })}
                edited={isOcrFieldEdited(ocrBaseline.titular, 'documento', titular.documento)}
                mono
              />
              {tipoPersona === 'natural' ? (
                <>
                  <ValidatedField
                    validateTrigger={validateTrigger}
                    fieldType="personName"
                    label="Nombres"
                    value={titular.nombres}
                    onChange={(v) => patchTitular({ nombres: v })}
                    edited={isOcrFieldEdited(ocrBaseline.titular, 'nombres', titular.nombres)}
                  />
                  <ValidatedField
                    validateTrigger={validateTrigger}
                    fieldType="personName"
                    label="Apellidos"
                    value={titular.apellidos}
                    onChange={(v) => patchTitular({ apellidos: v })}
                    edited={isOcrFieldEdited(ocrBaseline.titular, 'apellidos', titular.apellidos)}
                  />
                  <ValidatedField
                    validateTrigger={validateTrigger}
                    className="sm:col-span-2 lg:col-span-1"
                    fieldType="birthDate"
                    label="Fecha de Nacimiento"
                    value={titular.fechaNacimiento}
                    onChange={(v) => patchTitular({ fechaNacimiento: v })}
                    edited={isOcrFieldEdited(ocrBaseline.titular, 'fechaNacimiento', titular.fechaNacimiento)}
                  />
                </>
              ) : (
                <ValidatedField
                  validateTrigger={validateTrigger}
                  className="sm:col-span-1"
                  fieldType="razonSocial"
                  label="Razón Social"
                  value={titular.razonSocial}
                  onChange={(v) => patchTitular({ razonSocial: v })}
                  edited={isOcrFieldEdited(ocrBaseline.titular, 'razonSocial', titular.razonSocial)}
                />
              )}
            </div>

            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2 pt-2">
              <Icon name="contact_mail" className="text-[14px]" filled /> Datos de Contacto
            </h4>
            <div className="bg-surface-container/20 p-5 sm:p-6 rounded-2xl border border-outline-variant/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ValidatedField
                validateTrigger={validateTrigger}
                fieldType="email"
                label="Correo Electrónico"
                value={titular.email}
                onChange={(v) => patchTitular({ email: v })}
              />
              <ValidatedField
                validateTrigger={validateTrigger}
                fieldType="phoneVe"
                label="Teléfono Móvil"
                value={titular.telefono}
                onChange={(v) => patchTitular({ telefono: v })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: TOMADOR */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/40 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <SectionStepBadge number={2} complete={sectionStatus.tomadorComplete} />
          <div className="flex-1 min-w-0">
            <h3 className="text-headline-sm font-bold text-on-surface">Datos del Tomador</h3>
            <p className="text-sm text-on-surface-variant">
              Quien contrata la póliza (persona natural).
              {puedeTomadorSerTitular
                ? ' Puede ser la misma persona que el titular.'
                : ' Si el titular es persona jurídica, debe cargarse el tomador.'}
            </p>
          </div>
        </div>

        {puedeTomadorSerTitular && (
          <label
            className={clsx(
              'relative z-10 flex items-center gap-4 cursor-pointer group p-4 rounded-2xl border transition-all mb-6 focus-within:ring-2 focus-within:ring-primary/20',
              tomadorEsMismoTitular
                ? 'bg-primary-fixed/30 border-primary/35'
                : 'bg-white border-outline-variant/40 hover:bg-surface-container/20 hover:border-outline-variant/60',
            )}
          >
            <div className="relative flex shrink-0 items-center justify-center">
              <input
                type="checkbox"
                className="sr-only"
                checked={tomadorEsMismoTitular}
                onChange={(e) => handleTomadorEsTitularChange(e.target.checked)}
              />
              <div
                className={clsx(
                  'flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200',
                  tomadorEsMismoTitular
                    ? 'border-2 border-primary bg-primary shadow-sm'
                    : 'border-2 border-outline-variant/55 bg-white group-hover:border-primary/35',
                )}
                aria-hidden
              >
                <Icon
                  name="check"
                  className={clsx(
                    'text-[14px] text-white transition-all duration-200',
                    tomadorEsMismoTitular ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
                  )}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-on-surface text-sm block">
                Mismo Titular
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5 italic">
                {!tomadorEsMismoTitular ? 'Marque esta opción si el tomador es el mismo titular.' : ''}
              </span>
            </div>
          </label>
        )}

        {!tomadorEsMismoTitular && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-6 lg:gap-10 relative z-10 items-stretch">
            <div className="flex flex-col gap-6 h-full min-h-0">
              <UploadCard
                fill
                requiredError={tomadorDocError}
                icon="badge"
                title="Cédula de Identidad"
                subtitle="Formato V- o E-"
                done={!!docs.cedulaTomador}
                file={docs.cedulaTomador}
                loading={scanning.cedulaTomador}
                warning={uploadWarnings.cedulaTomador}
                onFile={(e) => handleFileSelect('cedulaTomador', e)}
              />
            </div>

            <div className="flex flex-col space-y-4 min-w-0">
              <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                <Icon name="auto_awesome" className="text-[14px]" filled /> Datos Principales
              </h4>
              <div className="bg-surface-container/20 p-5 sm:p-6 rounded-2xl border border-outline-variant/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ValidatedField
                  validateTrigger={validateTrigger}
                  fieldType="documento"
                  documentMode="cedula"
                  label="Documento Identidad"
                  value={tomador.documento}
                  onChange={(v) => patchTomador({ documento: v })}
                  edited={isOcrFieldEdited(ocrBaseline.tomador, 'documento', tomador.documento)}
                  mono
                />
                <ValidatedField
                  validateTrigger={validateTrigger}
                  fieldType="personName"
                  label="Nombres"
                  value={tomador.nombres}
                  onChange={(v) => patchTomador({ nombres: v })}
                  edited={isOcrFieldEdited(ocrBaseline.tomador, 'nombres', tomador.nombres)}
                />
                <ValidatedField
                  validateTrigger={validateTrigger}
                  fieldType="personName"
                  label="Apellidos"
                  value={tomador.apellidos}
                  onChange={(v) => patchTomador({ apellidos: v })}
                  edited={isOcrFieldEdited(ocrBaseline.tomador, 'apellidos', tomador.apellidos)}
                />
                <ValidatedField
                  validateTrigger={validateTrigger}
                  className="sm:col-span-2 lg:col-span-1"
                  fieldType="birthDate"
                  label="Fecha de Nacimiento"
                  value={tomador.fechaNacimiento}
                  onChange={(v) => patchTomador({ fechaNacimiento: v })}
                  edited={isOcrFieldEdited(ocrBaseline.tomador, 'fechaNacimiento', tomador.fechaNacimiento)}
                />
              </div>

              <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2 pt-2">
                <Icon name="contact_mail" className="text-[14px]" filled /> Datos de Contacto
              </h4>
              <div className="bg-surface-container/20 p-5 sm:p-6 rounded-2xl border border-outline-variant/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ValidatedField
                  validateTrigger={validateTrigger}
                  fieldType="email"
                  label="Correo Electrónico"
                  value={tomador.email}
                  onChange={(v) => patchTomador({ email: v })}
                />
                <ValidatedField
                  validateTrigger={validateTrigger}
                  fieldType="phoneVe"
                  label="Teléfono Móvil"
                  value={tomador.telefono}
                  onChange={(v) => patchTomador({ telefono: v })}
                />
              </div>
            </div>
          </div>
        )}

        {tomadorEsMismoTitular && (
          <p className="relative z-10 text-sm text-on-surface-variant bg-surface-container/30 rounded-xl px-4 py-3 border border-outline-variant/30 italic">
            Se usarán los mismos datos del titular para el tomador de la póliza.
          </p>
        )}
      </div>

      <Modal
        open={!!tipoSwitchPending}
        onClose={cancelTipoPersonaSwitch}
        title="¿Cambiar tipo de persona?"
        subtitle="Al hacer el cambio se perderán los datos cargados."
        icon="swap_horiz"
        footer={
          <>
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={cancelTipoPersonaSwitch}>
              Cancelar
            </button>
            <button type="button" className="btn-primary w-full sm:w-auto" onClick={confirmTipoPersonaSwitch}>
              Sí, cambiar
            </button>
          </>
        }
      />

      <Modal
        open={mismoTitularPending}
        onClose={cancelMismoTitular}
        title="¿Usar los datos del titular?"
        subtitle="Al hacerlo se perderán los datos del tomador ya cargados."
        icon="warning"
        footer={
          <>
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={cancelMismoTitular}>
              Cancelar
            </button>
            <button type="button" className="btn-primary w-full sm:w-auto" onClick={confirmMismoTitular}>
              Sí, continuar
            </button>
          </>
        }
      />

      <Modal
        open={vehicleSwitchPending !== null}
        onClose={cancelVehicleModeSwitch}
        title={vehicleSwitchPending ? '¿Cambiar a vehículo 0km?' : '¿Cambiar a vehículo usado?'}
        subtitle="Al hacer el cambio se perderán los datos cargados del vehículo."
        icon="swap_horiz"
        footer={
          <>
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={cancelVehicleModeSwitch}>
              Cancelar
            </button>
            <button type="button" className="btn-primary w-full sm:w-auto" onClick={confirmVehicleModeSwitch}>
              Sí, cambiar
            </button>
          </>
        }
      />

      {/* BLOQUE 2: VEHÍCULO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/40 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <SectionStepBadge number={3} complete={sectionStatus.vehicleComplete} />
          <div>
            <h3 className="text-headline-sm font-bold text-on-surface">Datos del Vehículo</h3>
            <p className="text-sm text-on-surface-variant">
              {is0km
                ? 'Carga el certificado de origen de tu vehículo nuevo'
                : 'Carga el carnet de circulación y revisa los datos extraídos'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-6 lg:gap-10 relative z-10 items-stretch">
          <div className="flex flex-col gap-6 h-full min-h-0">
            <label
              className={clsx(
                'flex items-center gap-4 cursor-pointer group p-4 rounded-2xl border transition-all shrink-0 focus-within:ring-2 focus-within:ring-primary/20',
                is0km
                  ? 'bg-primary-fixed/30 border-primary/35'
                  : 'bg-white border-outline-variant/40 hover:bg-surface-container/20 hover:border-outline-variant/60',
              )}
            >
              <div className="relative flex shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={is0km}
                  onChange={(e) => requestVehicleModeChange(e.target.checked)}
                />
                <div
                  className={clsx(
                    'flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200',
                    is0km
                      ? 'border-2 border-primary bg-primary shadow-sm'
                      : 'border-2 border-outline-variant/55 bg-white group-hover:border-primary/35',
                  )}
                  aria-hidden
                >
                  <Icon
                    name="check"
                    className={clsx(
                      'text-[14px] text-white transition-all duration-200',
                      is0km ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
                    )}
                  />
                </div>
              </div>
              <div className="flex-1">
                <span className="font-bold text-on-surface text-sm block">Vehículo Nuevo (0 km)</span>
                <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5 italic">
                  Si el vehículo es nuevo, selecciona esta opción.
                </span>
              </div>
            </label>

            {is0km ? (
              <UploadCard
                fill
                requiredError={vehicleFieldErrors.doc}
                icon="workspace_premium"
                title="Certificado de Origen"
                subtitle="PDF o imagen del documento"
                done={!!docs.certificadoOrigen}
                file={docs.certificadoOrigen}
                loading={scanning['origen']}
                warning={uploadWarnings.origen}
                ocrVerified={false}
                onFile={(e) => handleFileSelect('origen', e)}
              />
            ) : (
              <UploadCard
                fill
                requiredError={vehicleFieldErrors.doc}
                icon="directions_car"
                title="Carnet de Circulación"
                subtitle="Sube una foto clara del documento"
                done={!!docs.carnet}
                file={docs.carnet}
                loading={scanning['certificado']}
                warning={uploadWarnings.certificado}
                onFile={(e) => handleFileSelect('certificado', e)}
              />
            )}
          </div>

          <div className="flex flex-col space-y-4 min-w-0 h-full flex-1">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
              <Icon name="auto_awesome" className="text-[14px]" filled /> Datos del Vehículo
            </h4>
            <div
              className={clsx(
                'flex-1 flex flex-col rounded-2xl border p-5 sm:p-6 min-h-[200px]',
                vehicleDataAlert
                  ? 'bg-error/5 border-error border-solid'
                  : 'bg-surface-container/20 border-outline-variant/30',
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 content-start">
                <ValidatedField
                  fieldType="vehicleAscii"
                  label="Marca"
                  value={vehiculo.marca}
                  onChange={(v) => setVehiculo((prev) => ({ ...prev, marca: v }))}
                  placeholder="Ej. TOYOTA"
                  validateTrigger={validateTrigger}
                  required={!is0km}
                  edited={isOcrFieldEdited(ocrBaseline.vehiculo, 'marca', vehiculo.marca)}
                />
                <ValidatedField
                  fieldType="vehicleModelo"
                  label="Modelo"
                  value={vehiculo.modelo}
                  onChange={(v) => setVehiculo((prev) => ({ ...prev, modelo: v }))}
                  placeholder="Ej. HFC1037KF1G / T6"
                  validateTrigger={validateTrigger}
                  required={!is0km}
                  edited={isOcrFieldEdited(ocrBaseline.vehiculo, 'modelo', vehiculo.modelo)}
                />
                <ValidatedField
                  fieldType="vehicleAscii"
                  label="Color"
                  value={vehiculo.color}
                  onChange={(v) => setVehiculo((prev) => ({ ...prev, color: v }))}
                  placeholder="Ej. PLATA"
                  validateTrigger={validateTrigger}
                  required={!is0km}
                  edited={isOcrFieldEdited(ocrBaseline.vehiculo, 'color', vehiculo.color)}
                />
                <ValidatedField
                  fieldType="vehicleAnio"
                  label="Año"
                  value={vehiculo.anio}
                  onChange={(v) => setVehiculo((prev) => ({ ...prev, anio: v }))}
                  placeholder="Ej. 2024"
                  validateTrigger={validateTrigger}
                  required={!is0km}
                  edited={isOcrFieldEdited(ocrBaseline.vehiculo, 'anio', vehiculo.anio)}
                />
                <ValidatedField
                  fieldType="vehicleAscii"
                  label="Placa"
                  value={vehiculo.placa}
                  onChange={(v) => setVehiculo((prev) => ({ ...prev, placa: v }))}
                  placeholder="Ej. AB123CD"
                  mono
                  maxLength={7}
                  validateTrigger={validateTrigger}
                  required={!is0km}
                  edited={isOcrFieldEdited(ocrBaseline.vehiculo, 'placa', vehiculo.placa)}
                />
                <ValidatedField
                  fieldType="vehicleAscii"
                  label="Serial"
                  value={vehiculo.serial}
                  onChange={(v) => setVehiculo((prev) => ({ ...prev, serial: v }))}
                  placeholder="Serial de carrocería"
                  mono
                  maxLength={30}
                  validateTrigger={validateTrigger}
                  required={!is0km}
                  edited={isOcrFieldEdited(ocrBaseline.vehiculo, 'serial', vehiculo.serial)}
                />
              </div>

              {!is0km && emissionValidation.status !== 'idle' && (
                <EmissionValidationStatus validation={emissionValidation} />
              )}

              {vehicleFieldErrors.data && (
                <p className="mt-3 text-xs text-error leading-snug" role="alert">
                  {vehicleFieldErrors.data}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmissionValidationStatus({ validation }) {
  const { status, message, reason } = validation
  const isAlert = status === 'invalid' || status === 'error'
  const detail = (reason || '').trim()
  const summary = (message || '').trim()
  const showDetail = isAlert && detail && detail !== summary

  const tone = {
    loading: { icon: 'progress_activity', className: 'text-on-surface-variant', spin: true },
    valid: { icon: 'check_circle', className: 'text-success', spin: false },
    invalid: { icon: 'info', className: 'text-error', spin: false },
    error: { icon: 'info', className: 'text-amber-700', spin: false },
  }[status] ?? { icon: 'info', className: 'text-on-surface-variant', spin: false }

  return (
    <div
      className={clsx(
        'mt-3 flex max-w-full flex-col items-center gap-1 self-center px-2 text-center',
        tone.className,
      )}
      role={isAlert ? 'alert' : 'status'}
    >
      <div className="inline-flex max-w-full items-center justify-center gap-2 text-sm leading-snug">
        <Icon
          name={tone.icon}
          className={clsx('text-[18px] shrink-0', tone.spin && 'animate-spin')}
          filled={status === 'valid' || isAlert}
        />
        <span>{summary}</span>
      </div>
      {showDetail && (
        <p className="max-w-md text-xs leading-snug opacity-90 italic">{detail}</p>
      )}
    </div>
  )
}

function SectionStepBadge({ number, complete }) {
  return (
    <div
      className={clsx(
        'w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg transition-all duration-300 shrink-0',
        complete
          ? 'bg-gradient-to-br from-success to-emerald-600'
          : 'bg-gradient-to-br from-accent to-accent-600',
      )}
      aria-label={complete ? `Paso ${number} completado` : `Paso ${number} pendiente`}
    >
      {complete ? (
        <Icon name="check" className="text-[22px]" />
      ) : (
        <span className="font-bold text-lg">{number}</span>
      )}
    </div>
  )
}

function DocumentPreviewImage({ src, alt, loading, maxHeight = 200 }) {
  const [isTall, setIsTall] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    setIsTall(false)
    setLightboxOpen(false)
  }, [src])

  const handleLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target
    setIsTall(naturalHeight > naturalWidth * 1.05)
  }

  const documentTitle = alt?.replace(/^Vista previa — /, '') ?? 'Documento'

  const openLightbox = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLightboxOpen(true)
  }

  const stopPointer = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      <div
        className="relative w-full overflow-hidden bg-surface-container/20"
        style={isTall ? { height: maxHeight, maxHeight } : undefined}
      >
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={clsx(
            'w-full bg-surface-container/20 transition-opacity',
            isTall ? 'h-full object-cover object-center' : 'max-h-[180px] object-contain',
            loading && 'opacity-60'
          )}
        />
        {isTall && (
          <div
            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-[1]"
            style={{ background: 'linear-gradient(to top, rgb(255 255 255) 0%, rgb(255 255 255 / 0.85) 35%, transparent 100%)' }}
            aria-hidden
          />
        )}
        <div className="absolute inset-x-0 bottom-2 flex justify-center z-[2]">
          <button
            type="button"
            onClick={openLightbox}
            onMouseDown={stopPointer}
            className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-primary bg-white/95 px-3.5 py-2 rounded-full border border-primary/20 shadow-sm hover:bg-primary hover:text-white hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
            aria-label={`Ver imagen completa de ${documentTitle}`}
          >
            <Icon name="zoom_in" className="text-[14px]" />
            Vista previa
          </button>
        </div>
      </div>

      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title="Vista Previa"
        icon="image"
        size="md"
        headerSize="compact"
      >
        <div className="flex items-center justify-center bg-surface-container/20 rounded-xl p-2 sm:p-4">
          <img
            src={src}
            alt={alt}
            className="w-full max-h-[min(70dvh,720px)] object-contain rounded-lg"
          />
        </div>
      </Modal>
    </>
  )
}

function UploadCard({ icon, title, subtitle, done, loading, warning, file, onFile, ocrVerified = true, fill = false, requiredError = null }) {
  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const galleryInputId = useId()
  const cameraInputId = useId()
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!file?.type?.startsWith('image/')) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const hasFile = !!file
  const showPreview = hasFile

  const openGallery = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!loading) galleryInputRef.current?.click()
  }

  const openCamera = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!loading) cameraInputRef.current?.click()
  }

  const cardClassName = clsx(
    'relative overflow-hidden rounded-2xl border-2 transition-all duration-300 text-left flex flex-col items-center justify-center gap-3 p-4 w-full',
    fill && !showPreview && 'flex-1 min-h-[180px]',
    !fill && !showPreview && 'min-h-[180px]',
    showPreview && 'active:scale-[0.99]',
    done
      ? 'border-success bg-success-container/10'
      : warning
      ? 'border-amber-400 bg-amber-50/50'
      : requiredError && !hasFile
      ? 'border-error bg-error/5 border-solid'
      : loading
      ? 'border-primary/40 bg-primary/5'
      : hasFile
      ? 'border-success/60 bg-success-container/5'
      : 'border-dashed border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container/30 hover:shadow-sm'
  )

  const fileInputs = (
    <>
      <input
        id={cameraInputId}
        ref={cameraInputRef}
        type="file"
        className="sr-only"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        disabled={loading}
      />
      <input
        id={galleryInputId}
        ref={galleryInputRef}
        type="file"
        className="sr-only"
        accept="image/*,application/pdf"
        onChange={onFile}
        disabled={loading}
      />
    </>
  )

  const cardContent = (
    <>
      {loading && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
          <div className="w-full h-1 bg-primary/80 shadow-[0_0_15px_3px_rgba(15,26,90,0.5)] absolute top-0 left-0 animate-scanner" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent animate-pulse opacity-50" />
        </div>
      )}

      {showPreview ? (
        <div className={clsx('w-full flex flex-col items-center gap-2 relative z-10', fill && !previewUrl && 'flex-1 justify-center min-h-0')}>
          <div className="relative w-full rounded-xl overflow-hidden border border-outline-variant/30 bg-white shadow-sm">
            {previewUrl ? (
              <DocumentPreviewImage
                src={previewUrl}
                alt={`Vista previa — ${title}`}
                loading={loading}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-on-surface-variant">
                <Icon name="picture_as_pdf" className="text-[44px] text-primary/70" />
                <p className="text-xs mt-2 font-medium truncate max-w-full">{file.name}</p>
              </div>
            )}
            {done && !loading && (
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-success text-white flex items-center justify-center shadow-md pointer-events-none">
                <Icon name="check" className="text-[18px]" />
              </div>
            )}
          </div>
          {!loading && (
            <>
              <p className="text-label-md font-bold text-success">Documento cargado</p>
              {ocrVerified && <p className="text-xs text-success/80">Verificado por IA</p>}
              <ReuploadBar onCamera={openCamera} onGallery={openGallery} />
            </>
          )}
          {loading && (
            <p className="text-label-md font-bold text-primary animate-pulse">Extrayendo datos…</p>
          )}
        </div>
      ) : (
        <>
          <div
            className={clsx(
              'w-16 h-16 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 relative z-10',
              warning
                ? 'bg-amber-100 text-amber-700 shadow-md'
                : loading
                ? 'bg-white text-primary shadow-lg'
                : 'bg-surface-variant/50 text-on-surface-variant'
            )}
          >
            <Icon
              name={warning ? 'warning' : icon}
              className={clsx('text-[32px] transition-transform duration-300', loading && 'animate-pulse scale-110')}
            />
            {loading && (
              <svg className="absolute inset-0 w-full h-full text-primary animate-spin" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="80 200" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <div className="text-center w-full relative z-10 mt-1">
            <p className={clsx('text-label-lg font-bold truncate transition-colors mb-1', warning ? 'text-amber-700' : 'text-on-surface')}>
              {warning ? 'Reintenta la carga' : loading ? 'Extrayendo Datos...' : title}
            </p>
            <p className={clsx('text-xs px-2 truncate', warning ? 'text-amber-700/90' : 'text-on-surface-variant/80')}>
              {warning ? 'Documento poco legible' : loading ? 'Por favor espera unos segundos' : subtitle}
            </p>
          </div>

          {!loading && (
            <div className="relative z-10 flex flex-col xs:flex-row gap-2 w-full max-w-[260px] mt-1">
              <button
                type="button"
                onClick={openCamera}
                className="btn-accent flex-1 min-h-[44px]"
              >
                <Icon name="photo_camera" /> Cámara
              </button>
              <button
                type="button"
                onClick={openGallery}
                className="btn-primary flex-1 min-h-[44px]"
              >
                <Icon name="photo_library" /> Galería
              </button>
            </div>
          )}
        </>
      )}
    </>
  )

  return (
    <div className={clsx('space-y-2', fill && 'flex flex-1 flex-col min-h-0 h-full')}>
      <div className={clsx(cardClassName, fill && 'flex-1 min-h-[180px]')}>
        {cardContent}
      </div>

      {fileInputs}

      {warning && !hasFile && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-snug">
          {warning}
        </p>
      )}

      {requiredError && !hasFile && !warning && (
        <p className="text-xs text-error leading-snug" role="alert">
          {requiredError}
        </p>
      )}
    </div>
  )
}

function ReuploadBar({ onCamera, onGallery }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="mt-2 -mx-4 -mb-4 w-[calc(100%+2rem)] border-t border-outline-variant/25 overflow-hidden rounded-b-[14px]"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        className={clsx(
          'grid transition-all duration-200',
          expanded ? 'grid-cols-2 divide-x divide-outline-variant/25' : 'grid-cols-1',
        )}
      >
        {expanded ? (
          <>
            <button
              type="button"
              onClick={onCamera}
              className="group/opt w-full min-h-[44px] px-3 py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-primary bg-transparent transition-all duration-200 hover:bg-primary/[0.07] active:bg-primary/[0.12]"
            >
              <Icon
                name="photo_camera"
                className="text-[16px] transition-transform duration-200 group-hover/opt:-translate-y-0.5"
              />
              Cámara
            </button>
            <button
              type="button"
              onClick={onGallery}
              className="group/opt w-full min-h-[44px] px-3 py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-primary bg-transparent transition-all duration-200 hover:bg-primary/[0.07] active:bg-primary/[0.12]"
            >
              <Icon
                name="upload"
                className="text-[16px] transition-transform duration-200 group-hover/opt:-translate-y-0.5"
              />
              Archivo
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="group/reupload w-full min-h-[44px] px-4 py-3 flex items-center justify-center gap-1.5 text-xs font-bold text-primary bg-transparent transition-all duration-200 hover:bg-primary/[0.07] active:bg-primary/[0.12] active:scale-[0.995]"
          >
            <Icon
              name="upload"
              className="text-[16px] transition-transform duration-200 group-hover/reupload:-translate-y-0.5"
            />
            Cargar nuevamente
          </button>
        )}
      </div>
    </div>
  )
}

function Tip({ text }) {
  return (
    <li className="flex gap-2 bg-white/5 p-2.5 rounded-lg border border-white/10">
      <Icon name="check_circle" className="text-accent-300 mt-0.5 shrink-0" filled />
      <span className="text-caption opacity-90 leading-snug">{text}</span>
    </li>
  )
}

function CheckItem({ done, label }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon
        name={done ? 'check_circle' : 'radio_button_unchecked'}
        className={done ? 'text-success' : 'text-outline-variant'}
        filled={done}
      />
      <span className={`text-body-md ${done ? 'text-on-surface' : 'text-on-surface-variant'}`}>
        {label}
      </span>
    </div>
  )
}
