import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Stepper from '../components/ui/Stepper'
import Icon from '../components/ui/Icon'
import { useToast } from '../context/ToastContext'
import { useData } from '../context/DataContext'
import { downloadPdf } from '../utils/downloadPdf'

const STEPS = [
  { id: 'datos', label: 'Datos Generales', icon: 'person' },
  { id: 'cob', label: 'Coberturas', icon: 'shield' },
  { id: 'cot', label: 'Cotización', icon: 'request_quote' },
  { id: 'em', label: 'Emisión', icon: 'rocket_launch' },
]

const COBERTURAS = [
  {
    id: 'rc',
    nombre: 'Responsabilidad Civil',
    descripcion: 'Cubre daños materiales y corporales causados a terceros.',
    precio: 80,
    preciodia: 2.67,
    limite: 8000,
    icon: 'gavel',
    mandatory: true,
    color: 'primary',
  },
  {
    id: 'dt',
    nombre: 'Daños a Terceros',
    descripcion: 'Protección ampliada por colisión con otros vehículos.',
    precio: 110,
    preciodia: 3.67,
    limite: 11000,
    icon: 'handshake',
    color: 'accent',
  },
  {
    id: 'rt',
    nombre: 'Robo Total',
    descripcion: 'Indemnización por robo o sustracción total del vehículo.',
    precio: 95,
    preciodia: 3.17,
    limite: 9500,
    icon: 'security',
    color: 'error',
  },
  {
    id: 'gm',
    nombre: 'Gastos Médicos',
    descripcion: 'Cobertura médica para el conductor y acompañantes.',
    precio: 60,
    preciodia: 2.0,
    limite: 6000,
    icon: 'medical_services',
    color: 'success',
  },
  {
    id: 'av',
    nombre: 'Asistencia Vial 24/7',
    descripcion: 'Grúa, batería, cambio de neumático y mecánica ligera.',
    precio: 40,
    preciodia: 1.33,
    limite: 4000,
    icon: 'emergency',
    color: 'warning',
  },
  {
    id: 'vr',
    nombre: 'Vehículo de Reemplazo',
    descripcion: 'Auto de sustitución mientras el tuyo está en taller.',
    precio: 70,
    preciodia: 2.33,
    limite: 7000,
    icon: 'car_rental',
    color: 'primary',
  },
]

const COLOR_MAP = {
  primary: 'bg-primary-fixed text-primary',
  accent: 'bg-accent-100 text-accent-600',
  error: 'bg-error-container text-error',
  success: 'bg-success-container text-on-success-container',
  warning: 'bg-warning-container text-on-warning-container',
}

