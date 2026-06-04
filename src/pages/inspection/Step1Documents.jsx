import { useState } from 'react'
import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import { useToast } from '../../context/ToastContext'
import { extractDocumentOcr } from '../../services/aiDocumentOcr'
import { readFileAsBase64 } from '../../services/aiVehicleAnalysis'

export default function Step1Documents({ state }) {
  const { docs, setDocs, tomador, setTomador, vehiculo, setVehiculo } = state
  const toast = useToast()
  // scanning is now an object tracking multiple active uploads: { cedula: true, certificado: true }
  const [scanning, setScanning] = useState({})
  const [tipoPersona, setTipoPersona] = useState('natural') // 'natural' | 'juridica'

  const handleFileSelect = async (kind, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(prev => ({ ...prev, [kind]: true }))
    toast.info(`Extrayendo datos con OCR de ${kind}…`, { title: 'Análisis IA en curso' })

    try {
      const base64 = await readFileAsBase64(file)
      const ocrResult = await extractDocumentOcr(base64, kind)
      
      if (kind === 'cedula') {
        const data = ocrResult
        setDocs(prev => ({ ...prev, cedula: file, naturaleza: 'natural' }))
        setTomador(prev => ({
          ...prev,
          nombres: data.nombre || '',
          apellidos: data.apellido || '',
          documento: data.identificacion || '',
          fechaNacimiento: data.fechaNacimiento || '',
        }))
        toast.success('Cédula procesada · Datos extraídos', { title: 'OCR completado' })
      } else if (kind === 'rif') {
        const data = ocrResult
        setDocs(prev => ({ ...prev, rif: file, naturaleza: 'juridica' }))
        setTomador(prev => ({
          ...prev,
          razonSocial: data.razonSocial || '',
          documento: data.rif || '',
        }))
        toast.success('RIF procesado · Persona Jurídica detectada', { title: 'OCR completado' })
      } else if (kind === 'certificado') {
        const data = ocrResult
        setDocs(prev => ({ ...prev, carnet: file }))
        setVehiculo(prev => ({
          ...prev,
          marca: data.marca || '',
          modelo: data.modelo || '',
          tipo: data.tipo || 'AUTOMOVIL',
          serial: data.serial || '',
          placa: data.placa || '',
          color: data.color || '',
          anio: data.anio || '',
          puestos: data.puestos || '5',
        }))
        toast.success(`Carnet procesado · ${data.marca} ${data.modelo} ${data.anio}`, {
          title: 'OCR completado',
        })
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message, { title: 'Error en OCR' })
    } finally {
      setScanning(prev => ({ ...prev, [kind]: false }))
      e.target.value = '' // Reset
    }
  }

  const isPersonaNatural = docs.naturaleza === 'natural' || tipoPersona === 'natural'


  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      
      {/* Encabezado Principal */}
      <div className="text-center space-y-2 mb-8 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2 shadow-inner">
          <Icon name="document_scanner" className="text-[32px]" filled />
        </div>
        <h2 className="text-[28px] sm:text-[32px] font-bold text-on-surface tracking-tight">
          Recepción de Documentos
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Carga tus documentos y nuestra IA extraerá toda la información al instante.
        </p>
      </div>

      {/* BLOQUE 1: IDENTIDAD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/40 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 text-white flex items-center justify-center shadow-lg">
            <span className="font-bold text-lg">1</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-bold text-on-surface">Identidad del Titular</h3>
            <p className="text-sm text-on-surface-variant">Selecciona el tipo de persona y sube el documento</p>
          </div>
        </div>

        {/* Tipo de Persona Selector */}
        <div className="flex bg-surface-container/50 p-1.5 rounded-xl w-max mb-6 relative z-10">
          <button
            onClick={() => setTipoPersona('natural')}
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
            onClick={() => setTipoPersona('juridica')}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {tipoPersona === 'natural' ? (
            <UploadCard
              icon="badge"
              title="Cédula de Identidad"
              subtitle="Formato V- o E-"
              done={!!docs.cedula}
              loading={scanning['cedula']}
              onFile={(e) => handleFileSelect('cedula', e)}
            />
          ) : (
            <UploadCard
              icon="domain"
              title="Registro de Información Fiscal"
              subtitle="Formato J, G o C"
              done={!!docs.rif}
              loading={scanning['rif']}
              onFile={(e) => handleFileSelect('rif', e)}
            />
          )}
          
          <div className="flex flex-col justify-center space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
              <Icon name="auto_awesome" className="text-[14px]" filled /> Datos Extraídos
            </h4>
            <div className="bg-surface-container/20 p-5 rounded-2xl border border-outline-variant/30 space-y-4">
              {tipoPersona === 'natural' ? (
                <>
                  <FormField label="Nombres" value={tomador.nombres} onChange={(v) => setTomador({ ...tomador, nombres: v })} />
                  <FormField label="Apellidos" value={tomador.apellidos} onChange={(v) => setTomador({ ...tomador, apellidos: v })} />
                </>
              ) : (
                <FormField label="Razón Social" value={tomador.razonSocial} onChange={(v) => setTomador({ ...tomador, razonSocial: v })} />
              )}
              <FormField label="Documento Identidad" value={tomador.documento} onChange={(v) => setTomador({ ...tomador, documento: v })} mono />
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: VEHÍCULO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/40 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center shadow-lg">
            <span className="font-bold text-lg">2</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-bold text-on-surface">Datos del Vehículo</h3>
            <p className="text-sm text-on-surface-variant">Carnet de circulación y detalles del auto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="flex flex-col gap-6">
            <UploadCard
              icon="directions_car"
              title="Carnet de Circulación"
              subtitle="Sube una foto clara del documento"
              done={!!docs.carnet}
              loading={scanning['certificado']}
              onFile={(e) => handleFileSelect('certificado', e)}
            />

            {/* Toggle 0km */}
            <label className="flex items-center gap-4 cursor-pointer group p-4 rounded-2xl bg-surface-container/30 hover:bg-surface-container/50 border border-outline-variant/30 transition-all">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={vehiculo?.is0km || false}
                  onChange={(e) => {
                    const is0km = e.target.checked
                    setVehiculo({ ...vehiculo, is0km })
                    if (!is0km) setDocs({ ...docs, certificadoOrigen: null })
                  }}
                />
                <div className="w-12 h-6 bg-surface-variant rounded-full peer peer-checked:bg-primary transition-colors duration-300 border border-outline-variant/50"></div>
                <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-6 shadow-sm"></div>
              </div>
              <div className="flex-1">
                <span className="font-bold text-on-surface text-sm block">Vehículo 0km (Nuevo)</span>
                <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">Recién salido de agencia</span>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-4 justify-center">
            {vehiculo?.marca && docs.carnet ? (
              <div className="grid grid-cols-2 gap-3 bg-primary-fixed/20 p-5 rounded-2xl border border-primary/20 animate-fade-in">
                <Field label="Marca" value={vehiculo.marca} />
                <Field label="Modelo" value={vehiculo.modelo} />
                <Field label="Año" value={vehiculo.anio} />
                <Field label="Placa" value={vehiculo.placa} mono />
                <Field label="Color" value={vehiculo.color} />
                <Field label="Serial" value={vehiculo.serial} mono />
              </div>
            ) : (
              <div className="h-full min-h-[160px] rounded-2xl border border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-center p-6 bg-surface-container/10">
                <Icon name="document_scanner" className="text-on-surface-variant/40 text-[32px] mb-2" />
                <p className="text-sm text-on-surface-variant/70">Los datos de tu vehículo<br/>aparecerán aquí automáticamente</p>
              </div>
            )}
          </div>
        </div>

        {/* Sección condicional: Certificado de Origen */}
        <div className={clsx(
          "grid transition-all duration-500 overflow-hidden",
          vehiculo?.is0km ? "grid-rows-[1fr] mt-6 opacity-100" : "grid-rows-[0fr] mt-0 opacity-0"
        )}>
          <div className="min-h-0">
            <div className="p-5 border-2 border-accent-300/30 bg-accent-50/30 rounded-2xl flex flex-col sm:flex-row gap-6 items-center">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center mb-3">
                  <Icon name="workspace_premium" className="text-accent-600 text-[24px]" filled />
                </div>
                <h4 className="font-bold text-on-surface text-lg mb-1">Certificado de Origen</h4>
                <p className="text-sm text-on-surface-variant">Requisito indispensable para asegurar tu vehículo nuevo.</p>
              </div>
              <div className="w-full sm:w-72">
                <UploadCard
                  icon="verified"
                  title="Subir Certificado"
                  subtitle="PDF o Imagen"
                  done={!!docs.certificadoOrigen}
                  loading={scanning['origen']}
                  onFile={(e) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0]
                      setDocs(prev => ({ ...prev, certificadoOrigen: file }))
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: CONTACTO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/40 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center shadow-lg">
            <span className="font-bold text-lg">3</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-bold text-on-surface">Datos de Contacto</h3>
            <p className="text-sm text-on-surface-variant">Información para enviarte tu póliza</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FormField label="Correo Electrónico" type="email" value={tomador.email} onChange={(v) => setTomador({ ...tomador, email: v })} placeholder="ejemplo@correo.com" />
          <FormField label="Teléfono Móvil" type="tel" value={tomador.telefono} onChange={(v) => setTomador({ ...tomador, telefono: v })} placeholder="0414-0000000" />
          {isPersonaNatural && (
            <FormField label="Fecha de Nacimiento" type="date" value={tomador.fechaNacimiento} onChange={(v) => setTomador({ ...tomador, fechaNacimiento: v })} />
          )}
        </div>
      </div>
    </div>
  )
}

