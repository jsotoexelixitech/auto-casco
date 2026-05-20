import { useState, useMemo, useEffect } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import { PHOTO_SEQUENCES } from '../data/photoSequences'
import { getEnabledSequenceIds, saveEnabledSequenceIds } from '../utils/sequencesConfig'
import { PLAN_TONES, BRAND } from '../theme/tokens'
import { CONFIG_DEFAULTS as DEFAULTS } from '../utils/planEngine'

const LS_KEY = 'ia_config'

function loadConfig() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return { ...DEFAULTS }
}

function simularPlan(config, buenas, regulares, malas) {
  const { minBuenasAmplia, minBuenasConDeducible, minBuenasPerdidaTotal, pctRegular, pctMala, maxDeducible } = config
  if (buenas < minBuenasPerdidaTotal) return { label: 'No asegurable', tone: 'neutral', deducible: null }
  if (buenas < minBuenasConDeducible) return { label: 'Pérdida Total', tone: 'error', deducible: null }
  if (buenas < minBuenasAmplia) {
    const pct = Math.min(maxDeducible, regulares * pctRegular + malas * pctMala)
    return { label: `Cob. Amplia + ${pct}% ded.`, tone: 'warning', deducible: pct }
  }
  return { label: 'Cob. Amplia (sin ded.)', tone: 'success', deducible: null }
}

const toneMap = PLAN_TONES

