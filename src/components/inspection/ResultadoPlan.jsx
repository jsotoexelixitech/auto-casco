import { useState } from 'react'
import clsx from 'clsx'
import PageHeader from '../ui/PageHeader'
import Icon from '../ui/Icon'
import { PLAN_TONES, PIEZA_TONES } from '../../theme/tokens'
import { getActiveSequences } from '../../utils/sequencesConfig'

const ESTADO_STYLE = {
  B:  { label: 'Buena',     ...PIEZA_TONES.B,  icon: 'check_circle'  },
  R:  { label: 'Regular',   ...PIEZA_TONES.R,  icon: 'warning'       },
  M:  { label: 'Mala',      ...PIEZA_TONES.M,  icon: 'cancel'        },
  NE: { label: 'No existe', ...PIEZA_TONES.NE, icon: 'remove_circle' },
}

export default function ResultadoPlan({ resultado, inspectionNumber, navigate, photos, onContratar }) {
  const { plan, planesDisponibles, elegible, piezas, motivo } = resultado
  const [planSel, setPlanSel] = useState(plan)
  const [expandedZone, setExpandedZone] = useState(null)

  const activeSequences = getActiveSequences()

  const zonasAnalizadas = activeSequences
    .filter((s) => photos?.[s.id]?.analyzed)
    .map((s) => {
      const ph = photos[s.id]
      const todasLasPiezas = [...s.piezas, ...(s.piezasOpcionales || [])]
      const piezasResult = todasLasPiezas.map((nombre) => ({
        nombre,
        ...(ph.piezas?.[nombre] ?? { estado: 'B', comentario: '' }),
      }))
      const counts = { B: 0, R: 0, M: 0, NE: 0 }
      piezasResult.forEach((p) => { if (counts[p.estado] !== undefined) counts[p.estado]++ })
      return { seq: s, ph, piezasResult, counts }
    })

  const totalPiezasAnalizadas = zonasAnalizadas.reduce((acc, z) => acc + z.piezasResult.length, 0)

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Inspecciones', to: '/inspecciones' },
          { label: inspectionNumber },
        ]}
        eyebrow={inspectionNumber}
        title="Resultado de Inspección IA"
        subtitle={`Análisis Gemini Vision · ${zonasAnalizadas.length} zonas · ${totalPiezasAnalizadas} piezas evaluadas`}
        actions={
          <button onClick={() => navigate('/inspecciones')} className="btn-soft">
            <Icon name="list" /> Inspecciones
          </button>
        }
      />

      {/* ── Resumen global ─────────────────────────────────────────────── */}
      <div className="card p-4 sm:p-5" style={{ borderTop: '3px solid #0F1A5A' }}>
        <h3 className="text-headline-md text-on-surface mb-1 flex items-center gap-2">
          <Icon name="auto_awesome" className="text-primary text-[22px]" filled />
          Resumen del análisis
        </h3>
        <p className="text-caption text-on-surface-variant mb-4">
          {zonasAnalizadas.length} zona(s) analizadas · {totalPiezasAnalizadas} piezas en total
          {' — cada foto puede cubrir múltiples piezas del mismo sector del vehículo.'}
        </p>

        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
          <PiezaStat label="Buenas"    value={piezas.buenas}    tone="success" icon="check_circle" />
          <PiezaStat label="Regulares" value={piezas.regulares} tone="warning" icon="warning" />
          <PiezaStat label="Malas"     value={piezas.malas}     tone="error"   icon="cancel" />
          <PiezaStat label="Total eval." value={totalPiezasAnalizadas} tone="neutral" icon="analytics" />
        </div>

        {totalPiezasAnalizadas > 0 && (
          <div className="flex h-3 rounded-full overflow-hidden mb-2 gap-0.5">
            {piezas.buenas > 0 && (
              <div className="bg-green-500 transition-all rounded-l-full"
                style={{ width: `${(piezas.buenas / totalPiezasAnalizadas) * 100}%` }} />
            )}
            {piezas.regulares > 0 && (
              <div className="bg-amber-400 transition-all"
                style={{ width: `${(piezas.regulares / totalPiezasAnalizadas) * 100}%` }} />
            )}
            {piezas.malas > 0 && (
              <div className="bg-red-500 transition-all rounded-r-full"
                style={{ width: `${(piezas.malas / totalPiezasAnalizadas) * 100}%` }} />
            )}
          </div>
        )}
        <div className="flex gap-4 text-caption text-on-surface-variant">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> {Math.round((piezas.buenas / (totalPiezasAnalizadas || 1)) * 100)}% buenas</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> {Math.round((piezas.regulares / (totalPiezasAnalizadas || 1)) * 100)}% regulares</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> {Math.round((piezas.malas / (totalPiezasAnalizadas || 1)) * 100)}% malas</span>
        </div>

        <div className="mt-4 p-3 rounded-xl border"
          style={{
            backgroundColor: elegible ? '#EEF9F1' : '#FFF0F0',
            borderColor:     elegible ? '#86EFAC' : '#FCA5A5',
            color:           elegible ? '#166534' : '#991B1B',
          }}>
          <div className="flex items-start gap-2">
            <Icon name={elegible ? 'task_alt' : 'gpp_bad'} className="text-[20px] mt-0.5 shrink-0" filled />
            <p className="font-semibold leading-snug text-body-md">{motivo}</p>
          </div>
        </div>
      </div>

      {/* ── Detalle por zona ───────────────────────────────────────────── */}
      {zonasAnalizadas.length > 0 && (
        <div className="card p-4 sm:p-5" style={{ borderTop: '3px solid #0F1A5A' }}>
          <h3 className="text-headline-md text-on-surface mb-1 flex items-center gap-2">
            <Icon name="photo_library" className="text-primary text-[22px]" filled />
            Detalle por zona fotográfica
          </h3>
          <p className="text-caption text-on-surface-variant mb-4">
            Toca cualquier zona para ver el estado de cada pieza individualmente.
          </p>
          <div className="flex flex-col gap-2">
            {zonasAnalizadas.map(({ seq, ph, piezasResult, counts }) => {
              const expanded = expandedZone === seq.id
              const hasDamage = counts.R > 0 || counts.M > 0
              return (
                <div key={seq.id} className="rounded-xl border border-outline-variant/50 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-container-low transition-colors"
                    onClick={() => setExpandedZone(expanded ? null : seq.id)}
                  >
                    {ph.thumbnail && (
                      <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                        <img src={ph.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-on-surface text-label-md">{seq.nombre}</p>
                        {hasDamage && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            ⚠ Daños detectados
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[11px] text-green-700 font-semibold">{counts.B} buenas</span>
                        {counts.R > 0 && <span className="text-[11px] text-amber-700 font-semibold">{counts.R} regulares</span>}
                        {counts.M > 0 && <span className="text-[11px] text-red-700 font-semibold">{counts.M} malas</span>}
                        {counts.NE > 0 && <span className="text-[11px] text-slate-500 font-semibold">{counts.NE} no existen</span>}
                        <span className="text-[11px] text-on-surface-variant">· {piezasResult.length} piezas</span>
                      </div>
                    </div>
                    <Icon name={expanded ? 'expand_less' : 'expand_more'} className="text-[22px] text-on-surface-variant shrink-0" />
                  </button>

                  {expanded && (
                    <div className="border-t border-outline-variant/30 px-3 pb-3 pt-2 bg-surface-container-low/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {piezasResult.map((pieza) => {
                          const s = ESTADO_STYLE[pieza.estado] ?? ESTADO_STYLE.B
                          return (
                            <div key={pieza.nombre} className="flex items-start gap-2 p-2 rounded-lg"
                              style={{ backgroundColor: s.bg }}>
                              <Icon name={s.icon} className="text-[16px] shrink-0 mt-0.5" style={{ color: s.fg }} filled />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[12px] font-bold text-on-surface">{pieza.nombre}</span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: s.fg }}>
                                    {s.label}
                                  </span>
                                  {pieza.confianza !== undefined && (
                                    <span className="text-[10px] text-on-surface-variant">
                                      {Math.round(pieza.confianza * 100)}% confianza
                                    </span>
                                  )}
                                </div>
                                {pieza.comentario && (
                                  <p className="text-[11px] mt-0.5" style={{ color: s.fg }}>{pieza.comentario}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Plan recomendado ───────────────────────────────────────────── */}
      {elegible && planSel ? (
        <div className="flex flex-col gap-3">
          {planesDisponibles.length > 1 && (
            <div className="card p-4">
              <p className="text-label-md text-on-surface-variant mb-3 uppercase tracking-wide text-[11px] font-bold">
                Planes disponibles para tu vehículo
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {planesDisponibles.map((p) => {
                  const t = PLAN_TONES[p.color] ?? PLAN_TONES.success
                  const sel = planSel.id === p.id
                  return (
                    <button key={p.id} onClick={() => setPlanSel(p)}
                      className={clsx(
                        'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                        sel ? 'ring-2 ring-offset-1' : 'hover:border-outline-variant',
                      )}
                      style={sel ? { backgroundColor: t.bg, borderColor: t.fg } : { borderColor: '#E0E0E0' }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: t.bg, color: t.fg }}>
                        <Icon name={p.icono} className="text-[22px]" filled />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface">{p.nombre}</p>
                        <p className="text-caption text-on-surface-variant truncate">{p.subtitulo}</p>
                      </div>
                      {sel && <Icon name="check_circle" className="text-[22px] shrink-0" style={{ color: t.fg }} filled />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {(() => {
            const t = PLAN_TONES[planSel.color] ?? PLAN_TONES.success
            return (
              <div className="rounded-2xl p-5 sm:p-6 border-2"
                style={{ backgroundColor: t.bg, borderColor: t.border }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-elev-1"
                    style={{ backgroundColor: 'white', color: t.fg }}>
                    <Icon name={planSel.icono} className="text-[34px]" filled />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-display-sm font-bold" style={{ color: t.fg }}>{planSel.nombre}</h2>
                      <span className="text-caption font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: t.fg }}>
                        {planSel.badge}
                      </span>
                    </div>
                    <p className="text-label-md font-semibold" style={{ color: t.fg }}>{planSel.subtitulo}</p>
                  </div>
                </div>

                <p className="text-body-md mb-4 leading-relaxed" style={{ color: t.fg }}>{planSel.descripcion}</p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Prima diaria',  value: `$${planSel.prima.diaria.toFixed(2)}` },
                    { label: 'Prima mensual', value: `$${planSel.prima.mensual}` },
                    { label: 'Prima anual',   value: `$${planSel.prima.anual}` },
                  ].map((p) => (
                    <div key={p.label} className="bg-white/60 rounded-xl p-3 text-center">
                      <p className="text-[11px] text-on-surface-variant uppercase tracking-wide mb-0.5">{p.label}</p>
                      <p className="text-headline-md font-bold" style={{ color: t.fg }}>{p.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/60 rounded-xl p-4">
                  <p className="text-label-md font-bold text-on-surface mb-3 uppercase tracking-wide text-[11px]">Coberturas incluidas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {planSel.coberturas.map((c) => (
                      <div key={c.nombre} className="flex items-center gap-2">
                        <Icon name={c.incluida ? 'check_circle' : 'cancel'} className="text-[18px] shrink-0"
                          style={{ color: c.incluida ? t.fg : '#9CA3AF' }} filled />
                        <span className={clsx('text-body-md', c.incluida ? 'text-on-surface font-medium' : 'text-on-surface-variant line-through')}>
                          {c.nombre}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onContratar ? onContratar(planSel) : navigate('/emision')}
              className="btn-accent flex-1 py-3 text-body-lg"
            >
              <Icon name="payments" className="text-[22px]" filled />
              Contratar {planSel.nombre} — Proceder al pago
            </button>
            <button onClick={() => navigate('/inspecciones')} className="btn-soft flex-1 sm:flex-none">
              <Icon name="list" /> Ver Inspecciones
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-5 sm:p-6 flex flex-col items-center text-center gap-4 border-2 border-error/30">
          <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center">
            <Icon name="gpp_bad" className="text-[40px] text-error" filled />
          </div>
          <div>
            <h3 className="text-headline-lg font-bold text-error mb-2">Vehículo No Asegurable</h3>
            <p className="text-body-md text-on-surface-variant max-w-md leading-relaxed">{motivo}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <button onClick={() => navigate('/inspecciones/nueva')} className="btn-primary flex-1">
              <Icon name="refresh" /> Nueva Inspección
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-soft flex-1">
              <Icon name="home" /> Inicio
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PiezaStat({ label, value, tone, icon }) {
  const s = PLAN_TONES[tone] ?? PLAN_TONES.neutral
  return (
    <div className="rounded-xl p-3 text-center" style={{ backgroundColor: s.bg }}>
      <Icon name={icon} className="text-[22px] sm:text-[26px] mb-1" style={{ color: s.fg }} filled />
      <p className="text-headline-md sm:text-display-sm font-bold" style={{ color: s.fg }}>{value}</p>
      <p className="text-[10px] sm:text-caption font-semibold" style={{ color: s.fg }}>{label}</p>
    </div>
  )
}
