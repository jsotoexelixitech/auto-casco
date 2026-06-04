import { useState } from 'react'
import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import { useToast } from '../../context/ToastContext'
import { extractDocumentOcr } from '../../services/aiDocumentOcr'
import { readFileAsBase64 } from '../../services/aiVehicleAnalysis'

export default function Step1Documents({ state }) {
  const { docs, setDocs, tomador, setTomador, vehiculo, setVehiculo } = state
  const toast = useToast()
  const [scanning, setScanning] = useState(null)
  const [tipoPersona, setTipoPersona] = useState('natural') // 'natural' | 'juridica'

  const handleFileSelect = async (kind, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(kind)
    toast.info(`Extrayendo datos con OCR de ${kind}…`, { title: 'Análisis IA en curso' })

    try {
      const base64 = await readFileAsBase64(file)
      // Usar 'cedula' genérico para RIF también porque el provider usa los prompts, 
      // pero si es RIF pasamos el docType 'rif'
      const ocrResult = await extractDocumentOcr(base64, kind)
      
      if (kind === 'cedula') {
        const data = ocrResult
        setDocs({ ...docs, cedula: file, naturaleza: 'natural' })
        setTomador({
          ...tomador,
          nombres: data.nombre || '',
          apellidos: data.apellido || '',
          documento: data.identificacion || '',
          fechaNacimiento: data.fechaNacimiento || '',
        })
        toast.success('Cédula procesada · Datos extraídos', { title: 'OCR completado' })
      } else if (kind === 'rif') {
        const data = ocrResult
        setDocs({ ...docs, rif: file, naturaleza: 'juridica' })
        setTomador({
          ...tomador,
          razonSocial: data.razonSocial || '',
          documento: data.rif || '',
        })
        toast.success('RIF procesado · Persona Jurídica detectada', { title: 'OCR completado' })
      } else if (kind === 'certificado') {
        const data = ocrResult
        setDocs({ ...docs, carnet: file })
        setVehiculo({
          ...vehiculo,
          marca: data.marca || '',
          modelo: data.modelo || '',
          tipo: data.tipo || 'AUTOMOVIL',
          serial: data.serial || '',
          placa: data.placa || '',
          color: data.color || '',
          anio: data.anio || '',
          puestos: data.puestos || '5',
        })
        toast.success(`Carnet procesado · ${data.marca} ${data.modelo} ${data.anio}`, {
          title: 'OCR completado',
        })
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message, { title: 'Error en OCR' })
    } finally {
      setScanning(null)
      e.target.value = '' // Reset
    }
  }

  const isPersonaNatural = docs.naturaleza === 'natural' || tipoPersona === 'natural'


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Documents */}
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/50">
            <Icon name="badge" className="text-primary text-[24px]" filled />
            <h3 className="text-headline-md text-on-surface">Documento de Identidad</h3>
          </div>
          <p className="text-caption sm:text-body-md text-on-surface-variant mb-3">
            Carga la cédula o el RIF del titular. El sistema detecta si es persona
            natural (V/E) o jurídica (J/G/C).
          </p>
          {/* Segmented Control Moderno */}
          <div className="flex p-1 bg-surface-container/60 rounded-xl w-max mb-5 border border-outline-variant/30">
            <button
              onClick={() => setTipoPersona('natural')}
              className={clsx(
                'relative px-5 py-2 rounded-lg text-label-md font-bold transition-all duration-300',
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
                'relative px-5 py-2 rounded-lg text-label-md font-bold transition-all duration-300',
                tipoPersona === 'juridica'
                  ? 'text-primary shadow-sm bg-white'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              Persona Jurídica
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col">
              {tipoPersona === 'natural' ? (
                <UploadCard
                  icon="badge"
                  title="Cédula de Identidad"
                  subtitle="Formatos: JPG o PDF"
                  done={!!docs.cedula}
                  loading={scanning === 'cedula'}
                  onFile={(e) => handleFileSelect('cedula', e)}
                  extractedLabel={tomador?.documento && isPersonaNatural ? tomador.documento : null}
                />
              ) : (
                <UploadCard
                  icon="domain"
                  title="Registro de Información Fiscal"
                  subtitle="Formatos: JPG o PDF"
                  done={!!docs.rif}
                  loading={scanning === 'rif'}
                  onFile={(e) => handleFileSelect('rif', e)}
                  extractedLabel={tomador?.documento && !isPersonaNatural ? tomador.documento : null}
                />
              )}
            </div>
            
            {/* Formulario a la derecha de la carga */}
            <div className="flex flex-col justify-center gap-4 bg-surface-container/20 p-4 rounded-xl border border-outline-variant/30">
              <h4 className="text-label-md text-primary font-bold uppercase tracking-wider text-[11px] mb-1">
                Datos extraídos
              </h4>
              {tipoPersona === 'natural' ? (
                <>
                  <FormField label="Nombres" value={tomador.nombres} onChange={(v) => setTomador({ ...tomador, nombres: v })} />
                  <FormField label="Apellidos" value={tomador.apellidos} onChange={(v) => setTomador({ ...tomador, apellidos: v })} />
                </>
              ) : (
                <FormField label="Razón Social" value={tomador.razonSocial} onChange={(v) => setTomador({ ...tomador, razonSocial: v })} />
              )}
              <FormField label="Documento (Cédula/RIF)" value={tomador.documento} onChange={(v) => setTomador({ ...tomador, documento: v })} />
            </div>
          </div>

          {(docs.cedula || docs.rif) && (
            <div className="mt-3 p-3 bg-success-container/40 border border-success/30 rounded-xl flex items-start gap-2 animate-fade-in">
              <Icon name="auto_awesome" className="text-success text-[22px] mt-0.5" filled />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-success-container">Datos extraídos por OCR</p>
                <p className="text-caption text-on-success-container/80 truncate">
                  {isPersonaNatural
                    ? `${tomador.nombres} ${tomador.apellidos} · ${tomador.documento}`
                    : `${tomador.razonSocial} · ${tomador.documento}`}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/50">
            <Icon name="directions_car" className="text-primary text-[24px]" filled />
            <h3 className="text-headline-md text-on-surface">Carnet de Circulación</h3>
          </div>
          <p className="text-caption sm:text-body-md text-on-surface-variant mb-3">
            Captura placa, marca, modelo, color, año, tipo y serial del vehículo.
          </p>
          <UploadCard
            icon="article"
            title="Subir Carnet de Circulación"
            subtitle="JPG, PNG o PDF · máx 10MB"
            done={!!docs.carnet}
            loading={scanning === 'certificado'}
            onFile={(e) => handleFileSelect('certificado', e)}
            extractedLabel={
              vehiculo?.placa
                ? `${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}`
                : null
            }
          />

          {docs.carnet && vehiculo?.marca && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-primary-fixed/30 rounded-xl animate-fade-in">
              <Field label="Placa" value={vehiculo.placa} mono />
              <Field label="Marca" value={vehiculo.marca} />
              <Field label="Modelo" value={vehiculo.modelo} />
              <Field label="Año" value={vehiculo.anio} />
              <Field label="Color" value={vehiculo.color} />
              <Field label="Tipo" value={vehiculo.tipo} />
              <Field label="Puestos" value={vehiculo.puestos} />
              <Field label="Serial" value={vehiculo.serial} mono />
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-outline-variant/30">
            <label className="flex items-center gap-4 cursor-pointer group w-max p-2 rounded-xl hover:bg-surface-container/40 transition-colors">
              {/* iOS style toggle */}
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
                <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:bg-primary transition-colors duration-300"></div>
                <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5 shadow-sm"></div>
              </div>
              <div>
                <span className="font-bold text-on-surface text-label-lg group-hover:text-primary transition-colors">
                  Mi vehículo es 0km (Nuevo)
                </span>
                <p className="text-caption text-on-surface-variant mt-0.5">Habilita esta opción si el auto sale de agencia</p>
              </div>
            </label>
          </div>

          {vehiculo?.is0km && (
            <div className="mt-4 p-5 border-2 border-primary/20 bg-primary/5 rounded-2xl animate-fade-in flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon name="workspace_premium" className="text-primary text-[22px]" filled />
                </div>
                <h4 className="font-bold text-on-surface text-headline-sm mb-1">Certificado de Origen</h4>
                <p className="text-body-md text-on-surface-variant">
                  Para asegurar un vehículo 0km requerimos la carga del certificado de origen emitido por el concesionario.
                </p>
              </div>
              <div className="w-full md:w-72">
                <UploadCard
                  icon="verified"
                  title="Subir Certificado"
                  subtitle="PDF o Imagen"
                  done={!!docs.certificadoOrigen}
                  loading={scanning === 'origen'}
                  onFile={(e) => {
                    if (e.target.files?.[0]) {
                      setDocs({ ...docs, certificadoOrigen: e.target.files[0] })
                      toast.success('Certificado de Origen cargado', { title: 'Completado' })
                    }
                  }}
                  extractedLabel={docs.certificadoOrigen ? 'Documento cargado' : null}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Datos de Contacto */}
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/50">
            <Icon name="contact_mail" className="text-primary text-[24px]" filled />
            <h3 className="text-headline-md text-on-surface">Datos de Contacto</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Correo Electrónico" type="email" value={tomador.email} onChange={(v) => setTomador({ ...tomador, email: v })} placeholder="correo@ejemplo.com" />
            <FormField label="Teléfono Móvil" type="tel" value={tomador.telefono} onChange={(v) => setTomador({ ...tomador, telefono: v })} placeholder="(0414) 000-0000" />
            {isPersonaNatural && (
              <FormField label="Fecha de Nacimiento" type="date" value={tomador.fechaNacimiento} onChange={(v) => setTomador({ ...tomador, fechaNacimiento: v })} />
            )}
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="card-elev2 p-4 sm:p-5 bg-gradient-brand-soft text-on-primary relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent-500/30 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3 border-b border-white/20 pb-3">
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                <Icon name="auto_awesome" className="text-accent-300" filled />
              </div>
              <h3 className="text-headline-md">Asistente IA</h3>
            </div>
            <p className="text-body-md opacity-90 mb-3">
              La extracción OCR detecta automáticamente:
            </p>
            <ul className="space-y-2">
              <Tip text="Nº de cédula, formato V/E para personas naturales" />
              <Tip text="RIF formato J/G/C para personas jurídicas" />
              <Tip text="Placa, marca, modelo, color y serial de carrocería" />
              <Tip text="Año, tipo de vehículo (particular, rústico, moto)" />
            </ul>
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h4 className="text-headline-md text-on-surface mb-2">Checklist</h4>
          <CheckItem done={!!docs.cedula || !!docs.rif} label="Documento de identidad" />
          <CheckItem done={!!docs.carnet} label="Carnet de circulación" />
          {vehiculo?.is0km && <CheckItem done={!!docs.certificadoOrigen} label="Certificado de origen (0km)" />}
          <CheckItem done={!!tomador.email && !!tomador.telefono} label="Datos de contacto" />
        </div>
      </aside>
    </div>
  )
}

function UploadCard({ icon, title, subtitle, done, loading, onFile, extractedLabel }) {
  return (
    <label
      className={clsx(
        'relative overflow-hidden rounded-2xl border-2 transition-all text-left flex flex-col items-center justify-center gap-3 p-6 cursor-pointer active:scale-[0.98] min-h-[160px] group',
        done
          ? 'border-success bg-success-container/10 hover:bg-success-container/20'
          : loading
          ? 'border-primary/50 bg-primary/5'
          : 'border-dashed border-outline-variant/80 hover:border-primary/50 hover:bg-surface-container/50 hover:shadow-sm'
      )}
    >
      <input type="file" className="sr-only" accept="image/*,application/pdf" onChange={onFile} disabled={loading} />
      
      <div
        className={clsx(
          'w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
          done 
            ? 'bg-success text-white shadow-md scale-110' 
            : loading 
            ? 'bg-primary/20 text-primary' 
            : 'bg-surface-variant/50 text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary'
        )}
      >
        <Icon 
          name={done ? 'check' : loading ? 'hourglass_empty' : icon} 
          className={clsx('text-[28px]', loading && 'animate-spin-slow')} 
        />
      </div>
      
      <div className="text-center w-full">
        <p className={clsx('text-label-lg font-bold truncate transition-colors mb-1', done ? 'text-success' : 'text-on-surface')}>
          {done ? 'Documento cargado' : title}
        </p>
        <p className={clsx('text-caption px-2 truncate', done ? 'text-success/80' : 'text-on-surface-variant/80')}>
          {loading ? 'Analizando con IA...' : extractedLabel || subtitle}
        </p>
      </div>

      {/* Decorative upload icon when idle */}
      {!done && !loading && (
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon name="file_upload" className="text-primary text-[16px]" />
        </div>
      )}
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
