import { Link } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import { PLANES, CONFIG_DEFAULTS } from '../utils/planEngine'
import { PLAN_TONES, BRAND } from '../theme/tokens'

const C = { navy: BRAND.navy, deep: BRAND.deep }

const PLANES_LIST = [PLANES.COBERTURA_AMPLIA, PLANES.COBERTURA_AMPLIA_CON_DEDUCIBLE, PLANES.PERDIDA_TOTAL, PLANES.RCV]

// Rules derived from planEngine CONFIG_DEFAULTS so they stay in sync
const { minBuenasAmplia, minBuenasConDeducible, minBuenasPerdidaTotal } = CONFIG_DEFAULTS

const REGLAS = [
  {
    label: `≥ ${minBuenasAmplia} buenas`,
    planes: ['Cobertura Amplia (sin deducible)', 'Pérdida Total'],
    tone: 'success',
    icon: 'verified_user',
    desc: 'Vehículo en excelentes condiciones',
  },
  {
    label: `${minBuenasConDeducible} – ${minBuenasAmplia - 1} buenas`,
    planes: ['Cobertura Amplia con deducible'],
    tone: 'warning',
    icon: 'shield_with_heart',
    desc: 'Deducible proporcional al daño detectado',
  },
  {
    label: `${minBuenasPerdidaTotal} – ${minBuenasConDeducible - 1} buenas`,
    planes: ['Pérdida Total'],
    tone: 'error',
    icon: 'car_crash',
    desc: 'Solo cobertura catastrófica',
  },
  {
    label: `< ${minBuenasPerdidaTotal} buenas`,
    planes: ['No asegurable'],
    tone: 'neutral',
    icon: 'gpp_bad',
    desc: 'No cumple requisitos mínimos',
  },
]

export default function CoveragePage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Planes de Seguro' }]}
        title="Planes de Seguro"
        subtitle="La IA analiza las fotos de tu vehículo y determina automáticamente el plan disponible."
        actions={
          <Link to="/inspecciones/nueva" className="btn-accent">
            <Icon name="add_a_photo" /> Iniciar Inspección
          </Link>
        }
      />

      {/* ── Cómo funciona ────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 sm:p-5 mb-5 text-white relative overflow-hidden"
        style={{ backgroundColor: C.deep }}>
        <span className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl bg-white/30" />
        <div className="pl-3">
          <h2 className="text-headline-lg font-bold mb-1 flex items-center gap-2">
            <Icon name="auto_awesome" className="text-[22px]" filled />
            Inspección IA → Plan automático
          </h2>
          <p className="text-white/75 text-body-md mb-4">
            Gemini Vision analiza cada foto, clasifica el estado de las piezas (Buena / Regular / Mala)
            y aplica las reglas de La Mundial para determinar el plan elegible.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { step: '1', icon: 'add_a_photo',   text: 'Fotografías guiadas' },
              { step: '2', icon: 'auto_awesome',  text: 'Gemini Vision analiza' },
              { step: '3', icon: 'policy',        text: 'Plan determinado' },
              { step: '4', icon: 'rocket_launch', text: 'Emite tu póliza' },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-label-md">
                  {s.step}
                </div>
                <div className="min-w-0">
                  <Icon name={s.icon} className="text-[16px]" filled />
                  <p className="text-[11px] font-semibold leading-snug mt-0.5">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reglas de elegibilidad (sincronizadas con planEngine) ──────────── */}
      <section className="mb-5">
        <h3 className="text-headline-md font-bold mb-3" style={{ color: C.navy }}>
          Reglas de elegibilidad — basadas en piezas BUENAS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {REGLAS.map((r) => {
            const t = PLAN_TONES[r.tone]
            return (
              <div key={r.label} className="rounded-xl p-4 border-2"
                style={{ backgroundColor: t.bg, borderColor: t.border }}>
                <Icon name={r.icon} className="text-[28px] mb-2" style={{ color: t.fg }} filled />
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: t.fg }}>
                  Piezas en buen estado
                </p>
                <p className="text-headline-md font-bold mb-1" style={{ color: t.fg }}>{r.label}</p>
                <p className="text-[11px] mb-2" style={{ color: t.fg, opacity: 0.8 }}>{r.desc}</p>
                <div className="flex flex-col gap-1">
                  {r.planes.map((p) => (
                    <span key={p} className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-white/60"
                      style={{ color: t.fg }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Tarjetas de planes ────────────────────────────────────────────── */}
      <section className="mb-6">
        <h3 className="text-headline-md font-bold mb-3" style={{ color: C.navy }}>
          Planes disponibles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANES_LIST.map((plan) => {
            const t = PLAN_TONES[plan.color] ?? PLAN_TONES.neutral
            return (
              <div key={plan.id} className="rounded-2xl p-5 border-2 flex flex-col"
                style={{ backgroundColor: t.bg, borderColor: t.border }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm shrink-0"
                    style={{ color: t.fg }}>
                    <Icon name={plan.icono} className="text-[30px]" filled />
                  </div>
                  <div>
                    <h4 className="text-headline-md font-bold" style={{ color: t.fg }}>{plan.nombre}</h4>
                    <p className="text-caption font-semibold" style={{ color: t.fg }}>{plan.subtitulo}</p>
                  </div>
                </div>

                <p className="text-body-md mb-4 leading-relaxed flex-1" style={{ color: t.fg }}>
                  {plan.descripcion}
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Diaria',  value: `$${plan.prima.diaria}` },
                    { label: 'Mensual', value: `$${plan.prima.mensual}` },
                    { label: 'Anual',   value: `$${plan.prima.anual}` },
                  ].map((p) => (
                    <div key={p.label} className="bg-white/60 rounded-xl p-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: t.fg }}>{p.label}</p>
                      <p className="font-bold text-label-md" style={{ color: t.fg }}>{p.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/50 rounded-xl p-3 mb-4">
                  {plan.coberturas.map((c) => (
                    <div key={c.nombre} className="flex items-center gap-2 py-1">
                      <Icon
                        name={c.incluida ? 'check_circle' : 'cancel'}
                        className="text-[16px] shrink-0"
                        style={{ color: c.incluida ? t.fg : '#9CA3AF' }}
                        filled
                      />
                      <span className={clsx(
                        'text-[12px]',
                        c.incluida ? 'font-medium text-on-surface' : 'text-on-surface-variant line-through',
                      )}>
                        {c.nombre}
                      </span>
                    </div>
                  ))}
                </div>

                <span className="text-caption font-bold px-3 py-1 rounded-full text-white text-center"
                  style={{ backgroundColor: t.fg }}>
                  {plan.badge}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Link to="/inspecciones/nueva" className="btn-accent flex-1 py-3 text-body-md justify-center">
          <Icon name="add_a_photo" className="text-[20px]" />
          Realizar inspección y obtener mi plan
        </Link>
        <Link to="/emision" className="btn-primary flex-1 py-3 text-body-md justify-center">
          <Icon name="rocket_launch" className="text-[20px]" />
          Ya tengo un plan — Emitir póliza
        </Link>
      </div>
    </>
  )
}
