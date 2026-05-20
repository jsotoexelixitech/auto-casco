import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import StatusChip from '../components/ui/StatusChip'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { PLANES } from '../utils/planEngine'

const C = {
  navy:    '#0F1A5A',
  deep:    '#091133',
  soft:    '#162A7F',
  red:     '#E84F51',
  silver:  '#ACACAC',
  silverD: '#777777',
  silverL: '#E8EAED',
}

// Mapeo plan id → datos del plan
const PLAN_MAP = {
  cobertura_amplia: PLANES.COBERTURA_AMPLIA,
  rcv:              PLANES.RCV,
  perdida_total:    PLANES.PERDIDA_TOTAL,
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { policies, inspections, activities, getVehicle } = useData()
  const navigate = useNavigate()

  const myPolicy    = policies[0]
  const myVehicle   = getVehicle(myPolicy?.vehicleId)
  const lastInsp    = inspections?.slice()
    .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))[0]
  const planActual  = myPolicy?.plan
    ? Object.values(PLANES).find((p) => p.nombre === myPolicy.plan)
    : null

  return (
    <>
      <PageHeader
        eyebrow={`Hola, ${user?.name?.split(' ')[0] ?? 'Usuario'}`}
        title="Panel de Control"
        subtitle="Inspección vehicular con IA · Plan de seguro según el estado de tu vehículo."
        actions={
          <Link to="/inspecciones/nueva" className="btn-accent">
            <Icon name="add_a_photo" className="text-[20px]" />
            <span className="hidden sm:inline">Iniciar</span> Inspección
          </Link>
        }
      />

      {/* ── Banner hero — CTA principal ─────────────────────────────────── */}
      <div
        className="rounded-2xl text-white p-5 sm:p-6 mb-4 flex flex-col sm:flex-row sm:items-center gap-4 relative overflow-hidden"
        style={{ backgroundColor: C.deep }}
      >
        <span className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: C.silver }} />
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-10"
          style={{ backgroundColor: C.soft }} />
        <div className="pl-2 flex-1 min-w-0 relative z-10">
          <p className="text-[11px] uppercase tracking-widest text-white/60 mb-1">
            {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h2 className="text-headline-lg sm:text-display-sm font-bold leading-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-white/70 mt-1 text-body-md">
            Fotografía tu vehículo y la IA determina automáticamente el plan de seguro que puedes contratar.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 relative z-10">
          <Link to="/inspecciones/nueva" className="btn-accent">
            <Icon name="photo_camera" /> Nueva Inspección
          </Link>
          <Link to="/emision"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-label-md text-white border-2 border-white/40 hover:bg-white/15 active:bg-white/20 transition-all min-h-[44px]">
            <Icon name="rocket_launch" className="text-[18px]" /> Emisión
          </Link>
        </div>
      </div>

      {/* ── Vehículo + plan actual ───────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Card vehículo */}
        {myVehicle && (
          <div className="lg:col-span-2 card p-3 sm:p-4 flex flex-col md:flex-row gap-3 md:gap-4"
            style={{ borderTop: `3px solid ${C.navy}` }}>
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
                <h3 className="text-headline-md font-bold truncate" style={{ color: C.navy }}>
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
              <Link to="/inspecciones/nueva" className="btn-primary w-full mt-3">
                <Icon name="add_a_photo" /> Inspeccionar este vehículo
              </Link>
            </div>
          </div>
        )}

        {/* Plan actual o CTA para inspeccionar */}
        <div className="flex flex-col gap-3">
          {planActual ? (
            <PlanCard plan={planActual} />
          ) : (
            <div className="card p-4 sm:p-5 flex flex-col items-center text-center gap-3 h-full justify-center"
              style={{ borderTop: `3px solid ${C.silver}` }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: '#EEF0FA', color: C.navy }}>
                <Icon name="policy" className="text-[32px]" filled />
              </div>
              <div>
                <p className="font-bold text-on-surface text-headline-md">Sin plan activo</p>
                <p className="text-caption text-on-surface-variant mt-1 leading-snug">
                  Realiza una inspección para que la IA evalúe el estado de tu vehículo y te indique los planes disponibles.
                </p>
              </div>
              <Link to="/inspecciones/nueva" className="btn-accent w-full">
                <Icon name="auto_awesome" /> Obtener mi plan
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Última inspección ───────────────────────────────────────────── */}
      {lastInsp && (
        <section className="mb-4">
          <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${C.navy}` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-headline-md font-bold" style={{ color: C.navy }}>
                Última Inspección
              </h3>
              <Link to="/inspecciones" className="text-label-md hover:underline font-semibold" style={{ color: C.navy }}>
                Ver todas
              </Link>
            </div>
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#EEF0FA', color: C.navy }}>
                <Icon name="verified" className="text-[26px]" filled />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface">{lastInsp.numero}</p>
                <p className="text-caption text-on-surface-variant">
                  {lastInsp.tipo} · {new Date(lastInsp.fechaCreacion).toLocaleDateString('es-VE')}
                </p>
              </div>
              <StatusChip status={lastInsp.estado} />
              <div className="flex gap-2">
                <button onClick={() => navigate(`/inspecciones/${lastInsp.id}`)} className="btn-soft text-caption py-1.5 px-3 min-h-[36px]">
                  <Icon name="visibility" className="text-[16px]" /> Ver
                </button>
                <button onClick={() => navigate('/emision')} className="btn-accent text-caption py-1.5 px-3 min-h-[36px]">
                  <Icon name="rocket_launch" className="text-[16px]" /> Emitir
                </button>
              </div>
            </div>
            {lastInsp.planRecomendado && PLAN_MAP[lastInsp.planRecomendado] && (
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl text-caption font-semibold"
                style={{
                  backgroundColor: PLAN_MAP[lastInsp.planRecomendado].colorBg,
                  color: PLAN_MAP[lastInsp.planRecomendado].colorHex,
                }}>
                <Icon name={PLAN_MAP[lastInsp.planRecomendado].icono} className="text-[18px]" filled />
                Plan recomendado por IA: <strong>{PLAN_MAP[lastInsp.planRecomendado].nombre}</strong>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Cómo funciona + Actividad ────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cómo funciona */}
        <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${C.navy}` }}>
          <h3 className="text-headline-md font-bold mb-4" style={{ color: C.navy }}>
            ¿Cómo funciona?
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { step: '1', icon: 'add_a_photo',    title: 'Fotografía tu vehículo',      desc: 'Sigue las secuencias guiadas. Captura las 14 zonas del vehículo.' },
              { step: '2', icon: 'auto_awesome',   title: 'Gemini Vision analiza',        desc: 'La IA clasifica cada pieza como Buena, Regular o Mala automáticamente.' },
              { step: '3', icon: 'policy',         title: 'Resultado del plan',           desc: 'El sistema calcula qué plan de seguro puedes contratar según el estado.' },
              { step: '4', icon: 'rocket_launch',  title: 'Emite tu póliza',             desc: 'Completa los datos y emite tu póliza en minutos, sin intermediarios.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-label-md"
                  style={{ backgroundColor: C.navy }}>
                  {s.step}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="font-bold text-on-surface text-label-md flex items-center gap-1.5">
                    <Icon name={s.icon} className="text-[16px]" style={{ color: C.navy }} filled />
                    {s.title}
                  </p>
                  <p className="text-caption text-on-surface-variant mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/inspecciones/nueva" className="btn-accent w-full mt-4">
            <Icon name="play_arrow" /> Comenzar ahora
          </Link>
        </div>

        {/* Actividad reciente */}
        <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${C.silver}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-headline-md font-bold" style={{ color: C.navy }}>Actividad Reciente</h3>
            <Link to="/inspecciones" className="text-label-md hover:underline font-semibold" style={{ color: C.navy }}>
              Ver todo
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-outline-variant/30">
            {activities.slice(0, 5).map((a) => {
              const iconColors = {
                primary: { bg: '#EEF0FA', fg: C.navy },
                accent:  { bg: '#EEF0FA', fg: C.soft },
                success: { bg: '#D1FAE5', fg: '#065F46' },
                error:   { bg: '#FFE4E6', fg: '#991B1B' },
              }
              const ic = iconColors[a.tone] ?? { bg: '#F5F5F5', fg: C.silverD }
              return (
                <div key={a.id}
                  className="flex items-center gap-3 py-2.5 hover:bg-surface-container-low rounded-lg px-1.5 transition">
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
        </div>
      </section>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
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

function PlanCard({ plan }) {
  const toneMap = {
    success: { bg: '#DCFCE7', fg: '#16A34A', border: '#86EFAC' },
    warning: { bg: '#FEF3C7', fg: '#D97706', border: '#FCD34D' },
    error:   { bg: '#FEE2E2', fg: '#DC2626', border: '#FCA5A5' },
  }
  const t = toneMap[plan.color] ?? toneMap.success

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
      <Link to="/emision" className="btn-accent w-full mt-auto">
        <Icon name="rocket_launch" /> Emitir Póliza
      </Link>
    </div>
  )
}
