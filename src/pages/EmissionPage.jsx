import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Stepper from '../components/ui/Stepper'
import Icon from '../components/ui/Icon'
import { useToast } from '../context/ToastContext'
import { useData } from '../context/DataContext'

const STEPS = [
  { id: 'datos', label: 'Datos Generales' },
  { id: 'cob', label: 'Coberturas' },
  { id: 'cot', label: 'Cotización' },
  { id: 'em', label: 'Emisión' },
]

const COBERTURAS = [
  { id: 'rc', nombre: 'Responsabilidad Civil', precio: 80, mandatory: true },
  { id: 'dt', nombre: 'Daños a Terceros', precio: 110 },
  { id: 'rt', nombre: 'Robo Total', precio: 95 },
  { id: 'gm', nombre: 'Gastos Médicos', precio: 60 },
  { id: 'av', nombre: 'Asistencia Vial 24/7', precio: 40 },
  { id: 'vr', nombre: 'Vehículo de Reemplazo', precio: 70 },
]

export default function EmissionPage() {
  const [step, setStep] = useState(0)
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
      const num = `POL-${Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0')}`
      const policy = {
        id: num,
        numero: num,
        estado: 'Activa',
        plan: 'Estándar',
        modalidad: 'Por Días',
        diasRestantes: 30,
        diasContratados: 30,
        vigenciaDesde: new Date().toISOString().slice(0, 10),
        vigenciaHasta: new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .slice(0, 10),
        prima: total,
        saldo: 0,
        vehicleId: 'veh-001',
        holderId: 'u-003',
        coberturas: COBERTURAS.filter((c) => selected.includes(c.id)).map((c) => ({
          nombre: c.nombre,
          limite: c.precio * 100,
        })),
      }
      addPolicy(policy)
      setEmitted(policy)
      toast.success(`Póliza ${num} emitida exitosamente`, {
        title: '¡Listo!',
      })
      setEmitting(false)
    }, 1600)
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Emisión' },
        ]}
        title="Emisión de Póliza"
        subtitle="Complete los datos para generar una nueva póliza de Auto Casco."
      />

      <div className="mb-4">
        <Stepper steps={STEPS} current={step} onStepClick={(i) => setStep(i)} />
      </div>

      <div key={step} className="route-enter pb-2 md:pb-0">
        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/50">
                <Icon name="person" className="text-primary text-[24px]" filled />
                <h3 className="text-headline-md text-on-surface">
                  Datos del Tomador
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Nombres" value={tomador.nombres} onChange={(v) => setTomador({ ...tomador, nombres: v })} placeholder="Ej. Juan Carlos" />
                <FormField label="Apellidos" value={tomador.apellidos} onChange={(v) => setTomador({ ...tomador, apellidos: v })} placeholder="Ej. Pérez Gómez" />
                <div>
                  <label className="label">Tipo de Documento</label>
                  <select
                    className="input"
                    value={tomador.tipoDoc}
                    onChange={(e) => setTomador({ ...tomador, tipoDoc: e.target.value })}
                  >
                    <option value="V">V — Cédula</option>
                    <option value="E">E — Extranjero</option>
                    <option value="J">J — RIF Persona Jurídica</option>
                    <option value="G">G — Gobierno</option>
                  </select>
                </div>
                <FormField label="Número de Documento" value={tomador.documento} onChange={(v) => setTomador({ ...tomador, documento: v })} placeholder="0000000" />
                <FormField className="sm:col-span-2" label="Correo Electrónico" type="email" value={tomador.email} onChange={(v) => setTomador({ ...tomador, email: v })} placeholder="correo@ejemplo.com" />
                <FormField label="Teléfono" type="tel" value={tomador.telefono} onChange={(v) => setTomador({ ...tomador, telefono: v })} placeholder="(0414) 000-0000" />
                <FormField label="Fecha de Nacimiento" type="date" value={tomador.fechaNacimiento} onChange={(v) => setTomador({ ...tomador, fechaNacimiento: v })} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/50">
                  <Icon name="directions_car" className="text-primary text-[24px]" filled />
                  <h3 className="text-headline-md text-on-surface">Datos del Vehículo</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Marca</label>
                    <select
                      className="input"
                      value={vehiculo.marca}
                      onChange={(e) => setVehiculo({ ...vehiculo, marca: e.target.value })}
                    >
                      <option value="">Seleccione</option>
                      <option>Toyota</option>
                      <option>Honda</option>
                      <option>Ford</option>
                      <option>Chevrolet</option>
                      <option>Hyundai</option>
                    </select>
                  </div>
                  <FormField label="Modelo" value={vehiculo.modelo} onChange={(v) => setVehiculo({ ...vehiculo, modelo: v })} placeholder="Ej. Corolla" />
                  <FormField label="Año" type="number" value={vehiculo.anio} onChange={(v) => setVehiculo({ ...vehiculo, anio: v })} placeholder="2024" />
                  <FormField label="Placa" value={vehiculo.placa} onChange={(v) => setVehiculo({ ...vehiculo, placa: v.toUpperCase() })} placeholder="XYZ-1234" />
                  <FormField className="sm:col-span-2" label="Chasis / VIN" value={vehiculo.chasis} onChange={(v) => setVehiculo({ ...vehiculo, chasis: v.toUpperCase() })} placeholder="17 caracteres" />
                  <div className="sm:col-span-2">
                    <label className="label">Uso del vehículo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Privado', 'Comercial'].map((u) => (
                        <button
                          key={u}
                          onClick={() => setVehiculo({ ...vehiculo, uso: u })}
                          className={`p-2.5 rounded-xl border-2 flex items-center justify-between transition active:scale-[0.98] ${
                            vehiculo.uso === u
                              ? 'border-primary bg-primary-fixed/40 ring-2 ring-primary/20'
                              : 'border-outline-variant'
                          }`}
                        >
                          <span className="font-semibold">{u}</span>
                          {vehiculo.uso === u && (
                            <Icon name="check_circle" className="text-accent-500" filled />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-elev2 p-4 sm:p-5 overflow-hidden relative bg-gradient-brand-soft text-on-primary min-h-[120px] flex items-center">
                <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-accent-500/30 rounded-full blur-3xl" />
                <div className="relative z-10 flex-1 pr-2">
                  <h4 className="font-bold mb-1 text-headline-md">
                    Inspección Digital Rápida
                  </h4>
                  <p className="opacity-90 text-caption sm:text-body-md">
                    Sube fotos de tu vehículo desde el móvil en el siguiente
                    paso para una aprobación inmediata.
                  </p>
                </div>
                <Icon
                  name="photo_camera"
                  className="text-[80px] sm:text-[100px] opacity-25 shrink-0"
                  filled
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card p-4 sm:p-5">
              <h3 className="text-headline-md text-on-surface mb-3">
                Selecciona las coberturas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COBERTURAS.map((c) => {
                  const checked = selected.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      className={`p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition ${
                        checked
                          ? 'border-primary bg-primary-fixed/40'
                          : 'border-outline-variant hover:border-primary/40'
                      } ${c.mandatory ? 'opacity-90' : ''}`}
                    >
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
                        className="w-5 h-5 text-primary rounded focus:ring-primary/20 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface flex items-center flex-wrap gap-1">
                          <span className="truncate">{c.nombre}</span>
                          {c.mandatory && (
                            <span className="text-[10px] uppercase tracking-wider bg-primary-fixed text-primary px-2 py-0.5 rounded-full">
                              Obligatorio
                            </span>
                          )}
                        </p>
                        <p className="text-caption text-on-surface-variant">
                          ${c.precio} / mes · Límite ${c.precio * 100}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
            <aside className="card p-4 sm:p-5">
              <h3 className="text-headline-md text-on-surface mb-3">Resumen</h3>
              {COBERTURAS.filter((c) => selected.includes(c.id)).map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between py-2 border-b border-outline-variant/40 last:border-0 gap-2"
                >
                  <span className="text-body-md text-on-surface-variant truncate">
                    {c.nombre}
                  </span>
                  <span className="font-bold text-on-surface whitespace-nowrap">${c.precio}</span>
                </div>
              ))}
              <div className="flex justify-between mt-3 pt-3 border-t-2 border-outline-variant">
                <span className="text-headline-md text-on-surface">Prima</span>
                <span className="text-display-lg text-primary font-bold">${total}</span>
              </div>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="card p-6 sm:p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-3">
              <Icon name="request_quote" className="text-[36px] sm:text-[40px]" filled />
            </div>
            <h2 className="text-headline-lg text-primary mb-2">
              Cotización generada
            </h2>
            <p className="text-body-md sm:text-body-lg text-on-surface-variant mb-3">
              Plan Estándar · {selected.length} coberturas seleccionadas
            </p>
            <div className="bg-gradient-brand-soft text-on-primary rounded-xl p-4 sm:p-5 mb-3 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent-500/30 rounded-full blur-3xl" />
              <div className="relative">
                <p className="text-caption uppercase opacity-80 tracking-wider">
                  Prima total mensual
                </p>
                <p className="text-display-lg font-bold leading-none my-1">${total}</p>
                <p className="text-body-md opacity-80">
                  Vigencia 30 días · Modalidad por Días
                </p>
              </div>
            </div>
            <p className="text-caption text-on-surface-variant">
              La cotización es válida por 7 días.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="card p-6 sm:p-8 text-center max-w-2xl mx-auto">
            {!emitted ? (
              <>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-3">
                  <Icon
                    name={emitting ? 'progress_activity' : 'rocket_launch'}
                    className={`text-[36px] sm:text-[40px] ${emitting ? 'animate-spin' : ''}`}
                    filled
                  />
                </div>
                <h2 className="text-headline-lg text-primary mb-2">
                  {emitting ? 'Emitiendo póliza…' : 'Listo para emitir'}
                </h2>
                <p className="text-body-md text-on-surface-variant mb-4">
                  Confirma para generar la póliza y enviar la documentación al
                  cliente.
                </p>
                <button
                  onClick={emit}
                  disabled={emitting}
                  className="btn-accent mx-auto"
                >
                  {emitting ? 'Emitiendo…' : 'Emitir póliza'}
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success text-on-success flex items-center justify-center mx-auto mb-3 animate-fade-in">
                  <Icon name="check_circle" className="text-[40px] sm:text-[44px]" filled />
                </div>
                <h2 className="text-headline-lg text-success mb-2">
                  ¡Póliza emitida!
                </h2>
                <p className="text-body-md sm:text-body-lg text-on-surface mb-3">
                  Número:{' '}
                  <span className="font-mono font-bold text-primary break-all">
                    {emitted.numero}
                  </span>
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => navigate(`/polizas/${emitted.id}`)}
                    className="btn-primary"
                  >
                    <Icon name="visibility" /> Ver Póliza
                  </button>
                  <button onClick={() => navigate('/polizas')} className="btn-soft">
                    Ir a Pólizas
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {!emitted && (
        <div className="fixed inset-x-0 md:left-64 z-50 wizard-footer-sticky md:sticky md:bottom-0 md:inset-auto mt-4">
          <div className="card-elev2 p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-white/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-4px_16px_rgba(15,26,90,0.10)]">
            <button onClick={back} disabled={step === 0} className="btn-soft flex-1 sm:flex-none">
              <Icon name="arrow_back" /> <span className="hidden xs:inline">Anterior</span>
            </button>
            <p className="text-caption text-on-surface-variant hidden md:block">
              Paso {step + 1} de {STEPS.length} · {STEPS[step].label}
            </p>
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn-primary flex-1 sm:flex-none">
                <span className="hidden xs:inline">Siguiente</span>
                <Icon name="arrow_forward" />
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </>
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