export default function EmissionPage() {
  const [step, setStep] = useState(0)
  const [ocrScanning, setOcrScanning] = useState(false)
  const [ocrDone, setOcrDone] = useState(false)
  const [tomador, setTomador] = useState({
    nombres: '',
    apellidos: '',
    documento: '',
    tipoDoc: 'V',
    email: '',
    telefono: '',
    fechaNacimiento: '',
  })
  const [vehiculo, setVehiculo] = useState({
    marca: '',
    modelo: '',
    anio: '',
    chasis: '',
    placa: '',
    uso: 'Privado',
    color: '',
  })
  const [selected, setSelected] = useState(['rc', 'dt'])
  const [emitting, setEmitting] = useState(false)
  const [emitted, setEmitted] = useState(null)
  const toast = useToast()
  const navigate = useNavigate()
  const { addPolicy } = useData()

  const total = COBERTURAS.reduce(
    (acc, c) => (selected.includes(c.id) ? acc + c.precio : acc),
    0,
  )
  const totalDia = COBERTURAS.reduce(
    (acc, c) => (selected.includes(c.id) ? acc + c.preciodia : acc),
    0,
  )
  const selectedCoverages = COBERTURAS.filter((c) => selected.includes(c.id))

  const simulateOcr = () => {
    setOcrScanning(true)
    setTimeout(() => {
      setTomador({
        nombres: 'Juan Carlos',
        apellidos: 'Pérez Gómez',
        documento: '12345678',
        tipoDoc: 'V',
        email: 'jperez@email.com',
        telefono: '(0414) 555-0123',
        fechaNacimiento: '1985-06-15',
      })
      setVehiculo({
        marca: 'Toyota',
        modelo: 'Corolla',
        anio: '2022',
        chasis: '2T1BURHE0JC001234',
        placa: 'ABC-1234',
        uso: 'Privado',
        color: 'Plata',
      })
      setOcrScanning(false)
      setOcrDone(true)
      toast.success('Datos extraídos correctamente del documento.', { title: 'OCR completado' })
    }, 2000)
  }

  const next = () => {
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const back = () => {
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const emit = () => {
    setEmitting(true)
    toast.info('Generando póliza…')
    setTimeout(() => {
      const num = `POL-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`
      const policy = {
        id: num,
        numero: num,
        estado: 'Activa',
        plan: 'Estándar',
        modalidad: 'Por Días',
        diasRestantes: 30,
        diasContratados: 30,
        vigenciaDesde: new Date().toISOString().slice(0, 10),
        vigenciaHasta: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        prima: total,
        saldo: 0,
        vehicleId: 'veh-001',
        holderId: 'u-003',
        coberturas: COBERTURAS.filter((c) => selected.includes(c.id)).map((c) => ({
          nombre: c.nombre,
          limite: c.limite,
        })),
      }
      addPolicy(policy)
      setEmitted(policy)
      toast.success(`Póliza ${num} emitida exitosamente`, { title: '¡Listo!' })
      setEmitting(false)
    }, 1800)
  }

  const downloadQuote = () => {
    downloadPdf({
      title: 'Cotización Auto Casco',
      lines: [
        `Cliente: ${tomador.nombres} ${tomador.apellidos}`,
        `Documento: ${tomador.tipoDoc}-${tomador.documento}`,
        `Vehículo: ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} · ${vehiculo.placa}`,
        '',
        'COBERTURAS SELECCIONADAS:',
        ...selectedCoverages.map((c) => `  ${c.nombre}: $${c.precio}/mes`),
        '',
        `Prima total mensual: $${total}`,
        `Equivalente diario: $${totalDia.toFixed(2)}/día`,
        '',
        'Cotización válida por 7 días hábiles.',
        'Documento generado desde La Mundial · Auto Casco Demo.',
      ],
      filename: 'cotizacion-auto-casco.pdf',
    })
    toast.success('PDF descargado')
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Emisión' },
        ]}
        title="Emisión de Póliza"
        subtitle="Complete los datos del asegurado y el vehículo para generar una nueva póliza."
      />

      <div className="mb-5">
        <Stepper steps={STEPS} current={step} onStepClick={(i) => i < step && setStep(i)} />
      </div>

      <div key={step} className="route-enter pb-2 md:pb-0">

        {/* ── Step 0: Datos Generales ─────────────────────────────────────── */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            {/* OCR Banner */}
            <div className="card p-4 sm:p-5 bg-gradient-brand-soft text-on-primary relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                    <Icon name="document_scanner" className="text-[26px]" filled />
                  </div>
                  <div>
                    <p className="font-bold text-body-lg">Leer documento con OCR</p>
                    <p className="opacity-80 text-caption sm:text-body-md">
                      Escanea cédula o carnet de circulación para prellenar los datos automáticamente.
                    </p>
                  </div>
                </div>
                <button
                  onClick={simulateOcr}
                  disabled={ocrScanning}
                  className="shrink-0 bg-white/15 hover:bg-white/25 active:scale-95 transition rounded-xl px-5 py-2.5 font-bold text-label-md flex items-center gap-2 min-h-[44px]"
                >
                  {ocrScanning ? (
                    <>
                      <Icon name="progress_activity" className="animate-spin" />
                      Leyendo…
                    </>
                  ) : ocrDone ? (
                    <>
                      <Icon name="check_circle" filled />
                      Volver a leer
                    </>
                  ) : (
                    <>
                      <Icon name="qr_code_scanner" />
                      Escanear
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tomador */}
              <div className="card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant/50">
                  <div className="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                    <Icon name="person" className="text-[20px]" filled />
                  </div>
                  <div>
                    <h3 className="text-headline-md text-on-surface">Datos del Tomador</h3>
                    <p className="text-caption text-on-surface-variant">Información personal del asegurado</p>
                  </div>
                  {ocrDone && (
                    <span className="ml-auto chip bg-success-container text-on-success-container shrink-0">
                      <Icon name="auto_awesome" className="text-[13px]" /> OCR
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FF label="Nombres" value={tomador.nombres}
                    onChange={(v) => setTomador({ ...tomador, nombres: v })}
                    placeholder="Juan Carlos" icon="badge" />
                  <FF label="Apellidos" value={tomador.apellidos}
                    onChange={(v) => setTomador({ ...tomador, apellidos: v })}
                    placeholder="Pérez Gómez" icon="badge" />

                  <div>
                    <label className="label">Tipo de documento</label>
                    <div className="relative">
                      <select
                        className="input pl-10"
                        value={tomador.tipoDoc}
                        onChange={(e) => setTomador({ ...tomador, tipoDoc: e.target.value })}
                      >
                        <option value="V">V — Cédula venezolana</option>
                        <option value="E">E — Extranjero</option>
                        <option value="J">J — RIF Jurídico</option>
                        <option value="G">G — Gobierno</option>
                      </select>
                      <Icon name="assignment_ind" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                    </div>
                  </div>
                  <FF label="Número de documento" value={tomador.documento}
                    onChange={(v) => setTomador({ ...tomador, documento: v })}
                    placeholder="12345678" icon="numbers" />

                  <div className="sm:col-span-2">
                    <FF label="Correo electrónico" type="email" value={tomador.email}
                      onChange={(v) => setTomador({ ...tomador, email: v })}
                      placeholder="correo@ejemplo.com" icon="mail" />
                  </div>

                  <FF label="Teléfono" type="tel" value={tomador.telefono}
                    onChange={(v) => setTomador({ ...tomador, telefono: v })}
                    placeholder="(0414) 000-0000" icon="phone" />
                  <FF label="Fecha de nacimiento" type="date" value={tomador.fechaNacimiento}
                    onChange={(v) => setTomador({ ...tomador, fechaNacimiento: v })}
                    icon="cake" />
                </div>
              </div>

              {/* Vehículo */}
              <div className="flex flex-col gap-4">
                <div className="card p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant/50">
                    <div className="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                      <Icon name="directions_car" className="text-[20px]" filled />
                    </div>
                    <div>
                      <h3 className="text-headline-md text-on-surface">Datos del Vehículo</h3>
                      <p className="text-caption text-on-surface-variant">Información del bien asegurado</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Marca</label>
                      <div className="relative">
                        <select
                          className="input pl-10"
                          value={vehiculo.marca}
                          onChange={(e) => setVehiculo({ ...vehiculo, marca: e.target.value })}
                        >
                          <option value="">Seleccione marca</option>
                          {['Toyota','Honda','Ford','Chevrolet','Hyundai','Kia','Nissan','Volkswagen','Mitsubishi'].map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                        <Icon name="directions_car" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                      </div>
                    </div>

                    <FF label="Modelo" value={vehiculo.modelo}
                      onChange={(v) => setVehiculo({ ...vehiculo, modelo: v })}
                      placeholder="Ej. Corolla" icon="info" />
                    <FF label="Año" type="number" value={vehiculo.anio}
                      onChange={(v) => setVehiculo({ ...vehiculo, anio: v })}
                      placeholder="2024" icon="calendar_today" />
                    <FF label="Placa" value={vehiculo.placa}
                      onChange={(v) => setVehiculo({ ...vehiculo, placa: v.toUpperCase() })}
                      placeholder="XYZ-1234" icon="pin" />
                    <div className="sm:col-span-2">
                      <FF label="Chasis / VIN (17 caracteres)" value={vehiculo.chasis}
                        onChange={(v) => setVehiculo({ ...vehiculo, chasis: v.toUpperCase() })}
                        placeholder="2T1BURHE0JC000000" icon="qr_code" />
                    </div>
                    <FF label="Color" value={vehiculo.color}
                      onChange={(v) => setVehiculo({ ...vehiculo, color: v })}
                      placeholder="Ej. Rojo" icon="palette" />

                    <div>
                      <label className="label">Uso del vehículo</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Privado', 'Comercial'].map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setVehiculo({ ...vehiculo, uso: u })}
                            className={clsx(
                              'min-h-[44px] rounded-xl border-2 flex items-center justify-center gap-2 font-semibold text-label-md transition active:scale-[0.98]',
                              vehiculo.uso === u
                                ? 'border-primary bg-primary-fixed/40 text-primary ring-2 ring-primary/20'
                                : 'border-outline-variant text-on-surface-variant hover:border-primary/40',
                            )}
                          >
                            <Icon name={u === 'Privado' ? 'home' : 'storefront'} className="text-[18px]" />
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tip card */}
                <div className="card p-4 border border-accent-500/30 bg-accent-50/30 flex items-start gap-3">
                  <Icon name="tips_and_updates" className="text-accent-600 text-[22px] shrink-0 mt-0.5" filled />
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface text-body-md">Inspección Digital Rápida</p>
                    <p className="text-caption text-on-surface-variant mt-0.5">
                      Realiza la inspección fotográfica del vehículo desde tu móvil para agilizar la aprobación automática.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Coberturas ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <p className="text-body-md text-on-surface-variant">
                Selecciona las coberturas que mejor se adapten a las necesidades del asegurado.
                La{' '}
                <span className="font-semibold text-primary">Responsabilidad Civil</span> es obligatoria por ley.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COBERTURAS.map((c) => {
                  const checked = selected.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      className={clsx(
                        'relative p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition-all active:scale-[0.99] group',
                        c.mandatory && 'opacity-90',
                        checked
                          ? 'border-primary bg-primary-fixed/20 shadow-sm'
                          : 'border-outline-variant/60 hover:border-primary/40 hover:bg-surface-container-low/30',
                      )}
                    >
                      {c.mandatory && (
                        <span className="absolute top-2 right-2 text-[10px] bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Obligatoria
                        </span>
                      )}
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={c.mandatory}
                        onChange={(e) => {
                          if (c.mandatory) return
                          setSelected((prev) =>
                            e.target.checked
                              ? [...prev, c.id]
                              : prev.filter((id) => id !== c.id),
                          )
                        }}
                        className="w-5 h-5 text-primary rounded focus:ring-primary/20 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className={clsx(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                              COLOR_MAP[c.color] ?? 'bg-primary-fixed text-primary',
                            )}
                          >
                            <Icon name={c.icon} className="text-[16px]" filled />
                          </div>
                          <p className="font-bold text-on-surface text-label-md leading-tight">
                            {c.nombre}
                          </p>
                        </div>
                        <p className="text-caption text-on-surface-variant mb-2 leading-snug">
                          {c.descripcion}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-caption text-on-surface-variant">
                            Límite: <span className="font-semibold">${c.limite.toLocaleString()}</span>
                          </span>
                          <span className={clsx('text-label-md font-bold', checked ? 'text-primary' : 'text-on-surface-variant')}>
                            ${c.precio}<span className="text-[11px] font-normal">/mes</span>
                          </span>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Price summary sidebar */}
            <aside className="flex flex-col gap-3">
              <div className="card p-4 sm:p-5 sticky top-4">
                <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
                  <Icon name="receipt_long" className="text-primary text-[20px]" />
                  Resumen
                </h3>

                <div className="flex flex-col gap-1 mb-3">
                  {COBERTURAS.filter((c) => selected.includes(c.id)).map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center py-2 border-b border-outline-variant/30 last:border-0 gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={clsx('w-6 h-6 rounded flex items-center justify-center shrink-0', COLOR_MAP[c.color])}>
                          <Icon name={c.icon} className="text-[13px]" filled />
                        </div>
                        <span className="text-caption text-on-surface truncate">{c.nombre}</span>
                      </div>
                      <span className="font-bold text-on-surface text-caption whitespace-nowrap">
                        ${c.precio}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-3 bg-primary-fixed/30 border border-primary/20 mb-3">
                  <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-1">Prima total</p>
                  <p className="text-display-lg font-bold text-primary leading-none">${total}</p>
                  <p className="text-caption text-on-surface-variant mt-1">
                    ≈ ${totalDia.toFixed(2)} / día · {selected.length} coberturas
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-caption text-on-surface-variant">
                    <Icon name="check_circle" className="text-success text-[16px]" filled />
                    Modalidad por Días disponible
                  </div>
                  <div className="flex items-center gap-2 text-caption text-on-surface-variant">
                    <Icon name="check_circle" className="text-success text-[16px]" filled />
                    Emisión en menos de 2 minutos
                  </div>
                  <div className="flex items-center gap-2 text-caption text-on-surface-variant">
                    <Icon name="check_circle" className="text-success text-[16px]" filled />
                    Soporte peritaje 24/7
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ── Step 2: Cotización ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left: summary */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {/* Client card */}
              <div className="card p-4 sm:p-5">
                <h4 className="text-headline-md mb-3 flex items-center gap-2 pb-3 border-b border-outline-variant/40">
                  <Icon name="person" className="text-primary text-[20px]" filled />
                  Asegurado
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <InfoRow label="Nombre" value={`${tomador.nombres} ${tomador.apellidos}`.trim() || '—'} />
                  <InfoRow label="Documento" value={tomador.documento ? `${tomador.tipoDoc}-${tomador.documento}` : '—'} />
                  <InfoRow label="Teléfono" value={tomador.telefono || '—'} />
                  <InfoRow label="Correo" value={tomador.email || '—'} className="col-span-2 sm:col-span-3" />
                </div>
              </div>

              {/* Vehicle card */}
              <div className="card p-4 sm:p-5">
                <h4 className="text-headline-md mb-3 flex items-center gap-2 pb-3 border-b border-outline-variant/40">
                  <Icon name="directions_car" className="text-primary text-[20px]" filled />
                  Vehículo
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <InfoRow label="Marca / Modelo" value={`${vehiculo.marca} ${vehiculo.modelo}`.trim() || '—'} />
                  <InfoRow label="Año" value={vehiculo.anio || '—'} />
                  <InfoRow label="Placa" value={vehiculo.placa || '—'} />
                  <InfoRow label="Chasis" value={vehiculo.chasis || '—'} />
                  <InfoRow label="Uso" value={vehiculo.uso} />
                  <InfoRow label="Color" value={vehiculo.color || '—'} />
                </div>
              </div>

              {/* Coverages breakdown */}
              <div className="card p-4 sm:p-5">
                <h4 className="text-headline-md mb-3 flex items-center gap-2 pb-3 border-b border-outline-variant/40">
                  <Icon name="shield" className="text-primary text-[20px]" filled />
                  Coberturas ({selectedCoverages.length})
                </h4>
                <div className="flex flex-col divide-y divide-outline-variant/30">
                  {selectedCoverages.map((c) => (
                    <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', COLOR_MAP[c.color])}>
                        <Icon name={c.icon} className="text-[18px]" filled />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-on-surface text-label-md truncate">{c.nombre}</p>
                        <p className="text-caption text-on-surface-variant">
                          Límite: ${c.limite.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-on-surface text-label-md">${c.precio}/mes</p>
                        <p className="text-caption text-on-surface-variant">${c.preciodia.toFixed(2)}/día</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: price quote card */}
            <aside className="lg:col-span-2 flex flex-col gap-4">
              <div className="card p-0 overflow-hidden sticky top-4">
                {/* Header gradient */}
                <div className="bg-gradient-brand-soft text-on-primary p-5 relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-accent-500/30 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative">
                    <p className="text-caption opacity-80 uppercase tracking-wider mb-1">Cotización</p>
                    <p className="text-[11px] opacity-70">Plan Estándar · Modalidad por Días</p>
                    <div className="my-3">
                      <p className="text-[40px] font-bold leading-none">${total}</p>
                      <p className="text-body-md opacity-80">prima mensual</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                      <Icon name="today" className="text-accent-300 text-[18px]" />
                      <span className="text-caption font-bold">${totalDia.toFixed(2)}/día cuando manejes</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between text-caption">
                    <span className="text-on-surface-variant">Vigencia</span>
                    <span className="font-semibold text-on-surface">30 días</span>
                  </div>
                  <div className="flex justify-between text-caption">
                    <span className="text-on-surface-variant">Coberturas</span>
                    <span className="font-semibold text-on-surface">{selectedCoverages.length} seleccionadas</span>
                  </div>
                  <div className="flex justify-between text-caption">
                    <span className="text-on-surface-variant">Válida hasta</span>
                    <span className="font-semibold text-on-surface">
                      {new Date(Date.now() + 7 * 86400000).toLocaleDateString('es-VE')}
                    </span>
                  </div>

                  <div className="border-t border-outline-variant/40 pt-3 mt-1 space-y-2">
                    <button onClick={downloadQuote} className="btn-soft w-full">
                      <Icon name="picture_as_pdf" /> Descargar cotización
                    </button>
                    <button onClick={next} className="btn-primary w-full">
                      <Icon name="rocket_launch" /> Proceder a emisión
                    </button>
                  </div>

                  <p className="text-[11px] text-on-surface-variant text-center leading-snug">
                    Al emitir aceptas los{' '}
                    <button className="underline hover:text-primary transition">términos y condiciones</button>{' '}
                    de La Mundial de Seguros.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ── Step 3: Emisión ────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            {!emitted ? (
              <div className="flex flex-col gap-4">
                {/* Summary card */}
                <div className="card p-5 sm:p-6">
                  <h3 className="text-headline-md text-on-surface mb-4 flex items-center gap-2">
                    <Icon name="checklist" className="text-primary text-[22px]" />
                    Confirmación final
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <p className="text-caption text-on-surface-variant uppercase tracking-wider">Asegurado</p>
                      <p className="font-bold text-on-surface">{`${tomador.nombres} ${tomador.apellidos}`.trim() || '(sin datos)'}</p>
                      <p className="text-caption text-on-surface-variant">{tomador.email || 'Sin correo'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-caption text-on-surface-variant uppercase tracking-wider">Vehículo</p>
                      <p className="font-bold text-on-surface">{`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`.trim() || '(sin datos)'}</p>
                      <p className="text-caption text-on-surface-variant">{vehiculo.placa || 'Sin placa'}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-primary-fixed/20 border border-primary/20 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-caption text-on-surface-variant">Prima total mensual</p>
                      <p className="text-display-lg font-bold text-primary leading-none">${total}</p>
                      <p className="text-caption text-on-surface-variant mt-1">
                        {selectedCoverages.length} coberturas · ${totalDia.toFixed(2)}/día
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-brand-soft text-on-primary flex items-center justify-center shadow-elev-primary shrink-0">
                      <Icon name="shield" className="text-[32px]" filled />
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={emit}
                  disabled={emitting}
                  className="btn-accent w-full py-4 text-body-lg"
                >
                  {emitting ? (
                    <>
                      <Icon name="progress_activity" className="animate-spin text-[22px]" />
                      Emitiendo póliza…
                    </>
                  ) : (
                    <>
                      <Icon name="rocket_launch" className="text-[22px]" />
                      Emitir póliza ahora
                    </>
                  )}
                </button>
                <p className="text-center text-caption text-on-surface-variant">
                  El cliente recibirá la póliza por correo electrónico inmediatamente.
                </p>
              </div>
            ) : (
              /* Success state */
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Celebration */}
                <div className="card p-6 sm:p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-success text-on-success flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(0,180,100,0.35)]">
                    <Icon name="check_circle" className="text-[44px]" filled />
                  </div>
                  <h2 className="text-display-sm text-success font-bold mb-1">¡Póliza emitida!</h2>
                  <p className="text-body-md text-on-surface-variant mb-4">
                    La documentación fue enviada al correo del asegurado.
                  </p>

                  {/* Policy card mockup */}
                  <div className="rounded-2xl bg-gradient-brand text-on-primary p-5 relative overflow-hidden text-left mb-4 shadow-elev-primary">
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent-500/30 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest opacity-70">La Mundial de Seguros</p>
                          <p className="font-bold text-body-lg">Auto Casco</p>
                        </div>
                        <Icon name="shield" className="text-[36px] opacity-60" filled />
                      </div>
                      <p className="font-mono text-[22px] font-bold tracking-wider mb-3">
                        {emitted.numero}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] opacity-70 uppercase tracking-wider">Asegurado</p>
                          <p className="font-semibold truncate">{`${tomador.nombres} ${tomador.apellidos}`.trim() || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] opacity-70 uppercase tracking-wider">Vehículo</p>
                          <p className="font-semibold truncate">
                            {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] opacity-70 uppercase tracking-wider">Desde</p>
                          <p className="font-semibold">{emitted.vigenciaDesde}</p>
                        </div>
                        <div>
                          <p className="text-[10px] opacity-70 uppercase tracking-wider">Prima</p>
                          <p className="font-bold text-accent-300">${total}/mes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => navigate(`/polizas/${emitted.id}`)}
                      className="btn-primary"
                    >
                      <Icon name="visibility" /> Ver póliza
                    </button>
                    <button onClick={() => navigate('/emision')} className="btn-soft"
                      onClick={() => { setStep(0); setEmitted(null); setOcrDone(false); setTomador({ nombres:'',apellidos:'',documento:'',tipoDoc:'V',email:'',telefono:'',fechaNacimiento:'' }); setVehiculo({ marca:'',modelo:'',anio:'',chasis:'',placa:'',uso:'Privado',color:'' }); setSelected(['rc','dt']); }}>
                      Nueva emisión
                    </button>
                    <button onClick={() => navigate('/polizas')} className="btn-ghost">
                      Ir a Pólizas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky footer navigation ────────────────────────────────────── */}
      {!emitted && (
        <div className="fixed inset-x-0 md:left-64 z-50 wizard-footer-sticky md:sticky md:bottom-0 md:inset-auto mt-4">
          <div className="bg-white/96 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-4px_24px_rgba(15,26,90,0.10)]">
            <div className="max-w-container mx-auto container-pad py-2.5 flex items-center justify-between gap-3">
              <button
                onClick={back}
                disabled={step === 0}
                className="btn-soft"
              >
                <Icon name="arrow_back" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Step indicator */}
              <div className="flex-1 flex items-center justify-center gap-1.5">
                {STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    className={clsx(
                      'rounded-full transition-all',
                      i === step
                        ? 'w-6 h-2 bg-primary'
                        : i < step
                        ? 'w-2 h-2 bg-accent-500 cursor-pointer hover:bg-accent-600'
                        : 'w-2 h-2 bg-outline-variant',
                    )}
                    aria-label={s.label}
                  />
                ))}
              </div>

              {step < STEPS.length - 1 ? (
                <button onClick={next} className="btn-primary">
                  <span className="hidden sm:inline">Siguiente</span>
                  <Icon name="arrow_forward" />
                </button>
              ) : step === STEPS.length - 1 && !emitted ? (
                <span className="w-[88px]" />
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Form field with leading icon ─────────────────────────────────────────── */
function FF({ label, value, onChange, type = 'text', placeholder, className = '', icon }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="label">{label}</label>
      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none"
          />
        )}
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={clsx('input', icon && 'pl-10')}
        />
      </div>
    </div>
  )
}

/* ─── Info row (read-only) ──────────────────────────────────────────────────── */
function InfoRow({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-body-md font-semibold text-on-surface truncate">{value}</p>
    </div>
  )
}
