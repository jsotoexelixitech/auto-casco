import { useState } from 'react'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { PLANES } from '../../utils/planEngine'

const TONE_CLASSES = {
  success: {
    bg: 'bg-success-container/50 border-success/40',
    text: 'text-on-success-container',
    badge: 'bg-success text-on-success',
    icon: 'text-success',
    bar: 'bg-success',
  },
  warning: {
    bg: 'bg-warning-container/60 border-warning/40',
    text: 'text-on-warning-container',
    badge: 'bg-warning text-on-warning',
    icon: 'text-warning',
    bar: 'bg-warning',
  },
  error: {
    bg: 'bg-error-container/50 border-error/40',
    text: 'text-on-error-container',
    badge: 'bg-error text-on-error',
    icon: 'text-error',
    bar: 'bg-error',
  },
}

function PiezasBar({ label, count, total, tone }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const tc = TONE_CLASSES[tone] ?? TONE_CLASSES.success
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-caption">
        <span className="text-on-surface-variant font-medium">{label}</span>
        <span className={clsx('font-black', tc.icon)}>{count}</span>
      </div>
      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', tc.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function ResultadoInspeccion({ resultado, onContinuar, onReinspeccionar, onPlanChange }) {
  const { plan: planRecomendado, planesDisponibles = [], elegible, piezas, motivo } = resultado

  // Cuando hay varios planes disponibles, el usuario puede elegir
  const [planSeleccionado, setPlanSeleccionado] = useState(planRecomendado)

  const handleSelectPlan = (p) => {
    setPlanSeleccionado(p)
    onPlanChange?.(p)
  }
  const plan = planSeleccionado ?? planRecomendado

  const tone = !elegible ? 'error' : plan?.color ?? 'success'
  const tc = TONE_CLASSES[tone]

  // Totales por plan para mostrar comparativa visual
  const todosLosPlanes = Object.values(PLANES)

  return (
    <div className="flex flex-col gap-5">

      {/* ── Resultado principal ──────────────────────────── */}
      <div className={clsx('rounded-2xl border p-5 sm:p-6', tc.bg)}>
        <div className="flex items-start gap-4">
          <div className={clsx(
            'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow',
            elegible ? 'bg-white/70' : 'bg-error/10',
          )}>
            <Icon
              name={elegible ? (plan?.icono ?? 'verified_user') : 'gpp_bad'}
              className={clsx('text-[32px]', tc.icon)}
              filled
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className={clsx('text-display-sm font-black', tc.text)}>
                {elegible ? plan?.nombre : 'No asegurable'}
              </h2>
              {plan?.badge && (
                <span className={clsx('text-[11px] font-bold px-2.5 py-1 rounded-full', tc.badge)}>
                  {plan.badge}
                </span>
              )}
            </div>
            {plan?.subtitulo && (
              <p className={clsx('text-label-md font-semibold mb-2', tc.text, 'opacity-80')}>
                {plan.subtitulo}
              </p>
            )}
            <p className={clsx('text-body-md leading-relaxed', tc.text)}>
              {motivo}
            </p>
          </div>
        </div>
      </div>

      {/* ── Estadísticas de piezas ───────────────────────── */}
      <div className="card p-5">
        <h3 className="text-headline-md text-on-surface mb-1 flex items-center gap-2">
          <Icon name="analytics" className="text-primary text-[20px]" filled />
          Resumen de la Inspección
        </h3>
        <p className="text-caption text-on-surface-variant mb-4">
          Resultado del análisis de {piezas.analizadas} secuencias fotográficas por Gemini Vision
        </p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Buenas', count: piezas.buenas,    tone: 'success', icon: 'check_circle' },
            { label: 'Regulares', count: piezas.regulares, tone: 'warning', icon: 'warning'       },
            { label: 'Malas',    count: piezas.malas,    tone: 'error',   icon: 'cancel'        },
          ].map(({ label, count, tone: t, icon }) => {
            const tcc = TONE_CLASSES[t]
            return (
              <div key={label} className={clsx('rounded-xl p-3 border text-center', tcc.bg)}>
                <Icon name={icon} className={clsx('text-[28px] mb-1', tcc.icon)} filled />
                <p className={clsx('text-[28px] font-black leading-none', tcc.icon)}>{count}</p>
                <p className={clsx('text-caption font-semibold mt-1', tcc.text)}>{label}</p>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-3">
          <PiezasBar label="Piezas Buenas"    count={piezas.buenas}    total={piezas.total} tone="success" />
          <PiezasBar label="Piezas Regulares" count={piezas.regulares} total={piezas.total} tone="warning" />
          <PiezasBar label="Piezas Malas"     count={piezas.malas}     total={piezas.total} tone="error"   />
        </div>

        {/* Regla aplicada */}
        <div className="mt-4 p-3 bg-surface-container rounded-xl flex items-start gap-2">
          <Icon name="info" className="text-primary text-[18px] mt-0.5 shrink-0" />
          <div className="text-caption text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface">Regla aplicada:</strong>{' '}
            {piezas.malas + piezas.regulares > 15
              ? 'Más de 15 piezas dañadas (R+M) → No asegurable.'
              : piezas.malas + piezas.regulares >= 11
              ? '11–15 piezas dañadas → RCV solamente.'
              : piezas.malas + piezas.regulares >= 6
              ? '6–10 piezas dañadas → Pérdida Total.'
              : '≤5 piezas dañadas → Cobertura Amplia y Pérdida Total disponibles.'}
          </div>
        </div>
      </div>

      {/* ── Selector de plan (cuando hay múltiples disponibles) ── */}
      {planesDisponibles.length > 1 && (
        <div className="card p-5">
          <h3 className="text-headline-md text-on-surface mb-1 flex items-center gap-2">
            <Icon name="tune" className="text-primary text-[20px]" filled />
            Planes disponibles
          </h3>
          <p className="text-caption text-on-surface-variant mb-4">
            Tu vehículo califica para más de un plan. Selecciona el que deseas contratar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {planesDisponibles.map((p) => {
              const isActive = planSeleccionado?.id === p.id
              const ptc = TONE_CLASSES[p.color]
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlan(p)}
                  className={clsx(
                    'flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all',
                    isActive
                      ? clsx(ptc.bg, 'border-current shadow-sm ring-2 ring-offset-1')
                      : 'border-outline-variant/50 hover:border-outline-variant bg-surface-container-low/40',
                  )}
                  style={isActive ? { ringColor: p.colorHex } : {}}
                >
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    isActive ? 'shadow' : 'bg-surface-container',
                  )}
                  style={isActive ? { backgroundColor: p.colorHex } : {}}>
                    <Icon name={p.icono} className={clsx('text-[22px]', isActive ? 'text-white' : 'text-on-surface-variant')} filled />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={clsx('text-label-md font-black', isActive ? ptc.text : 'text-on-surface')}>
                        {p.nombre}
                      </span>
                      {isActive && (
                        <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', ptc.badge)}>
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className={clsx('text-caption leading-snug', isActive ? ptc.text : 'text-on-surface-variant')}>
                      {p.subtitulo}
                    </p>
                    <p className={clsx('text-label-md font-black mt-1.5', isActive ? ptc.text : 'text-primary')}>
                      ${p.prima.mensual}/mes
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Coberturas del plan recomendado ─────────────── */}
      {plan && (
        <div className="card p-5">
          <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
            <Icon name="shield" className="text-primary text-[20px]" filled />
            Coberturas incluidas en {plan.nombre}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plan.coberturas.map((cob) => (
              <div
                key={cob.nombre}
                className={clsx(
                  'flex items-center gap-3 p-2.5 rounded-lg border',
                  cob.incluida
                    ? 'bg-success-container/30 border-success/30'
                    : 'bg-surface-container/50 border-outline-variant/40 opacity-60',
                )}
              >
                <Icon
                  name={cob.incluida ? 'check_circle' : 'cancel'}
                  className={clsx('text-[18px] shrink-0', cob.incluida ? 'text-success' : 'text-on-surface-variant')}
                  filled
                />
                <span className="text-label-md text-on-surface">{cob.nombre}</span>
              </div>
            ))}
          </div>

          {/* Prima */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Mensual', valor: `$${plan.prima.mensual}` },
              { label: 'Anual',   valor: `$${plan.prima.anual}` },
              { label: 'Diaria',  valor: `$${plan.prima.diaria}` },
            ].map(({ label, valor }) => (
              <div key={label} className="rounded-xl bg-brand-50 border border-brand-200 p-3 text-center">
                <p className="text-display-sm font-black text-primary">{valor}</p>
                <p className="text-caption text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Comparativa de todos los planes ─────────────── */}
      <div className="card p-5">
        <h3 className="text-headline-md text-on-surface mb-1">Comparativa de Planes</h3>
        <p className="text-caption text-on-surface-variant mb-4">El plan resaltado es el que califica según su inspección</p>
        <div className="flex flex-col gap-2">
          {todosLosPlanes.map((p) => {
            const isSelected = p.id === plan?.id
            const ptc = TONE_CLASSES[p.color]
            return (
              <div
                key={p.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                  isSelected
                    ? clsx(ptc.bg, 'border-current shadow-sm')
                    : 'border-outline-variant/40 bg-surface-container-low/40 opacity-55',
                )}
              >
                <div className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  isSelected ? 'bg-white/70' : 'bg-surface-container',
                )}>
                  <Icon name={p.icono} className={clsx('text-[20px]', isSelected ? ptc.icon : 'text-on-surface-variant')} filled />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('text-label-md font-black', isSelected ? ptc.text : 'text-on-surface')}>
                      {p.nombre}
                    </span>
                    {isSelected && (
                      <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', ptc.badge)}>
                        ← Tu plan
                      </span>
                    )}
                  </div>
                  <p className={clsx('text-caption truncate', isSelected ? ptc.text : 'text-on-surface-variant')}>
                    {p.subtitulo}
                  </p>
                </div>
                <span className={clsx('text-label-md font-black shrink-0', isSelected ? ptc.text : 'text-on-surface-variant')}>
                  ${p.prima.mensual}/mes
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Acciones ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onReinspeccionar}
          className="btn-soft flex-1"
        >
          <Icon name="refresh" /> Re-inspeccionar
        </button>
        {elegible ? (
          <button
            onClick={onContinuar}
            className="btn-primary flex-1"
          >
            Continuar con {plan?.nombre} <Icon name="arrow_forward" />
          </button>
        ) : (
          <button disabled className="btn-primary flex-1 opacity-40 cursor-not-allowed">
            <Icon name="block" /> Vehículo No Asegurable
          </button>
        )}
      </div>
    </div>
  )
}
