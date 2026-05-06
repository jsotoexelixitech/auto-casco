import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import { OCR_TEMPLATES } from '../../data/mockData'
import { useToast } from '../../context/ToastContext'

export default function Step1Documents({ state }) {
  const { docs, setDocs, tomador, setTomador, vehiculo, setVehiculo } = state
  const toast = useToast()
  const [scanning, setScanning] = useState(null)

  const simulateOCR = (kind) => {
    setScanning(kind)
    toast.info('Procesando documento con OCR…', { title: 'Análisis en curso' })
    setTimeout(() => {
      if (kind === 'cedula') {
        const data = OCR_TEMPLATES.cedula
        setDocs({ ...docs, cedula: data, naturaleza: 'natural' })
        setTomador({
          ...tomador,
          nombres: data.nombres,
          apellidos: data.apellidos,
          documento: data.documento,
          fechaNacimiento: data.fechaNacimiento,
        })
        toast.success('Cédula procesada · Datos extraídos', { title: 'OCR completado' })
      } else if (kind === 'rif') {
        const data = OCR_TEMPLATES.rif
        setDocs({ ...docs, rif: data, naturaleza: 'juridica' })
        setTomador({
          ...tomador,
          razonSocial: data.razonSocial,
          documento: data.documento,
        })
        toast.success('RIF procesado · Persona Jurídica detectada', { title: 'OCR completado' })
      } else if (kind === 'carnet') {
        const data = OCR_TEMPLATES.carnet
        setDocs({ ...docs, carnet: data })
        setVehiculo({
          ...vehiculo,
          marca: data.marca,
          modelo: data.modelo,
          tipo: data.tipo,
          serial: data.serial,
          placa: data.placa,
          color: data.color,
          anio: data.anio,
          puestos: data.puestos,
        })
        toast.success(`Carnet procesado · ${data.marca} ${data.modelo} ${data.anio}`, {
          title: 'OCR completado',
        })
      }
      setScanning(null)
    }, 1800)
  }

  const isPersonaNatural = docs.naturaleza === 'natural'

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UploadCard
              icon="badge"
              title="Cédula de Identidad"
              subtitle="V- · E- · Persona Natural"
              done={!!docs.cedula}
              loading={scanning === 'cedula'}
              onClick={() => simulateOCR('cedula')}
              extractedLabel={docs.cedula?.documento}
            />
            <UploadCard
              icon="domain"
              title="RIF"
              subtitle="J · G · C · Persona Jurídica"
              done={!!docs.rif}
              loading={scanning === 'rif'}
              onClick={() => simulateOCR('rif')}
              extractedLabel={docs.rif?.documento}
            />
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
            loading={scanning === 'carnet'}
            onClick={() => simulateOCR('carnet')}
            extractedLabel={
              docs.carnet
                ? `${docs.carnet.placa} · ${docs.carnet.marca} ${docs.carnet.modelo}`
                : null
            }
          />

          {docs.carnet && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-primary-fixed/30 rounded-xl animate-fade-in">
              <Field label="Placa" value={docs.carnet.placa} mono />
              <Field label="Marca" value={docs.carnet.marca} />
              <Field label="Modelo" value={docs.carnet.modelo} />
              <Field label="Año" value={docs.carnet.anio} />
              <Field label="Color" value={docs.carnet.color} />
              <Field label="Tipo" value={docs.carnet.tipo} />
              <Field label="Puestos" value={docs.carnet.puestos} />
              <Field label="Serial" value={docs.carnet.serial} mono />
            </div>
          )}
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/50">
            <Icon name="person" className="text-primary text-[24px]" filled />
            <h3 className="text-headline-md text-on-surface">Datos del Tomador</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isPersonaNatural || !docs.naturaleza ? (
              <>
                <FormField label="Nombres" value={tomador.nombres} onChange={(v) => setTomador({ ...tomador, nombres: v })} />
                <FormField label="Apellidos" value={tomador.apellidos} onChange={(v) => setTomador({ ...tomador, apellidos: v })} />
              </>
            ) : (
              <FormField className="sm:col-span-2" label="Razón Social" value={tomador.razonSocial} onChange={(v) => setTomador({ ...tomador, razonSocial: v })} />
            )}
            <FormField label="Documento" value={tomador.documento} onChange={(v) => setTomador({ ...tomador, documento: v })} />
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
          <CheckItem done={docs.cedula || docs.rif} label="Documento de identidad cargado" />
          <CheckItem done={!!docs.carnet} label="Carnet de circulación cargado" />
          <CheckItem done={!!tomador.email} label="Correo de contacto" />
          <CheckItem done={!!tomador.telefono} label="Teléfono de contacto" />
        </div>
      </aside>
    </div>
  )
}

function UploadCard({ icon, title, subtitle, done, loading, onClick, extractedLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`relative overflow-hidden rounded-xl border-2 border-dashed p-3 transition-all text-left flex items-center gap-3 active:scale-[0.99] ${
        done
          ? 'border-success bg-success-container/30'
          : loading
          ? 'border-primary bg-primary-fixed/40'
          : 'border-outline-variant/70 hover:border-primary hover:bg-primary-fixed/20'
      }`}
    >
      {loading && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20 overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-accent animate-shimmer rounded-r-full" />
        </div>
      )}
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          done ? 'bg-success text-on-success' : 'bg-primary-fixed text-primary'
        }`}
      >
        <Icon
          name={done ? 'task_alt' : loading ? 'progress_activity' : icon}
          className={loading ? 'animate-spin' : ''}
          filled
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-on-surface truncate">{title}</p>
        <p className="text-caption text-on-surface-variant truncate">
          {loading ? 'Procesando con OCR…' : extractedLabel || subtitle}
        </p>
      </div>
      {!loading && (
        <Icon
          name={done ? 'check_circle' : 'cloud_upload'}
          className={done ? 'text-success' : 'text-on-surface-variant'}
          filled={done}
        />
      )}
    </button>
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
