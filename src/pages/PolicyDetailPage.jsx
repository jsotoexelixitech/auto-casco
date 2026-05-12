import { Link, useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import StatusChip from '../components/ui/StatusChip'
import Icon from '../components/ui/Icon'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { downloadPdf } from '../utils/downloadPdf'

const COVERAGE_ICONS = {
  'Responsabilidad Civil': 'gavel',
  'Daños a Terceros': 'handshake',
  'Robo Total': 'security',
  'Gastos Médicos': 'medical_services',
  'Asistencia Vial 24/7': 'emergency',
  'Vehículo de Reemplazo': 'car_rental',
}

const COVERAGE_COLORS = {
  'Responsabilidad Civil': 'bg-primary-fixed text-primary',
  'Daños a Terceros': 'bg-accent-100 text-accent-600',
  'Robo Total': 'bg-error-container text-error',
  'Gastos Médicos': 'bg-success-container text-on-success-container',
  'Asistencia Vial 24/7': 'bg-warning-container text-on-warning-container',
  'Vehículo de Reemplazo': 'bg-secondary-fixed text-on-secondary-fixed',
}

export default function PolicyDetailPage() {
  const { id } = useParams()
  const { getPolicy, getVehicle, inspections } = useData()
  const navigate = useNavigate()
  const toast = useToast()
  const policy = getPolicy(id)

  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
        <Icon name="policy" className="text-[64px] opacity-20" />
        <p className="text-headline-md">Póliza no encontrada</p>
        <button onClick={() => navigate('/polizas')} className="btn-primary">
          Ver todas las pólizas
        </button>
      </div>
    )
  }

  const vehicle = getVehicle(policy.vehicleId)
  const policyInspections = inspections.filter((i) => i.vehicleId === policy.vehicleId)
  const diasPct = Math.min(100, ((policy.diasRestantes ?? 0) / (policy.diasContratados || 1)) * 100)

  const handleDownload = () => {
    const lines = [
      `Numero de poliza: ${policy.numero}`,
      `Estado: ${policy.estado}`,
      `Plan: ${policy.plan}  -  Modalidad: ${policy.modalidad}`,
      `Vigencia: ${policy.vigenciaDesde}  ->  ${policy.vigenciaHasta}`,
      `Dias: ${policy.diasRestantes} restantes / ${policy.diasContratados} contratados`,
      '',
      'Vehiculo asegurado',
      `${vehicle?.marca} ${vehicle?.modelo} ${vehicle?.anio} (${vehicle?.color})`,
      `Placa: ${vehicle?.placa}`,
      `Serial / VIN: ${vehicle?.serial}`,
      '',
      'Coberturas incluidas:',
      ...policy.coberturas.map(
        (c) => `   - ${c.nombre}  /  Limite ${typeof c.limite === 'number' ? '$' + c.limite.toLocaleString() : c.limite}`,
      ),
      '',
      `Prima total: $${policy.prima.toLocaleString()}`,
      `Saldo disponible: $${policy.saldo.toFixed(2)}`,
      '',
      'La Mundial de Seguros - 52 anos contigo',
    ]
    downloadPdf({ title: `Poliza ${policy.numero}`, lines, filename: `${policy.numero}.pdf` })
    toast.success('Póliza descargada en PDF', { title: '¡Listo!' })
  }

  const handleShare = async () => {
    const shareText = `Mi póliza ${policy.numero} de ${vehicle?.marca} ${vehicle?.modelo} - La Mundial de Seguros`
    try {
      if (navigator.share) {
        await navigator.share({ title: `Póliza ${policy.numero}`, text: shareText, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`)
        toast.success('Enlace copiado al portapapeles', { title: 'Compartir' })
      }
    } catch { /* user cancelled */ }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Pólizas', to: '/polizas' },
          { label: policy.numero },
        ]}
        eyebrow={policy.numero}
        title={`${vehicle?.marca} ${vehicle?.modelo} ${vehicle?.anio}`}
        subtitle={`Plan ${policy.plan} · ${policy.modalidad}`}
        actions={
          <>
            <Link to="/cobertura" className="btn-accent">
              <Icon name="bolt" /> Comprar Días
            </Link>
            <button onClick={handleShare} className="btn-icon" aria-label="Compartir">
              <Icon name="share" />
            </button>
            <button onClick={handleDownload} className="btn-ghost hidden sm:inline-flex">
              <Icon name="picture_as_pdf" /> Descargar
            </button>
            <button onClick={handleDownload} className="btn-icon sm:hidden" aria-label="Descargar">
              <Icon name="picture_as_pdf" />
            </button>
          </>
        }
      />

      {/* ── Physical policy card ───────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-brand text-on-primary p-5 sm:p-6 relative overflow-hidden mb-5 shadow-elev-primary">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-accent-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Left: Branding + policy number */}
          <div className="flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-widest opacity-70 mb-0.5">La Mundial de Seguros</p>
                <p className="font-bold text-body-lg">Auto Casco</p>
              </div>
              <StatusChip status={policy.estado} size="sm" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest opacity-70 mb-1">Número de póliza</p>
              <p className="font-mono text-[22px] sm:text-[26px] font-bold tracking-wider leading-none">
                {policy.numero}
              </p>
            </div>
          </div>

          {/* Right: Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] opacity-70 uppercase tracking-wider mb-0.5">Vehículo</p>
              <p className="font-semibold truncate">{vehicle?.marca} {vehicle?.modelo}</p>
              <p className="text-caption opacity-80">{vehicle?.anio} · {vehicle?.placa}</p>
            </div>
            <div>
              <p className="text-[10px] opacity-70 uppercase tracking-wider mb-0.5">Plan</p>
              <p className="font-semibold">{policy.plan}</p>
              <p className="text-caption opacity-80">{policy.modalidad}</p>
            </div>
            <div>
              <p className="text-[10px] opacity-70 uppercase tracking-wider mb-0.5">Vigencia desde</p>
              <p className="font-semibold">{policy.vigenciaDesde}</p>
            </div>
            <div>
              <p className="text-[10px] opacity-70 uppercase tracking-wider mb-0.5">Vigencia hasta</p>
              <p className="font-semibold">{policy.vigenciaHasta}</p>
            </div>
          </div>
        </div>

        {/* Days progress bar at the bottom */}
        <div className="relative mt-5 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-caption mb-1.5">
            <span className="opacity-80">Días de cobertura restantes</span>
            <span className="font-bold">
              {policy.diasRestantes} / {policy.diasContratados} días
            </span>
          </div>
          <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-full transition-all shadow-[0_0_8px_rgba(255,200,0,0.4)]"
              style={{ width: `${diasPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Vehicle card */}
          <div className="card p-0 overflow-hidden">
            <div className="relative h-52 sm:h-64 bg-surface-container">
              {vehicle && (
                <img src={vehicle.image} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute top-3 right-3">
                <StatusChip status={policy.estado} />
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2 text-white flex-wrap">
                <div className="bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <p className="text-[10px] opacity-80 uppercase tracking-wider">Placa</p>
                  <p className="text-headline-md font-bold tracking-wider">{vehicle?.placa}</p>
                </div>
                <div className="bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <p className="text-[10px] opacity-80 uppercase tracking-wider">Color</p>
                  <p className="font-bold">{vehicle?.color}</p>
                </div>
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <VField label="Marca" value={vehicle?.marca} />
              <VField label="Modelo" value={vehicle?.modelo} />
              <VField label="Año" value={vehicle?.anio} />
              <VField label="Versión" value={vehicle?.version} />
              <VField label="Tipo" value={vehicle?.tipo} />
              <VField label="Color" value={vehicle?.color} />
              <VField label="Puestos" value={vehicle?.puestos} />
              <VField label="Kilometraje" value={vehicle?.kilometraje ? vehicle.kilometraje.toLocaleString() + ' km' : '—'} />
              <VField label="Serial / VIN" value={vehicle?.serial} className="col-span-2 sm:col-span-4" mono />
            </div>
          </div>

          {/* Coverages */}
          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-4 flex items-center gap-2">
              <Icon name="shield" className="text-primary text-[22px]" filled />
              Coberturas incluidas
              <span className="ml-auto chip bg-primary-fixed text-primary text-caption">
                {policy.coberturas.length} activas
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policy.coberturas.map((c) => {
                const iconName = COVERAGE_ICONS[c.nombre] ?? 'verified_user'
                const colorCls = COVERAGE_COLORS[c.nombre] ?? 'bg-primary-fixed text-primary'
                return (
                  <div
                    key={c.nombre}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 hover:border-primary/30 transition"
                  >
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorCls)}>
                      <Icon name={iconName} filled />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface truncate text-label-md">{c.nombre}</p>
                      <p className="text-caption text-on-surface-variant">
                        Límite:{' '}
                        <span className="font-bold text-primary">
                          {typeof c.limite === 'number' ? `$${c.limite.toLocaleString()}` : c.limite}
                        </span>
                      </p>
                    </div>
                    <Icon name="check_circle" className="text-success text-[20px] shrink-0" filled />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Inspections */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                <Icon name="photo_camera" className="text-primary text-[20px]" />
                Inspecciones
              </h3>
              <Link to="/inspecciones/nueva" className="btn-ghost py-1.5 px-3 text-caption">
                <Icon name="add" /> Nueva
              </Link>
            </div>
            {policyInspections.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-on-surface-variant">
                <Icon name="photo_camera" className="text-[40px] opacity-20" />
                <p className="text-body-md">Sin inspecciones para este vehículo</p>
                <Link to="/inspecciones/nueva" className="btn-primary mt-1">
                  <Icon name="add_a_photo" /> Crear inspección
                </Link>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-outline-variant/40">
                {policyInspections.map((i) => (
                  <Link
                    to={`/inspecciones/${i.id}`}
                    key={i.id}
                    className="flex items-center gap-3 py-3 hover:bg-surface-container-low rounded-lg px-2 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                      <Icon name="verified" filled />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-bold truncate">{i.numero}</p>
                      <p className="text-caption text-on-surface-variant truncate">{i.tipo}</p>
                    </div>
                    <StatusChip status={i.estado} size="sm" />
                    <Icon name="chevron_right" className="hidden sm:inline text-on-surface-variant" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Financial summary */}
          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-4 flex items-center gap-2">
              <Icon name="payments" className="text-primary text-[20px]" />
              Resumen financiero
            </h3>

            {/* Days ring-like visual */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="var(--color-outline-variant)" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="22"
                    fill="none"
                    stroke="url(#prog)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - diasPct / 100)}`}
                  />
                  <defs>
                    <linearGradient id="prog" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0F1A5A" />
                      <stop offset="100%" stopColor="#E31937" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[15px] font-bold text-primary leading-none">{policy.diasRestantes}</span>
                  <span className="text-[9px] text-on-surface-variant leading-none">días</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-on-surface">{policy.diasRestantes} días restantes</p>
                <p className="text-caption text-on-surface-variant">
                  de {policy.diasContratados} contratados
                </p>
                <p className="text-caption text-primary font-semibold mt-0.5">
                  {Math.round(diasPct)}% de cobertura
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <FinRow label="Prima total" value={`$${policy.prima.toLocaleString()}`} />
              <FinRow label="Saldo disponible" value={`$${policy.saldo.toFixed(2)}`} bold />
              <FinRow label="Modalidad" value={policy.modalidad} />
              <FinRow label="Días contratados" value={`${policy.diasContratados} días`} />
              <FinRow label="Vigencia desde" value={policy.vigenciaDesde} />
              <FinRow label="Vigencia hasta" value={policy.vigenciaHasta} />
            </div>
          </div>

          {/* CTA */}
          <div className="card-elev2 p-4 sm:p-5 bg-gradient-brand-soft text-on-primary relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-accent-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h3 className="text-headline-md mb-1">¿Necesitas más cobertura?</h3>
              <p className="text-body-md opacity-80 mb-3">
                Compra días adicionales y mantén tu protección activa al instante.
              </p>
              <Link to="/cobertura" className="btn-accent w-full justify-center">
                <Icon name="bolt" /> Activar más días
              </Link>
            </div>
          </div>

          {/* Contact card */}
          <div className="card p-4 border border-primary/20 bg-primary-fixed/10">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="support_agent" className="text-primary text-[22px]" filled />
              <p className="font-bold text-on-surface">Soporte 24/7</p>
            </div>
            <p className="text-caption text-on-surface-variant mb-3">
              ¿Dudas sobre tu póliza? Estamos disponibles a toda hora.
            </p>
            <Link to="/ayuda" className="btn-soft w-full justify-center">
              <Icon name="forum" /> Ir a Ayuda
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}

function VField({ label, value, mono, className }) {
  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-0.5 truncate">
        {label}
      </p>
      <p className={clsx('text-body-md text-on-surface font-semibold truncate', mono && 'font-mono text-[13px]')}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function FinRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 pb-2 last:border-0">
      <span className="text-caption text-on-surface-variant">{label}</span>
      <span className={clsx('text-right min-w-0 truncate max-w-[55%]', bold ? 'font-bold text-body-md text-on-surface' : 'text-label-md text-on-surface')}>
        {value}
      </span>
    </div>
  )
}