function NumInput({ label, hint, value, onChange, min = 0, max = 100, step = 1, suffix = '' }) {
  const [local, setLocal] = useState(String(value))

  // Sincroniza si el valor externo cambia (ej. reset)
  useEffect(() => { setLocal(String(value)) }, [value])

  function handleChange(e) {
    setLocal(e.target.value)
    const n = Number(e.target.value)
    if (!isNaN(n) && e.target.value !== '') onChange(Math.min(max, Math.max(min, n)))
  }

  function handleBlur() {
    const n = Number(local)
    if (isNaN(n) || local === '') {
      setLocal(String(value)) // restaurar valor válido anterior
    } else {
      const clamped = Math.min(max, Math.max(min, n))
      setLocal(String(clamped))
      onChange(clamped)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-md font-semibold text-on-surface">{label}</label>
      {hint && <p className="text-caption text-on-surface-variant">{hint}</p>}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={local}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-24 rounded-xl border-2 border-outline/40 bg-white px-3 py-2 text-body-md font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 text-center transition-all"
        />
        {suffix && <span className="text-body-md text-on-surface-variant font-medium">{suffix}</span>}
      </div>
    </div>
  )
}

const C = { navy: BRAND.navy, deep: BRAND.deep }


export default function ConfiguracionIAPage() {
  const [config, setConfig] = useState(loadConfig)
  const [saved, setSaved] = useState(false)

  // ── Secuencias habilitadas ───────────────────────────────────────────────
  const [enabledSeqs, setEnabledSeqs] = useState(() => new Set(getEnabledSequenceIds()))

  function toggleSeq(id) {
    setEnabledSeqs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size <= 1) return prev // al menos 1 secuencia activa
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setSaved(false)
  }

  function toggleAllSeqs(enable) {
    setEnabledSeqs(enable ? new Set(PHOTO_SEQUENCES.map((s) => s.id)) : new Set([PHOTO_SEQUENCES[0].id]))
    setSaved(false)
  }

  function setField(key, val) {
    setConfig((prev) => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  function handleSave() {
    localStorage.setItem(LS_KEY, JSON.stringify(config))
    saveEnabledSequenceIds([...enabledSeqs])
    setSaved(true)
  }

  function handleReset() {
    setConfig({ ...DEFAULTS })
    localStorage.removeItem(LS_KEY)
    setEnabledSeqs(new Set(PHOTO_SEQUENCES.map((s) => s.id)))
    saveEnabledSequenceIds(PHOTO_SEQUENCES.map((s) => s.id))
    setSaved(false)
  }

  // Total de piezas según zonas activas
  const totalPiezasActivas = useMemo(() =>
    PHOTO_SEQUENCES.filter((s) => enabledSeqs.has(s.id))
      .reduce((sum, s) => sum + s.piezas.length, 0),
  [enabledSeqs])

  // Advertencias de coherencia
  const warnings = useMemo(() => {
    const w = []
    if (config.minBuenasAmplia > totalPiezasActivas)
      w.push(`El umbral de Cobertura Amplia (${config.minBuenasAmplia}) supera el total de piezas disponibles (${totalPiezasActivas}). Nunca se podrá alcanzar.`)
    if (config.minBuenasConDeducible >= config.minBuenasAmplia)
      w.push('El umbral "Con deducible" debe ser menor al de "Sin deducible".')
    if (config.minBuenasPerdidaTotal >= config.minBuenasConDeducible)
      w.push('El umbral "Pérdida Total" debe ser menor al "Con deducible".')
    return w
  }, [config, totalPiezasActivas])

  // Simulation table: buenas 0..totalPiezasActivas
  const simRows = useMemo(() => {
    const rows = []
    const maxB = Math.min(totalPiezasActivas, 20)
    for (let b = 0; b <= maxB; b++) {
      const r = Math.min(3, Math.round(b / 4))
      const m = b > 6 ? 1 : 0
      const result = simularPlan(config, b, r, m)
      rows.push({ buenas: b, regulares: r, malas: m, ...result })
    }
    return rows
  }, [config, totalPiezasActivas])

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Configuración IA' }]}
        title="Configuración IA"
        subtitle="Parámetros del motor de reglas de inspección vehicular. Los cambios se aplican localmente."
        eyebrow="Panel de administración"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="btn-soft">
              <Icon name="restart_alt" />
              Restaurar defaults
            </button>
            <button onClick={handleSave} className="btn-primary">
              <Icon name="save" />
              Guardar configuración
            </button>
          </div>
        }
      />

      {saved && (
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ backgroundColor: '#DCFCE7', border: '1.5px solid #86EFAC' }}>
          <Icon name="check_circle" className="text-[20px]" style={{ color: '#16A34A' }} filled />
          <p className="text-body-md font-semibold" style={{ color: '#16A34A' }}>
            Configuración guardada correctamente en localStorage.
          </p>
        </div>
      )}

      {/* ── PASO 1: Zonas de Inspección ─────────────────────────────── */}
      <section className="card p-4 sm:p-6 mb-5">
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <div>
            <h3 className="text-headline-md font-bold flex items-center gap-2" style={{ color: C.navy }}>
              <Icon name="photo_camera" className="text-[20px]" style={{ color: C.navy }} />
              Paso 1 — Zonas de Inspección Fotográfica
            </h3>
            <p className="text-caption text-on-surface-variant mt-0.5">
              Define primero qué zonas fotografiar. Los umbrales de la IA se ajustan al total de piezas activas.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => toggleAllSeqs(true)} className="btn-soft text-caption py-1 px-3 min-h-[32px]">Todas</button>
            <button onClick={() => toggleAllSeqs(false)} className="btn-soft text-caption py-1 px-3 min-h-[32px]">Ninguna</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {PHOTO_SEQUENCES.map((seq) => {
            const active = enabledSeqs.has(seq.id)
            return (
              <button key={seq.id} onClick={() => toggleSeq(seq.id)}
                className="flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all"
                style={{ borderColor: active ? '#0F1A5A' : '#E5E7EB', background: active ? '#EFF6FF' : '#F9FAFB' }}>
                <div className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{ borderColor: active ? '#0F1A5A' : '#D1D5DB', background: active ? '#0F1A5A' : 'white' }}>
                  {active && <Icon name="check" className="text-[13px] text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon name={seq.icon} className="text-[15px]" style={{ color: active ? '#0F1A5A' : '#9CA3AF' }} />
                    <p className="text-label-md font-bold truncate" style={{ color: active ? '#0F1A5A' : '#6B7280' }}>
                      {seq.nombre}
                    </p>
                  </div>
                  <p className="text-caption text-on-surface-variant line-clamp-2 leading-snug">
                    <strong>{seq.piezas.length} piezas:</strong> {seq.piezas.slice(0, 3).join(', ')}{seq.piezas.length > 3 ? `… +${seq.piezas.length - 3}` : ''}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Resumen de piezas activas */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <p className="text-[22px] font-bold" style={{ color: '#1D4ED8' }}>{enabledSeqs.size}</p>
            <p className="text-caption" style={{ color: '#1D4ED8' }}>Zonas activas</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <p className="text-[22px] font-bold" style={{ color: '#16A34A' }}>{totalPiezasActivas}</p>
            <p className="text-caption" style={{ color: '#16A34A' }}>Piezas a evaluar</p>
          </div>
          <div className="rounded-xl p-3 text-center sm:col-span-1 col-span-2" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
            <p className="text-[22px] font-bold" style={{ color: '#D97706' }}>
              {totalPiezasActivas > 0 ? Math.round((config.minBuenasAmplia / totalPiezasActivas) * 100) : 0}%
            </p>
            <p className="text-caption" style={{ color: '#D97706' }}>Mín. para Cob. Amplia</p>
          </div>
        </div>
      </section>

      {/* ── PASO 2: Banner + Umbrales IA ────────────────────────────── */}
      <div className="rounded-2xl p-4 sm:p-5 mb-5 text-white relative overflow-hidden"
        style={{ backgroundColor: C.deep }}>
        <span className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl bg-white/30" />
        <div className="pl-3">
          <h2 className="text-headline-lg font-bold mb-1 flex items-center gap-2">
            <Icon name="tune" className="text-[22px]" filled />
            Paso 2 — Umbrales del Motor de Reglas IA
          </h2>
          <p className="text-white/75 text-body-md">
            Basado en las <strong>{enabledSeqs.size} zonas activas</strong> ({totalPiezasActivas} piezas totales),
            define cuántas piezas buenas se necesitan para cada plan.
          </p>
        </div>
      </div>

      {/* Advertencias */}
      {warnings.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl px-4 py-3"
              style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA' }}>
              <Icon name="warning" className="text-[18px] shrink-0 mt-0.5" style={{ color: '#EA580C' }} filled />
              <p className="text-body-md" style={{ color: '#C2410C' }}>{w}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* ── Umbrales ─────────────────────────────────────────────────── */}
        <section className="card p-4 sm:p-6">
          <h3 className="text-headline-md font-bold mb-4 flex items-center gap-2" style={{ color: C.navy }}>
            <Icon name="tune" className="text-[20px]" style={{ color: C.navy }} />
            Umbrales del Motor de Reglas
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <NumInput
              label="Mín. buenas — Cob. Amplia sin deducible"
              hint="≥ este valor → plan sin deducible"
              value={config.minBuenasAmplia}
              onChange={(v) => setField('minBuenasAmplia', v)}
              min={1} max={30}
              suffix="piezas"
            />
            <NumInput
              label="Mín. buenas — Cob. Amplia con deducible"
              hint="Entre este valor y el anterior → deducible"
              value={config.minBuenasConDeducible}
              onChange={(v) => setField('minBuenasConDeducible', v)}
              min={1} max={30}
              suffix="piezas"
            />
            <NumInput
              label="Mín. buenas — Pérdida Total"
              hint="Entre este valor y el anterior → Pérd. Total"
              value={config.minBuenasPerdidaTotal}
              onChange={(v) => setField('minBuenasPerdidaTotal', v)}
              min={1} max={20}
              suffix="piezas"
            />
            <div className="sm:col-span-1">
              <p className="text-label-md font-semibold text-on-surface mb-1">
                &lt; {config.minBuenasPerdidaTotal} buenas
              </p>
              <p className="text-caption text-on-surface-variant mb-2">Resultado automático</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md font-bold"
                style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
                <Icon name="gpp_bad" className="text-[16px]" filled />
                No asegurable
              </span>
            </div>
          </div>

          <hr className="my-5 border-outline/20" />

          <h4 className="text-label-md font-bold mb-4 text-on-surface-variant uppercase tracking-wide">
            Cálculo del deducible (rango con deducible)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <NumInput
              label="% por pieza Regular"
              hint="Contribución al deducible"
              value={config.pctRegular}
              onChange={(v) => setField('pctRegular', v)}
              min={0} max={20}
              suffix="%"
            />
            <NumInput
              label="% por pieza Mala"
              hint="Contribución al deducible"
              value={config.pctMala}
              onChange={(v) => setField('pctMala', v)}
              min={0} max={30}
              suffix="%"
            />
            <NumInput
              label="Deducible máximo"
              hint="Tope del % de deducible"
              value={config.maxDeducible}
              onChange={(v) => setField('maxDeducible', v)}
              min={1} max={100}
              suffix="%"
            />
          </div>

          <div className="mt-4 rounded-xl p-3 text-[12px] font-mono"
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
            deducible = min({config.maxDeducible}, regulares × {config.pctRegular} + malas × {config.pctMala})
          </div>
        </section>

        {/* ── Diagrama de reglas activas ────────────────────────────────── */}
        <section className="card p-4 sm:p-6">
          <h3 className="text-headline-md font-bold mb-4 flex items-center gap-2" style={{ color: C.navy }}>
            <Icon name="account_tree" className="text-[20px]" style={{ color: C.navy }} />
            Reglas activas
          </h3>

          <div className="flex flex-col gap-3">
            {[
              {
                cond: `≥ ${config.minBuenasAmplia} buenas`,
                plan: 'Cobertura Amplia',
                sub: 'Sin deducible · + Pérdida Total disponible',
                tone: 'success',
                icon: 'verified_user',
              },
              {
                cond: `${config.minBuenasConDeducible} – ${config.minBuenasAmplia - 1} buenas`,
                plan: 'Cobertura Amplia',
                sub: `Con deducible (reg.×${config.pctRegular}% + mal.×${config.pctMala}%, máx ${config.maxDeducible}%)`,
                tone: 'warning',
                icon: 'shield_with_heart',
              },
              {
                cond: `${config.minBuenasPerdidaTotal} – ${config.minBuenasConDeducible - 1} buenas`,
                plan: 'Pérdida Total',
                sub: 'Solo cobertura catastrófica',
                tone: 'error',
                icon: 'car_crash',
              },
              {
                cond: `< ${config.minBuenasPerdidaTotal} buenas`,
                plan: 'No asegurable',
                sub: 'No cumple requisitos mínimos',
                tone: 'neutral',
                icon: 'gpp_bad',
              },
            ].map((r) => {
              const t = toneMap[r.tone]
              return (
                <div key={r.cond} className="rounded-xl p-3 border flex items-center gap-3"
                  style={{ backgroundColor: t.bg, borderColor: t.border }}>
                  <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0"
                    style={{ color: t.fg }}>
                    <Icon name={r.icon} className="text-[22px]" filled />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{ color: t.fg }}>
                      {r.cond}
                    </p>
                    <p className="text-label-md font-bold" style={{ color: t.fg }}>{r.plan}</p>
                    <p className="text-[11px]" style={{ color: t.fg, opacity: 0.8 }}>{r.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* ── Simulador de resultados ───────────────────────────────────── */}
      <section className="card p-4 sm:p-6 mb-6">
        <h3 className="text-headline-md font-bold mb-1 flex items-center gap-2" style={{ color: C.navy }}>
          <Icon name="science" className="text-[20px]" style={{ color: C.navy }} />
          Simulador de resultados en tiempo real
        </h3>
        <p className="text-body-md text-on-surface-variant mb-4">
          Vista previa del plan asignado según la cantidad de piezas buenas (máx. <strong>{totalPiezasActivas}</strong> según zonas activas).
          Regulares y Malas son valores representativos de ejemplo.
        </p>
        <div className="overflow-x-auto rounded-xl border border-outline/20">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr style={{ backgroundColor: C.navy, color: 'white' }}>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide">Piezas Buenas</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide">Regulares (ej.)</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide">Malas (ej.)</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide">Deducible</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide">Plan Resultante</th>
              </tr>
            </thead>
            <tbody>
              {simRows.map((row, i) => {
                const t = toneMap[row.tone]
                return (
                  <tr key={row.buenas} className={i % 2 === 0 ? 'bg-white' : 'bg-surface'}>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-label-md text-white"
                        style={{ backgroundColor: t.fg }}>
                        {row.buenas}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-on-surface-variant font-medium">{row.regulares}</td>
                    <td className="px-4 py-2.5 text-center text-on-surface-variant font-medium">{row.malas}</td>
                    <td className="px-4 py-2.5 text-center">
                      {row.deducible != null
                        ? <span className="font-bold" style={{ color: t.fg }}>{row.deducible}%</span>
                        : <span className="text-on-surface-variant">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                        style={{ backgroundColor: t.bg, color: t.fg, border: `1.5px solid ${t.border}` }}>
                        {row.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Acciones ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <button onClick={handleSave} className="btn-primary flex-1 py-3 text-body-md justify-center">
          <Icon name="save" className="text-[20px]" />
          Guardar configuración
        </button>
        <button onClick={handleReset} className="btn-soft flex-1 py-3 text-body-md justify-center">
          <Icon name="restart_alt" className="text-[20px]" />
          Restaurar valores por defecto
        </button>
      </div>
    </>
  )
}