function UploadCard({ icon, title, subtitle, done, loading, onFile }) {
  return (
    <label
      className={clsx(
        'relative overflow-hidden rounded-2xl border-2 transition-all duration-300 text-left flex flex-col items-center justify-center gap-3 p-6 cursor-pointer active:scale-[0.98] min-h-[180px] group',
        done
          ? 'border-success bg-success-container/10'
          : loading
          ? 'border-primary/40 bg-primary/5'
          : 'border-dashed border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container/30 hover:shadow-sm'
      )}
    >
      <input type="file" className="sr-only" accept="image/*,application/pdf" onChange={onFile} disabled={loading} />
      
      {/* Escáner IA Animado (Visible solo cuando carga) */}
      {loading && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="w-full h-1 bg-primary/80 shadow-[0_0_15px_3px_rgba(15,26,90,0.5)] absolute top-0 left-0 animate-scanner"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent animate-pulse opacity-50"></div>
        </div>
      )}

      <div
        className={clsx(
          'w-16 h-16 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 relative z-10',
          done 
            ? 'bg-success text-white shadow-[0_4px_12px_rgba(34,197,94,0.3)] scale-110' 
            : loading 
            ? 'bg-white text-primary shadow-lg' 
            : 'bg-surface-variant/50 text-on-surface-variant group-hover:bg-white group-hover:text-primary group-hover:shadow-md'
        )}
      >
        <Icon 
          name={done ? 'check' : icon} 
          className={clsx('text-[32px] transition-transform duration-300', loading && 'animate-pulse scale-110')} 
        />
        {/* Spinner ring if loading */}
        {loading && (
          <svg className="absolute inset-0 w-full h-full text-primary animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="80 200" strokeLinecap="round" />
          </svg>
        )}
      </div>
      
      <div className="text-center w-full relative z-10 mt-1">
        <p className={clsx('text-label-lg font-bold truncate transition-colors mb-1', done ? 'text-success' : 'text-on-surface')}>
          {done ? 'Carga Exitosa' : loading ? 'Extrayendo Datos...' : title}
        </p>
        <p className={clsx('text-xs px-2 truncate', done ? 'text-success/80' : 'text-on-surface-variant/80')}>
          {done ? 'Verificado por IA' : loading ? 'Por favor espera unos segundos' : subtitle}
        </p>
      </div>
    </label>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="label">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div className="min-w-0">
      <p className="text-caption text-on-primary-fixed-variant uppercase tracking-wider truncate">
        {label}
      </p>
      <p className={`text-on-primary-fixed font-bold truncate ${mono ? 'font-mono text-[14px]' : ''}`}>
        {value ?? '—'}
      </p>
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
