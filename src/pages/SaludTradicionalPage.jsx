import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Stepper from '../components/ui/Stepper'
import Icon from '../components/ui/Icon'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { BRAND, PLAN_TONES } from '../theme/tokens'
import {
  TIPOS_CEDULA,
  SEXOS,
  ESTADOS_CIVILES,
  FRECUENCIAS,
  PARENTESCOS,
  PLANES_SALUD,
  ESTADOS_VENEZUELA,
} from '../data/saludCatalogos'

const STEPS = [
  { id: 'plan',         label: 'Plan'         },
  { id: 'tomador',      label: 'Tomador'      },
  { id: 'titular',      label: 'Titular'      },
  { id: 'asegurados',   label: 'Asegurados'   },
  { id: 'beneficiarios',label: 'Beneficiarios'},
  { id: 'declaraciones',label: 'Declaraciones'},
  { id: 'revision',     label: 'Revisión'     },
]

const EMPTY_PERSONA = {
  tipo_cedula: 'V',
  rif:         '',
  nombre:      '',
  apellido:    '',
  sexo:        '',
  estado_civil:'',
  fnac:        '',
  estado:      '',
  ciudad:      '',
  direccion:   '',
  telefono:    '',
  correo:      '',
}

const EMPTY_DEPENDIENTE = {
  tipo_cedula: 'V',
  rif:         '',
  nombre:      '',
  apellido:    '',
  fnac:        '',
  sexo:        '',
  parentesco:  '',
}

