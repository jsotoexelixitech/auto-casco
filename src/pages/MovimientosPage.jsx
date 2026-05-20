import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import StatusChip from '../components/ui/StatusChip'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { PLANES } from '../utils/planEngine'
import { BRAND, PLAN_TONES } from '../theme/tokens'

const PLAN_MAP = {
  cobertura_amplia:                 PLANES.COBERTURA_AMPLIA,
  cobertura_amplia_con_deducible:   PLANES.COBERTURA_AMPLIA_CON_DEDUCIBLE,
  perdida_total:                    PLANES.PERDIDA_TOTAL,
}

export default function MovimientosPage() {
  const { user } = useAuth()
  const { policies, inspections, activities, pagos, siniestros, getVehicle } = useData()

  const myPolicy   = policies?.[0]
  const myVehicle  = getVehicle(myPolicy?.vehicleId)
  const lastInsp   = inspections?.slice()
    .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))[0]
  const planActual = myPolicy?.plan
    ? Object.values(PLANES).find((p) => p.nombre === myPolicy.plan)
    : null

  // ── Summary stats (informational only) ──────────────────────────────
  const stats = [
    { icon: 'policy',      label: 'Pólizas activas', value: policies?.filter((p) => p.estado === 'Activa').length ?? 0, tone: 'navy' },
    { icon: 'verified',    label: 'Inspecciones',    value: inspections?.length ?? 0, tone: 'green' },
    { icon: 'car_crash',   label: 'Siniestros',      value: siniestros?.length ?? 0, tone: 'amber' },
    { icon: 'payments',    label: 'Pagos',           value: pagos?.length ?? 0, tone: 'purple' },
  ]

  const STAT_TONES = {
    navy:   { bg: '#EEF0FA', fg: BRAND.navy },
    green:  { bg: '#DCFCE7', fg: '#16A34A' },
    amber:  { bg: '#FEF3C7', fg: '#D97706' },
    purple: { bg: '#EDE9FE', fg: '#6D28D9' },
  }

  return (
    <>
      <PageHeader
        eyebrow={`Hola, ${user?.name?.split(' ')[0] ?? 'Usuario'}`}
        title="Mis Movimientos"
        subtitle="Historial e información de tus pólizas, inspecciones, siniestros y pagos."
      />

      {/* ── Summary cards (info only) ────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats.map((s) => {
          const t = STAT_TONES[s.tone]
          return (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: t.bg, color: t.fg }}>
                <Icon name={s.icon} className="text-[24px]" filled />
              </div>
              <div className="min-w-0">
                <p className="text-display-sm font-bold leading-none" style={{ color: t.fg }}>
                  {s.value}
                </p>
                <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wide mt-1">
                  {s.label}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Vehículo + plan actual (info only) ───────────────────────── */}
      {myVehicle && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <div className="lg:col-span-2 card p-3 sm:p-4 flex flex-col md:flex-row gap-3 md:gap-4"
            style={{ borderTop: `3px solid ${BRAND.navy}` }}>
            <div className="md:w-[52%] aspect-[16/10] md:aspect-auto md:min-h-[180px] rounded-xl overflow-hidden relative bg-surface-container shrink-0">
              <img src={myVehicle.image} alt={`${myVehicle.marca} ${myVehicle.modelo}`}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {myPolicy && (
                <div className="absolute top-2 left-2">
                  <StatusChip status={myPolicy.estado} size="sm" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between text-white gap-1">
                <span className="bg-black/55 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-bold">
                  {myVehicle.placa}
                </span>
                {myPolicy && (
                  <span className="bg-black/55 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-mono">
                    #{myPolicy.numero}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between min-w-0 pt-1">
              <div>
                <p className="text-caption text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                  Vehículo principal
                </p>
                <h3 className="text-headline-md font-bold truncate" style={{ color: BRAND.navy }}>
                  {myVehicle.marca} {myVehicle.modelo} {myVehicle.anio}
                </h3>
                <p className="text-body-md text-on-surface-variant truncate mb-3">
                  {myVehicle.version} · {myVehicle.color}
                </p>
                <div className="grid grid-cols-2 gap-2 text-caption">
                  <VehInfo label="Placa" value={myVehicle.placa} mono />
                  <VehInfo label="Serial" value={myVehicle.serial?.slice(0, 10) + '…'} mono />
                  <VehInfo label="Color" value={myVehicle.color} />
                  <VehInfo label="Km" value={myVehicle.kilometraje?.toLocaleString('es-VE')} />
                </div>
              </div>
            </div>
          </div>

          {/* Plan actual */}
          <div className="flex flex-col gap-3">
            {planActual ? (
              <PlanCard plan={planActual} policy={myPolicy} />
            ) : (
              <div className="card p-5 flex flex-col items-center text-center gap-3 h-full justify-center"
                style={{ borderTop: '3px solid #ACACAC' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#EEF0FA', color: BRAND.navy }}>
                  <Icon name="policy" className="text-[32px]" filled />
                </div>
                <div>
                  <p className="font-bold text-on-surface text-headline-md">Sin plan activo</p>
                  <p className="text-caption text-on-surface-variant mt-1 leading-snug">
                    Aún no tienes pólizas vigentes asociadas a este vehículo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Última inspección (info) ─────────────────────────────────── */}
      {lastInsp && (
        <section className="mb-5">
          <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
            <h3 className="text-headline-md font-bold mb-3" style={{ color: BRAND.navy }}>
              Última Inspección
            </h3>
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#EEF0FA', color: BRAND.navy }}>
                <Icon name="verified" className="text-[26px]" filled />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface">{lastInsp.numero}</p>
                <p className="text-caption text-on-surface-variant">
                  {lastInsp.tipo} · {new Date(lastInsp.fechaCreacion).toLocaleDateString('es-VE', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <StatusChip status={lastInsp.estado} />
            </div>
            {lastInsp.planRecomendado && PLAN_MAP[lastInsp.planRecomendado] && (() => {
              const p = PLAN_MAP[lastInsp.planRecomendado]
              const t = PLAN_TONES[p.color] ?? PLAN_TONES.success
              return (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl text-caption font-semibold"
                  style={{ backgroundColor: t.bg, color: t.fg }}>
                  <Icon name={p.icono} className="text-[18px]" filled />
                  Plan recomendado por IA: <strong>{p.nombre}</strong>
                </div>
              )
            })()}
          </div>
        </section>
      )}

      {/* ── Historial de pagos + Actividad reciente ──────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Historial de pagos */}
        <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
          <h3 className="text-headline-md font-bold mb-3" style={{ color: BRAND.navy }}>
            Pagos recientes
          </h3>
          {pagos && pagos.length > 0 ? (
            <div className="flex flex-col divide-y divide-outline-variant/30">
              {pagos.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#EEF0FA', color: BRAND.navy }}>
                    <Icon name="payments" className="text-[20px]" filled />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate text-label-md">{p.concepto}</p>
                    <p className="text-caption text-on-surface-variant truncate">
                      {p.fecha} · {p.metodo}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-on-surface text-label-md">
                      ${Number(p.monto ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant">
                      {p.estado}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="payments" label="Sin pagos registrados" />
          )}
        </div>

        {/* Actividad reciente */}
        <div className="card p-4 sm:p-5" style={{ borderTop: '3px solid #ACACAC' }}>
          <h3 className="text-headline-md font-bold mb-3" style={{ color: BRAND.navy }}>
            Actividad reciente
          </h3>
          {activities && activities.length > 0 ? (
            <div className="flex flex-col divide-y divide-outline-variant/30">
              {activities.slice(0, 6).map((a) => {
                const ic = ACTIVITY_TONES[a.tone] ?? ACTIVITY_TONES.primary
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: ic.bg, color: ic.fg }}>
                      <Icon name={a.icon} className="text-[20px]" filled />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-semibold text-on-surface truncate">{a.title}</p>
                      <p className="text-caption text-on-surface-variant truncate">{a.subtitle}</p>
                    </div>
                    <p className="text-[11px] text-on-surface-variant shrink-0">{a.when}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon="history" label="Sin actividad reciente" />
          )}
        </div>
      </section>

      {/* ── Siniestros (si los hay) ──────────────────────────────────── */}
      {siniestros && siniestros.length > 0 && (
        <section className="mt-5">
          <div className="card p-4 sm:p-5" style={{ borderTop: '3px solid #D97706' }}>
            <h3 className="text-headline-md font-bold mb-3" style={{ color: BRAND.navy }}>
              Historial de Siniestros
            </h3>
            <div className="flex flex-col divide-y divide-outline-variant/30">
              {siniestros.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <Icon name="car_crash" className="text-[22px]" filled />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-label-md">{s.id ?? s.numero}</p>
                    <p className="text-caption text-on-surface-variant truncate">
                      {s.tipo} · {s.fecha}
                    </p>
                  </div>
                  <StatusChip status={s.estado} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

const ACTIVITY_TONES = {
  primary: { bg: '#EEF0FA', fg: BRAND.navy },
  accent:  { bg: '#EEF0FA', fg: BRAND.mid },
  success: { bg: '#D1FAE5', fg: '#065F46' },
  error:   { bg: '#FFE4E6', fg: '#991B1B' },
}

function VehInfo({ label, value, mono }) {
  return (
    <div className="bg-surface-container-low rounded-lg px-2.5 py-2">
      <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">{label}</p>
      <p className={`font-semibold text-on-surface text-[13px] truncate ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  )
}

function EmptyState({ icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-on-surface-variant">
      <Icon name={icon} className="text-[36px] opacity-50" />
      <p className="text-caption font-semibold">{label}</p>
    </div>
  )
}

function PlanCard({ plan, policy }) {
  const t = PLAN_TONES[plan.color] ?? PLAN_TONES.success

  return (
    <div className="rounded-2xl p-4 sm:p-5 border-2 flex flex-col gap-3 h-full"
      style={{ backgroundColor: t.bg, borderColor: t.border }}>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center shrink-0 shadow-sm"
          style={{ color: t.fg }}>
          <Icon name={plan.icono} className="text-[30px]" filled />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.fg }}>Plan Activo</p>
          <h3 className="text-headline-lg font-bold" style={{ color: t.fg }}>{plan.nombre}</h3>
          <p className="text-caption" style={{ color: t.fg }}>{plan.subtitulo}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-white/60 rounded-xl p-2.5">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: t.fg }}>Diaria</p>
          <p className="font-bold text-headline-md" style={{ color: t.fg }}>${plan.prima.diaria}</p>
        </div>
        <div className="bg-white/60 rounded-xl p-2.5">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: t.fg }}>Mensual</p>
          <p className="font-bold text-headline-md" style={{ color: t.fg }}>${plan.prima.mensual}</p>
        </div>
      </div>
      {policy?.vigenciaHasta && (
        <div className="bg-white/60 rounded-xl p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: t.fg }}>Vigencia hasta</p>
          <p className="font-bold text-label-md" style={{ color: t.fg }}>{policy.vigenciaHasta}</p>
        </div>
      )}
    </div>
  )
}