export default function SaludTradicionalPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { addActivity } = useData() ?? {}

  const polizaNumero = useMemo(
    () => `SAL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    [],
  )

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const [form, setForm] = useState({
    plan:          PLANES_SALUD[1].code,  // Clásico recomendado
    frecuencia:    'M',
    tomadorIgualTitular: true,
    tomador:   { ...EMPTY_PERSONA },
    titular:   { ...EMPTY_PERSONA },
    asegurados:    [],
    beneficiarios: [],
    declaraciones: {
      dec_persona_politica: 0,
      dec_term_y_cod:       0,
      dec_diagnos_enferm:   0,
      dec_descrip_enferm:   '',
    },
  })

  const planSel = PLANES_SALUD.find((p) => p.code === form.plan) ?? PLANES_SALUD[0]

  // ── Helpers de actualización ──────────────────────────────────────
  const setPlan      = (plan)       => setForm((f) => ({ ...f, plan }))
  const setFreq      = (frecuencia) => setForm((f) => ({ ...f, frecuencia }))
  const setTomador   = (patch)      => setForm((f) => ({ ...f, tomador:   { ...f.tomador,   ...patch } }))
  const setTitular   = (patch)      => setForm((f) => ({ ...f, titular:   { ...f.titular,   ...patch } }))
  const setDec       = (patch)      => setForm((f) => ({ ...f, declaraciones: { ...f.declaraciones, ...patch } }))
  const toggleIgualTitular = (val)  => setForm((f) => ({ ...f, tomadorIgualTitular: val }))

  const addDep = (key) => setForm((f) => ({ ...f, [key]: [...f[key], { ...EMPTY_DEPENDIENTE }] }))
  const setDep = (key, i, patch) =>
    setForm((f) => ({ ...f, [key]: f[key].map((d, idx) => (idx === i ? { ...d, ...patch } : d)) }))
  const removeDep = (key, i) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }))

  // ── Validación por paso ────────────────────────────────────────────
  function isStepValid() {
    if (step === 1) return validPersona(form.tomador)
    if (step === 2) return form.tomadorIgualTitular || validPersona(form.titular)
    if (step === 5) {
      const d = form.declaraciones
      if (!d.dec_term_y_cod) return false
      if (d.dec_diagnos_enferm && !d.dec_descrip_enferm.trim()) return false
      return true
    }
    return true
  }

  function validPersona(p) {
    return (
      p.tipo_cedula && p.rif && p.nombre && p.apellido &&
      p.sexo && p.estado_civil && p.fnac &&
      p.estado && p.ciudad && p.telefono && p.correo
    )
  }

  // ── Navegación ────────────────────────────────────────────────────
  function next() {
    if (!isStepValid()) {
      toast.error('Completa los campos obligatorios antes de continuar', { title: 'Datos incompletos' })
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function back() {
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Envío (POST simulado al endpoint de Personas) ─────────────────
  async function submit() {
    setSubmitting(true)
    const titular = form.tomadorIgualTitular ? form.tomador : form.titular
    const payload = {
      poliza:    polizaNumero,
      cramo:     14,  // 14 = ramo Salud (demo)
      plan:      form.plan,
      ...prefix(form.tomador, 'tomador'),
      ...prefix(titular,      'titular'),
      ...form.declaraciones,
      productor: 1,
      tasa:      36.5,
      frecuencia: form.frecuencia,
      fecha_emision: new Date().toISOString(),
      asegurados:    form.asegurados.map(toAseguradoPayload),
      beneficiarios: form.beneficiarios.map(toBeneficiarioPayload),
    }

    // Simulación de POST — en producción:
    //   const res = await fetch('https://qaapisys2000.lamundialdeseguros.com/api/v1/emissions/person', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_LAMUNDIAL_KEY },
    //     body: JSON.stringify(payload),
    //   })
    console.log('[Salud Tradicional] Payload enviado:', payload)
    await new Promise((r) => setTimeout(r, 1500))

    const cnpoliza = `5-${polizaNumero.replace(/[^0-9]/g, '').slice(-6)}-0`
    setSuccess({
      cnpoliza,
      urlpoliza: `https://api.lamundialdeseguros.com/qa/poliza/${cnpoliza}/`,
      plan: planSel.nombre,
      prima: planSel.primaMensual,
      payload,
    })
    addActivity?.({
      type: 'salud-emision',
      title: `Póliza ${planSel.nombre} emitida`,
      subtitle: `${cnpoliza} · ${form.tomador.nombre} ${form.tomador.apellido}`,
      when: 'Hace un momento',
      icon: 'health_and_safety',
      tone: 'success',
    })
    setSubmitting(false)
    toast.success('¡Póliza de Salud emitida exitosamente!', { title: 'Emisión exitosa', duration: 5000 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Pantalla de éxito ─────────────────────────────────────────────
  if (success) {
    return <SuccessView data={success} navigate={navigate} />
  }

  // ── Render del wizard ─────────────────────────────────────────────
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Salud Tradicional' },
        ]}
        eyebrow={polizaNumero}
        title="Salud Tradicional"
        subtitle="Emisión de póliza de salud — La Mundial de Seguros"
        actions={
          <button onClick={() => navigate('/dashboard')} className="btn-soft">
            <Icon name="close" /> <span className="hidden sm:inline">Cancelar</span>
          </button>
        }
      />

      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
        style={{ backgroundColor: '#FFF1F2', border: '1px solid #FECDD3' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#E84F51', color: '#FFFFFF' }}>
          <Icon name="health_and_safety" className="text-[20px]" filled />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label-md font-bold truncate" style={{ color: '#9F1239' }}>
            Cobertura médica para ti y los tuyos
          </p>
          <p className="text-caption truncate" style={{ color: '#9F1239' }}>
            Completa los datos del tomador, titular, asegurados y beneficiarios.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <Stepper steps={STEPS} current={step} onStepClick={(i) => setStep(i)} />
      </div>

      <div className="route-enter pb-32 md:pb-4" key={step}>
        {step === 0 && <StepPlan      form={form} setPlan={setPlan} setFreq={setFreq} />}
        {step === 1 && <StepPersona   titulo="Datos del Tomador"
                                       subtitulo="Persona que contrata y paga la póliza"
                                       persona={form.tomador} update={setTomador} />}
        {step === 2 && <StepTitular   form={form}
                                       igual={form.tomadorIgualTitular}
                                       toggleIgual={toggleIgualTitular}
                                       update={setTitular} />}
        {step === 3 && <StepDependientes
                          key="asegurados"
                          titulo="Asegurados"
                          subtitulo="Personas cubiertas por la póliza"
                          icon="group"
                          items={form.asegurados}
                          onAdd={() => addDep('asegurados')}
                          onChange={(i, p) => setDep('asegurados', i, p)}
                          onRemove={(i) => removeDep('asegurados', i)}
                       />}
        {step === 4 && <StepDependientes
                          key="beneficiarios"
                          titulo="Beneficiarios"
                          subtitulo="Personas que reciben los beneficios en caso de siniestro"
                          icon="volunteer_activism"
                          items={form.beneficiarios}
                          onAdd={() => addDep('beneficiarios')}
                          onChange={(i, p) => setDep('beneficiarios', i, p)}
                          onRemove={(i) => removeDep('beneficiarios', i)}
                       />}
        {step === 5 && <StepDeclaraciones decl={form.declaraciones} update={setDec} />}
        {step === 6 && <StepRevision form={form} planSel={planSel} polizaNumero={polizaNumero} />}
      </div>

      {/* Footer */}
      <div className="fixed inset-x-0 md:left-64 z-50 wizard-footer-sticky md:sticky md:bottom-0 md:inset-auto mt-4">
        <div className="card-elev2 p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-white/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-4px_16px_rgba(15,26,90,0.10)]">
          <button onClick={back} disabled={step === 0} className="btn-soft flex-1 sm:flex-none">
            <Icon name="arrow_back" /> <span className="hidden xs:inline">Anterior</span>
          </button>
          <p className="text-caption text-on-surface-variant hidden md:block">
            Paso {step + 1} de {STEPS.length} · {STEPS[step].label}
          </p>
          {step === STEPS.length - 1 ? (
            <button onClick={submit} disabled={submitting} className="btn-accent flex-1 sm:flex-none">
              {submitting ? (
                <><Icon name="autorenew" className="animate-spin" /> Emitiendo…</>
              ) : (
                <><Icon name="rocket_launch" filled /> Emitir Póliza</>
              )}
            </button>
          ) : (
            <button onClick={next} className="btn-primary flex-1 sm:flex-none">
              <span className="hidden xs:inline">Siguiente</span>
              <Icon name="arrow_forward" />
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 0 — Plan + Frecuencia
   ══════════════════════════════════════════════════════════════════ */
function StepPlan({ form, setPlan, setFreq }) {
  return (
    <div className="flex flex-col gap-5">
      <Section title="Selecciona tu plan" icon="medical_services">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PLANES_SALUD.map((p) => {
            const sel = form.plan === p.code
            const t = PLAN_TONES[p.color] ?? PLAN_TONES.info
            return (
              <button
                key={p.code}
                onClick={() => setPlan(p.code)}
                className={clsx(
                  'relative text-left rounded-2xl p-4 border-2 transition-all',
                  sel ? 'shadow-md ring-2 ring-offset-1' : 'hover:border-outline-variant border-outline-variant/40',
                )}
                style={sel ? { borderColor: t.fg, backgroundColor: t.bg } : { backgroundColor: '#FFF' }}
              >
                {p.recomendado && (
                  <span className="absolute -top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#E84F51', color: '#FFF' }}>
                    Recomendado
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: sel ? t.fg : t.bg, color: sel ? '#FFF' : t.fg }}>
                    <Icon name={p.icono} className="text-[24px]" filled />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-label-md">{p.nombre}</p>
                    <p className="text-caption text-on-surface-variant">{p.subtitulo}</p>
                  </div>
                </div>
                <div className="bg-white/70 rounded-lg p-2 mb-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Prima mensual</p>
                  <p className="text-display-sm font-bold" style={{ color: t.fg }}>${p.primaMensual}</p>
                  <p className="text-caption text-on-surface-variant">Cobertura hasta ${p.cobertura.toLocaleString('es-VE')}</p>
                </div>
                <ul className="flex flex-col gap-1">
                  {p.beneficios.map((b) => (
                    <li key={b} className="text-caption flex items-center gap-1.5">
                      <Icon name="check_circle" className="text-[14px] shrink-0" style={{ color: t.fg }} filled />
                      <span className="text-on-surface">{b}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Frecuencia de pago" icon="event_repeat">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {FRECUENCIAS.map((f) => {
            const sel = form.frecuencia === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFreq(f.value)}
                className={clsx(
                  'rounded-xl p-3 border-2 text-center transition-all',
                  sel ? 'shadow-sm' : 'hover:border-outline-variant border-outline-variant/40',
                )}
                style={sel ? { borderColor: BRAND.navy, backgroundColor: `${BRAND.navy}08` } : {}}
              >
                <p className="font-bold text-label-md" style={{ color: sel ? BRAND.navy : '#1F2937' }}>{f.label}</p>
                <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">{f.desc}</p>
              </button>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 1 — Tomador (también reutilizado para Titular)
   ══════════════════════════════════════════════════════════════════ */
function StepPersona({ titulo, subtitulo, persona, update }) {
  return (
    <div className="flex flex-col gap-5">
      <Section title={titulo} subtitle={subtitulo} icon="person">
        <DocumentoFields persona={persona} update={update} />
      </Section>

      <Section title="Datos personales" icon="badge">
        <Grid>
          <Input label="Nombres *" value={persona.nombre}
            onChange={(v) => update({ nombre: v })} placeholder="Carolina Sofía" />
          <Input label="Apellidos *" value={persona.apellido}
            onChange={(v) => update({ apellido: v })} placeholder="Rivas Méndez" />
          <Select label="Sexo *" value={persona.sexo}
            onChange={(v) => update({ sexo: v })} options={SEXOS} placeholder="Selecciona…" />
          <Select label="Estado civil *" value={persona.estado_civil}
            onChange={(v) => update({ estado_civil: v })} options={ESTADOS_CIVILES} placeholder="Selecciona…" />
          <Input label="Fecha de nacimiento *" type="date" value={persona.fnac}
            onChange={(v) => update({ fnac: v })} />
        </Grid>
      </Section>

      <Section title="Contacto y ubicación" icon="contact_mail">
        <Grid>
          <Input label="Teléfono *" type="tel" value={persona.telefono}
            onChange={(v) => update({ telefono: v })} placeholder="0414-1234567" />
          <Input label="Correo electrónico *" type="email" value={persona.correo}
            onChange={(v) => update({ correo: v })} placeholder="ejemplo@correo.com" />
          <Select label="Estado *" value={persona.estado}
            onChange={(v) => update({ estado: v, ciudad: '' })}
            options={ESTADOS_VENEZUELA.map((e) => ({ value: e.code, label: e.label }))}
            placeholder="Selecciona estado…" />
          <Select label="Ciudad *" value={persona.ciudad}
            onChange={(v) => update({ ciudad: v })}
            options={(ESTADOS_VENEZUELA.find((e) => e.code === persona.estado)?.ciudades ?? [])
              .map((c) => ({ value: c.code, label: c.label }))}
            placeholder={persona.estado ? 'Selecciona ciudad…' : 'Primero selecciona estado'}
            disabled={!persona.estado} />
          <Textarea label="Dirección" value={persona.direccion}
            onChange={(v) => update({ direccion: v })}
            placeholder="Av. principal, urbanización, casa o edificio, piso, apto…"
            className="sm:col-span-2" />
        </Grid>
      </Section>
    </div>
  )
}

function DocumentoFields({ persona, update }) {
  return (
    <Grid cols={3}>
      <Select label="Tipo *" value={persona.tipo_cedula}
        onChange={(v) => update({ tipo_cedula: v })} options={TIPOS_CEDULA} />
      <Input label="Número de cédula / RIF *" type="number" value={persona.rif}
        onChange={(v) => update({ rif: v })}
        placeholder="Solo números, sin puntos" className="md:col-span-2" />
    </Grid>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 2 — Titular
   ══════════════════════════════════════════════════════════════════ */
function StepTitular({ igual, toggleIgual, update, form }) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Titular de la póliza" subtitle="Persona a cuyo nombre se emite la póliza" icon="person_pin">
        <label className="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-surface-container-low"
          style={{ backgroundColor: igual ? '#EEF0FA' : 'transparent', border: `2px solid ${igual ? BRAND.navy : 'transparent'}` }}>
          <input
            type="checkbox"
            checked={igual}
            onChange={(e) => toggleIgual(e.target.checked)}
            className="mt-1 w-5 h-5 rounded shrink-0 accent-current"
            style={{ color: BRAND.navy }}
          />
          <div>
            <p className="font-bold text-on-surface text-label-md">
              El titular es la misma persona que el tomador
            </p>
            <p className="text-caption text-on-surface-variant mt-0.5">
              Marca esta opción si quien contrata es también el titular de la póliza.
            </p>
          </div>
        </label>
      </Section>

      {!igual && (
        <StepPersona
          titulo="Datos del Titular"
          subtitulo="Información de la persona titular"
          persona={form.titular}
          update={update}
        />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 3/4 — Asegurados / Beneficiarios
   ══════════════════════════════════════════════════════════════════ */
function StepDependientes({ titulo, subtitulo, icon, items, onAdd, onChange, onRemove }) {
  return (
    <div className="flex flex-col gap-4">
      <Section title={titulo} subtitle={subtitulo} icon={icon}>
        <p className="text-caption text-on-surface-variant mb-3">
          Puedes agregar tantas personas como necesites. Este paso es opcional.
        </p>
        <button onClick={onAdd} className="btn-primary">
          <Icon name="person_add" filled /> Agregar persona
        </button>
      </Section>

      {items.length === 0 ? (
        <div className="card p-8 flex flex-col items-center justify-center gap-2 text-center">
          <Icon name={icon} className="text-[44px] text-on-surface-variant opacity-50" filled />
          <p className="text-body-md font-semibold text-on-surface">Aún no has agregado a nadie</p>
          <p className="text-caption text-on-surface-variant">
            Este paso es opcional. Puedes continuar sin agregar dependientes.
          </p>
        </div>
      ) : (
        items.map((p, i) => (
          <div key={i} className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-headline-md font-bold flex items-center gap-2" style={{ color: BRAND.navy }}>
                <Icon name={icon} className="text-[22px]" filled /> #{i + 1}
              </h4>
              <button onClick={() => onRemove(i)} className="btn-icon text-error" aria-label="Eliminar">
                <Icon name="delete" />
              </button>
            </div>
            <Grid>
              <Select label="Tipo *" value={p.tipo_cedula}
                onChange={(v) => onChange(i, { tipo_cedula: v })} options={TIPOS_CEDULA} />
              <Input label="Cédula / RIF *" type="number" value={p.rif}
                onChange={(v) => onChange(i, { rif: v })} placeholder="Solo números" />
              <Input label="Nombres *" value={p.nombre} onChange={(v) => onChange(i, { nombre: v })} />
              <Input label="Apellidos" value={p.apellido} onChange={(v) => onChange(i, { apellido: v })} />
              <Input label="Fecha de nacimiento" type="date" value={p.fnac}
                onChange={(v) => onChange(i, { fnac: v })} />
              <Select label="Sexo" value={p.sexo} onChange={(v) => onChange(i, { sexo: v })}
                options={SEXOS} placeholder="Selecciona…" />
              <Select label="Parentesco" value={p.parentesco}
                onChange={(v) => onChange(i, { parentesco: Number(v) })}
                options={PARENTESCOS} placeholder="Selecciona…" className="sm:col-span-2" />
            </Grid>
          </div>
        ))
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 5 — Declaraciones
   ══════════════════════════════════════════════════════════════════ */
function StepDeclaraciones({ decl, update }) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Declaraciones" subtitle="Información requerida por la aseguradora" icon="fact_check">
        <div className="flex flex-col gap-3">
          <DeclaracionRow
            label="¿Es persona políticamente expuesta (PEP)?"
            help="Funcionarios públicos, políticos o familiares cercanos de éstos."
            value={decl.dec_persona_politica}
            onChange={(v) => update({ dec_persona_politica: v })}
          />
          <DeclaracionRow
            label="¿Ha sido diagnosticado con alguna enfermedad?"
            help="Marca 'Sí' si presentas alguna condición médica relevante."
            value={decl.dec_diagnos_enferm}
            onChange={(v) => update({ dec_diagnos_enferm: v })}
          />
          {decl.dec_diagnos_enferm === 1 && (
            <Textarea
              label="Describe la(s) enfermedad(es) *"
              value={decl.dec_descrip_enferm}
              onChange={(v) => update({ dec_descrip_enferm: v })}
              placeholder="Ej: Hipertensión arterial controlada con medicamento desde 2020…"
            />
          )}
          <DeclaracionRow
            label="¿Acepta términos y condiciones?"
            help="Debes aceptar para poder emitir la póliza."
            value={decl.dec_term_y_cod}
            onChange={(v) => update({ dec_term_y_cod: v })}
            required
          />
        </div>
      </Section>
    </div>
  )
}

function DeclaracionRow({ label, help, value, onChange, required }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-on-surface text-label-md">
          {label} {required && <span className="text-error">*</span>}
        </p>
        {help && <p className="text-caption text-on-surface-variant mt-0.5">{help}</p>}
      </div>
      <div className="flex gap-1.5 shrink-0">
        {[
          { v: 0, label: 'No' },
          { v: 1, label: 'Sí' },
        ].map((opt) => (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            className={clsx(
              'px-4 py-2 rounded-lg font-bold text-label-md transition-all min-w-[64px]',
              value === opt.v
                ? 'shadow-sm text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container',
            )}
            style={value === opt.v
              ? { backgroundColor: opt.v === 1 ? '#16A34A' : '#64748B' }
              : {}
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 6 — Revisión
   ══════════════════════════════════════════════════════════════════ */
function StepRevision({ form, planSel, polizaNumero }) {
  const monto = planSel.primaMensual * freqMultiplier(form.frecuencia)
  return (
    <div className="flex flex-col gap-4">
      <Section title="Revisión final" subtitle="Verifica los datos antes de emitir la póliza" icon="task_alt">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryRow icon="medical_services" label="Plan"
            value={`${planSel.nombre} — $${planSel.primaMensual}/mes`} />
          <SummaryRow icon="event_repeat" label="Frecuencia de pago"
            value={FRECUENCIAS.find((f) => f.value === form.frecuencia)?.label ?? '—'} />
          <SummaryRow icon="numbers" label="Número de póliza" value={polizaNumero} mono />
          <SummaryRow icon="payments" label="Monto por período" value={`$${monto.toFixed(2)}`} />
        </div>
      </Section>

      <Section title="Tomador" icon="person">
        <PersonaSummary persona={form.tomador} />
      </Section>

      {!form.tomadorIgualTitular && (
        <Section title="Titular" icon="person_pin">
          <PersonaSummary persona={form.titular} />
        </Section>
      )}

      <Section title={`Asegurados (${form.asegurados.length})`} icon="group">
        {form.asegurados.length === 0 ? (
          <p className="text-caption text-on-surface-variant">No agregaste asegurados adicionales.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {form.asegurados.map((a, i) => <DependienteRow key={i} idx={i} persona={a} />)}
          </div>
        )}
      </Section>

      <Section title={`Beneficiarios (${form.beneficiarios.length})`} icon="volunteer_activism">
        {form.beneficiarios.length === 0 ? (
          <p className="text-caption text-on-surface-variant">No agregaste beneficiarios.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {form.beneficiarios.map((b, i) => <DependienteRow key={i} idx={i} persona={b} />)}
          </div>
        )}
      </Section>

      <Section title="Declaraciones" icon="fact_check">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-label-md">
          <DecSummary label="Persona políticamente expuesta" value={form.declaraciones.dec_persona_politica} />
          <DecSummary label="Enfermedades diagnosticadas"   value={form.declaraciones.dec_diagnos_enferm} />
          <DecSummary label="Términos y condiciones"         value={form.declaraciones.dec_term_y_cod} />
          {form.declaraciones.dec_diagnos_enferm === 1 && (
            <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wide font-bold text-amber-700 mb-1">Descripción</p>
              <p className="text-label-md text-amber-900">{form.declaraciones.dec_descrip_enferm}</p>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

function freqMultiplier(f) {
  return { A: 12, S: 6, C: 4, T: 3, M: 1 }[f] ?? 1
}

function PersonaSummary({ persona }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-label-md">
      <SummaryRow icon="badge"        label="Documento" value={`${persona.tipo_cedula}-${persona.rif}`} mono />
      <SummaryRow icon="person"       label="Nombre"    value={`${persona.nombre} ${persona.apellido}`} />
      <SummaryRow icon="wc"           label="Sexo"      value={SEXOS.find((s) => s.value === persona.sexo)?.label ?? '—'} />
      <SummaryRow icon="favorite"     label="Estado civil" value={ESTADOS_CIVILES.find((e) => e.value === persona.estado_civil)?.label ?? '—'} />
      <SummaryRow icon="cake"         label="Nacimiento"   value={persona.fnac} />
      <SummaryRow icon="phone"        label="Teléfono"     value={persona.telefono} />
      <SummaryRow icon="mail"         label="Correo"       value={persona.correo} />
      <SummaryRow icon="location_on"  label="Ubicación"
        value={`${persona.estado || '—'} · ${persona.ciudad || '—'}`} />
    </div>
  )
}

function DependienteRow({ idx, persona }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white text-caption"
        style={{ backgroundColor: BRAND.navy }}>
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-on-surface text-label-md truncate">
          {persona.nombre} {persona.apellido}
        </p>
        <p className="text-caption text-on-surface-variant truncate">
          {persona.tipo_cedula}-{persona.rif} · {PARENTESCOS.find((p) => p.value === persona.parentesco)?.label ?? 'Sin parentesco'}
        </p>
      </div>
    </div>
  )
}

function DecSummary({ label, value }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
      <span className="text-on-surface-variant">{label}</span>
      <span className={clsx('font-bold', value === 1 ? 'text-success' : 'text-on-surface-variant')}>
        {value === 1 ? 'Sí' : 'No'}
      </span>
    </div>
  )
}

function SummaryRow({ icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low">
      <Icon name={icon} className="text-[18px] shrink-0" style={{ color: BRAND.navy }} filled />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide font-bold text-on-surface-variant">{label}</p>
        <p className={clsx('font-semibold text-on-surface text-label-md truncate', mono && 'font-mono')}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SUCCESS VIEW
   ══════════════════════════════════════════════════════════════════ */
function SuccessView({ data, navigate }) {
  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Salud — Emisión' }]}
        title="¡Póliza emitida!"
        subtitle="Tu cobertura de salud está activa"
      />
      <div className="rounded-3xl p-8 text-center relative overflow-hidden"
        style={{ backgroundColor: '#DCFCE7', border: '2px solid #86EFAC' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-15 bg-green-500" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl">
            <Icon name="health_and_safety" className="text-[60px] text-green-700" filled />
          </div>
          <div>
            <h1 className="text-display-md font-bold text-green-800">¡Bienvenido a {data.plan}! 🎉</h1>
            <p className="text-body-md text-green-700 mt-2">
              Tu póliza ha sido emitida con éxito y ya estás cubierto.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryRow icon="policy"      label="Número de póliza" value={data.cnpoliza} mono />
        <SummaryRow icon="link"        label="URL de póliza"    value={data.urlpoliza} />
        <SummaryRow icon="medical_services" label="Plan"        value={data.plan} />
        <SummaryRow icon="payments"    label="Prima mensual"    value={`$${data.prima}`} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate('/movimientos')} className="btn-primary flex-1 py-3">
          <Icon name="history" /> Ir a Mis Movimientos
        </button>
        <button onClick={() => navigate('/dashboard')} className="btn-soft flex-1 py-3">
          <Icon name="storefront" /> Ver más productos
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   UI building blocks
   ══════════════════════════════════════════════════════════════════ */
function Section({ title, subtitle, icon, children }) {
  return (
    <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
      <div className="flex items-start gap-2 mb-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#EEF0FA', color: BRAND.navy }}>
            <Icon name={icon} className="text-[20px]" filled />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-headline-md font-bold leading-tight" style={{ color: BRAND.navy }}>{title}</h3>
          {subtitle && <p className="text-caption text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Grid({ children, cols = 2 }) {
  const colClass = cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  return <div className={clsx('grid grid-cols-1 gap-3', colClass)}>{children}</div>
}

function Input({ label, value, onChange, type = 'text', placeholder, className, disabled }) {
  return (
    <label className={clsx('flex flex-col gap-1', className)}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          'rounded-xl border-2 px-3 py-2.5 text-label-md outline-none transition-all',
          'border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20',
          'bg-white text-on-surface placeholder:text-on-surface-variant/60',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      />
    </label>
  )
}

function Textarea({ label, value, onChange, placeholder, className }) {
  return (
    <label className={clsx('flex flex-col gap-1', className)}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={clsx(
          'rounded-xl border-2 px-3 py-2.5 text-label-md outline-none transition-all resize-none',
          'border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20',
          'bg-white text-on-surface placeholder:text-on-surface-variant/60',
        )}
      />
    </label>
  )
}

function Select({ label, value, onChange, options, placeholder = 'Selecciona…', className, disabled }) {
  return (
    <label className={clsx('flex flex-col gap-1', className)}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={clsx(
          'rounded-xl border-2 px-3 py-2.5 text-label-md outline-none transition-all',
          'border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20',
          'bg-white text-on-surface',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Helpers de payload (matchea exactamente el contrato de la API)
   ══════════════════════════════════════════════════════════════════ */
function prefix(persona, suffix) {
  return {
    [`tipo_cedula_${suffix}`]: persona.tipo_cedula,
    [`rif_${suffix}`]:         Number(persona.rif) || 0,
    [`nombre_${suffix}`]:      persona.nombre,
    [`apellido_${suffix}`]:    persona.apellido,
    [`sexo_${suffix}`]:        persona.sexo,
    [`estado_civil_${suffix}`]:persona.estado_civil,
    [`fnac_${suffix}`]:        persona.fnac,
    [`estado_${suffix}`]:      persona.estado,
    [`ciudad_${suffix}`]:      persona.ciudad,
    [`direccion_${suffix}`]:   persona.direccion,
    [`telefono_${suffix}`]:    persona.telefono,
    [`correo_${suffix}`]:      persona.correo,
  }
}

function toAseguradoPayload(a) {
  return {
    icedula_asegurado:      a.tipo_cedula,
    xrif_asegurado:         Number(a.rif) || 0,
    xnombre_asegurado:      a.nombre,
    xapellido_asegurado:    a.apellido,
    fnac_asegurado:         a.fnac,
    isexo_asegurado:        a.sexo,
    nparentesco_asegurado:  Number(a.parentesco) || 0,
  }
}

function toBeneficiarioPayload(b) {
  return {
    icedula_beneficiario:     b.tipo_cedula,
    xrif_beneficiario:        Number(b.rif) || 0,
    xnombre_beneficiario:     b.nombre,
    xapellido_beneficiario:   b.apellido,
    fnac_beneficiario:        b.fnac,
    isexo_beneficiario:       b.sexo,
    nparentesco_beneficiario: Number(b.parentesco) || 0,
  }
}
