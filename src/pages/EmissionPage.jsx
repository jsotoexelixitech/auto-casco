import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Stepper from '../components/ui/Stepper'
import Icon from '../components/ui/Icon'
import { useToast } from '../context/ToastContext'
import { useData } from '../context/DataContext'
import { downloadPdf } from '../utils/downloadPdf'
import { useInspectionState } from './inspection/useInspectionState'
import { determinarPlan, calcularPiezas } from '../utils/planEngine'
import ResultadoInspeccion from '../components/emission/ResultadoInspeccion'
import Step3Photos from './inspection/Step3Photos'

// ─── Pasos del wizard unificado ───────────────────────────────────────────────
const STEPS = [
  { id: 'insp',      label: 'Inspección',   icon: 'photo_camera'   },
  { id: 'resultado', label: 'Resultado IA', icon: 'auto_awesome'   },
  { id: 'datos',     label: 'Datos',        icon: 'person'         },
  { id: 'cot',       label: 'Cotización',   icon: 'request_quote'  },
  { id: 'em',        label: 'Emisión',      icon: 'rocket_launch'  },
]

// ─── Coberturas adicionales por plan ─────────────────────────────────────────
const COBERTURAS_ADICIONALES = [
  { id: 'av', nombre: 'Asistencia Vial 24/7', descripcion: 'Grúa, batería, cambio de neumático.', precio: 40, preciodia: 1.33, icon: 'emergency', compatibles: ['cobertura_amplia', 'rcv'] },
  { id: 'gm', nombre: 'Gastos Médicos', descripcion: 'Cobertura médica para conductor y acompañantes.', precio: 60, preciodia: 2.0, icon: 'medical_services', compatibles: ['cobertura_amplia', 'rcv'] },
  { id: 'vr', nombre: 'Vehículo de Reemplazo', descripcion: 'Auto de sustitución mientras el tuyo está en taller.', precio: 70, preciodia: 2.33, icon: 'car_rental', compatibles: ['cobertura_amplia'] },
]

export default function EmissionPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { addPolicy } = useData()

  // ── Inspección (módulo desacoplado) ──
  const inspState = useInspectionState()

  // ── Datos del tomador / vehículo ──
  const [step, setStep] = useState(0)
  const [tomador, setTomador] = useState({
    nombres: '', apellidos: '', documento: '', tipoDoc: 'V',
    email: '', telefono: '', fechaNacimiento: '',
  })
  const [vehiculo, setVehiculo] = useState({
    marca: '', modelo: '', anio: '', chasis: '', placa: '', uso: 'Privado', color: '',
  })
  const [adicionales, setAdicionales] = useState([])
  const [emitting, setEmitting] = useState(false)
  const [emitted, setEmitted] = useState(null)
  const [ocrScanning, setOcrScanning] = useState(false)

  // ── Resultado IA (calculado desde fotos) ──
  const resultado = useMemo(() => determinarPlan(inspState.photos), [inspState.photos])
  // planSeleccionado puede ser cambiado por el usuario en ResultadoInspeccion cuando hay varios
  const [planSeleccionado, setPlanSeleccionado] = useState(null)
  const planRecomendado = planSeleccionado ?? resultado.plan

  // ── Coberturas disponibles según plan ──
  const coberturasDisponibles = COBERTURAS_ADICIONALES.filter(
    (c) => c.compatibles.includes(planRecomendado?.id ?? '')
  )

  const primaBase = planRecomendado?.prima?.mensual ?? 0
  const primaAdicional = coberturasDisponibles
    .filter((c) => adicionales.includes(c.id))
    .reduce((s, c) => s + c.precio, 0)
  const primaTotal = primaBase + primaAdicional

  // ── Navegación del wizard ──
  const next = () => { setStep((s) => Math.min(STEPS.length - 1, s + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const back = () => { setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const goTo = (idx) => { setStep(idx); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // ── Verificación fotos antes de avanzar al resultado ──
  const handleInspNext = () => {
    const piezas = calcularPiezas(inspState.photos)
    if (piezas.analizadas === 0) {
      toast.error('Debes fotografiar y analizar al menos una secuencia antes de continuar.', { title: 'Inspección incompleta' })
      return
    }
    next()
  }

  // ── OCR simulado ──
  const simulateOcr = () => {
    setOcrScanning(true)
    setTimeout(() => {
      setTomador({ nombres: 'Juan Carlos', apellidos: 'Pérez Gómez', documento: '12345678', tipoDoc: 'V', email: 'jperez@email.com', telefono: '(0414) 555-0123', fechaNacimiento: '1985-06-15' })
      setVehiculo({ marca: 'Toyota', modelo: 'Corolla', anio: '2022', chasis: '2T1BURHE0JC001234', placa: inspState.vehiculo.placa || 'ABC-1234', uso: 'Privado', color: 'Plata' })
      setOcrScanning(false)
      toast.success('Datos extraídos del documento.', { title: 'OCR completado' })
    }, 2000)
  }

  // ── Emitir póliza ──
  const emit = () => {
    if (!planRecomendado) { toast.error('No hay plan válido para emitir.'); return }
    setEmitting(true)
    toast.info('Generando póliza…')
    setTimeout(() => {
      const num = `POL-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`
      const piezas = calcularPiezas(inspState.photos)
      const policy = {
        id: num,
        numero: num,
        estado: 'Activa',
        plan: planRecomendado.nombre,
        planId: planRecomendado.id,
        modalidad: 'Mensual',
        diasRestantes: 30,
        diasContratados: 30,
        vigenciaDesde: new Date().toISOString().slice(0, 10),
        vigenciaHasta: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        prima: primaTotal,
        saldo: 0,
        vehicleId: 'veh-001',
        holderId: 'u-003',
        tomador: { ...tomador },
        vehiculo: { ...vehiculo },
        inspeccion: {
          buenas: piezas.buenas,
          regulares: piezas.regulares,
          malas: piezas.malas,
          fecha: new Date().toISOString().slice(0, 10),
        },
        coberturas: [
          ...planRecomendado.coberturas.filter((c) => c.incluida).map((c) => ({ nombre: c.nombre })),
          ...coberturasDisponibles.filter((c) => adicionales.includes(c.id)).map((c) => ({ nombre: c.nombre })),
        ],
      }
      addPolicy(policy)
      setEmitted(policy)
      toast.success(`Póliza ${num} emitida exitosamente`, { title: '¡Listo!' })
      setEmitting(false)
    }, 1800)
  }

  // ─── PDF ────────────────────────────────────────────────
  const downloadQuote = () => {
    const piezas = calcularPiezas(inspState.photos)
    downloadPdf({
      title: `Cotización ${planRecomendado?.nombre ?? '—'} · La Mundial`,
      lines: [
        `Plan: ${planRecomendado?.nombre}`,
        `Prima base mensual: $${primaBase}`,
        `Coberturas adicionales: $${primaAdicional}`,
        `Total: $${primaTotal}/mes`,
        ``,
        `Inspección vehicular (Gemini Vision):`,
        `  · Piezas buenas: ${piezas.buenas}`,
        `  · Piezas regulares: ${piezas.regulares}`,
        `  · Piezas malas: ${piezas.malas}`,
        ``,
        `Tomador: ${tomador.nombres} ${tomador.apellidos}`,
        `Vehículo: ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`,
        `Placa: ${vehiculo.placa || vehiculo.placa}`,
      ],
      filename: 'cotizacion-la-mundial.pdf',
    })
    toast.success('PDF descargado')
  }

  // ─── Render póliza emitida ───────────────────────────────
  if (emitted) {
    return (
      <>
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Emisión' }]}
          title="Póliza Emitida"
        />
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center shadow-elev-2">
              <Icon name="verified" className="text-[44px] text-on-success" filled />
            </div>
            <div>
              <h2 className="text-display-sm font-black text-on-surface">{emitted.numero}</h2>
              <p className="text-body-lg text-on-surface-variant mt-1">Póliza emitida exitosamente</p>
            </div>
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              {[
                { label: 'Plan', value: emitted.plan },
                { label: 'Prima', value: `$${emitted.prima}/mes` },
                { label: 'Vigencia', value: `${emitted.vigenciaDesde} → ${emitted.vigenciaHasta}` },
                { label: 'Tomador', value: `${emitted.tomador.nombres} ${emitted.tomador.apellidos}` },
                { label: 'Vehículo', value: `${emitted.vehiculo.marca} ${emitted.vehiculo.modelo}` },
                { label: 'Placa', value: emitted.vehiculo.placa || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-surface-container rounded-xl">
                  <p className="text-caption text-on-surface-variant">{label}</p>
                  <p className="text-label-md font-bold text-on-surface mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
              <button onClick={downloadQuote} className="btn-soft flex-1"><Icon name="download" /> Descargar PDF</button>
              <button onClick={() => navigate('/polizas')} className="btn-primary flex-1"><Icon name="arrow_forward" /> Ver Pólizas</button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Nueva Póliza' },
        ]}
        title="Emisión de Póliza"
        subtitle="Inspección vehicular con IA + emisión en un solo flujo."
      />

      <Stepper steps={STEPS} current={step} />

      {/* ─── PASO 0: Inspección fotográfica ─────────────── */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          {/* Banner informativo */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <Icon name="auto_awesome" className="text-primary text-[24px] mt-0.5 shrink-0" filled />
            <div>
              <p className="text-label-md font-bold text-primary">Inspección con Gemini Vision</p>
              <p className="text-caption text-on-surface-variant mt-0.5">
                Fotografía el vehículo siguiendo las secuencias. La IA analizará cada pieza y determinará qué plan de seguro puede optar.
              </p>
            </div>
          </div>

          {/* Datos del vehículo para inspección */}
          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-4 flex items-center gap-2">
              <Icon name="directions_car" className="text-primary text-[20px]" filled />
              Datos del Vehículo
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Marca', key: 'marca', placeholder: 'Toyota' },
                { label: 'Modelo', key: 'modelo', placeholder: 'Corolla' },
                { label: 'Año', key: 'anio', placeholder: '2022' },
                { label: 'Placa', key: 'placa', placeholder: 'ABC-1234' },
                { label: 'Color', key: 'color', placeholder: 'Plata' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-caption font-semibold text-on-surface-variant">{label}</label>
                  <input
                    className="input"
                    placeholder={placeholder}
                    value={inspState.vehiculo[key] ?? ''}
                    onChange={(e) => inspState.setVehiculo((v) => ({ ...v, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-caption font-semibold text-on-surface-variant">Tipo</label>
                <select
                  className="input"
                  value={inspState.vehiculo.tipo ?? 'Particular'}
                  onChange={(e) => inspState.setVehiculo((v) => ({ ...v, tipo: e.target.value }))}
                >
                  {['Particular', 'Comercial', 'Moto', 'Camión', 'Remolque'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Fotografías + IA — modo auto-gestión */}
          <Step3Photos state={inspState} autoGestion />

          {/* Footer */}
          <div className="flex justify-end pt-2">
            <button onClick={handleInspNext} className="btn-primary">
              Ver Resultado IA <Icon name="auto_awesome" />
            </button>
          </div>
        </div>
      )}

      {/* ─── PASO 1: Resultado IA + Plan recomendado ────── */}
      {step === 1 && (
        <ResultadoInspeccion
          resultado={resultado}
          onPlanChange={setPlanSeleccionado}
          onContinuar={next}
          onReinspeccionar={() => { setPlanSeleccionado(null); goTo(0) }}
        />
      )}

      {/* ─── PASO 2: Datos del Tomador ──────────────────── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          {/* Banner plan seleccionado */}
          {planRecomendado && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border"
              style={{ backgroundColor: planRecomendado.colorBg + '88', borderColor: planRecomendado.colorHex + '40' }}>
              <Icon name={planRecomendado.icono} style={{ color: planRecomendado.colorHex }} className="text-[22px]" filled />
              <div className="flex-1">
                <span className="text-label-md font-black" style={{ color: planRecomendado.colorHex }}>{planRecomendado.nombre}</span>
                <span className="text-caption text-on-surface-variant ml-2">· Plan asignado por inspección IA</span>
              </div>
              <button onClick={() => goTo(1)} className="btn-ghost text-[12px] px-2 py-1">Cambiar</button>
            </div>
          )}

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                <Icon name="person" className="text-primary text-[20px]" filled />
                Datos del Tomador
              </h3>
              <button onClick={simulateOcr} disabled={ocrScanning} className="btn-soft text-[13px]">
                {ocrScanning ? <><Icon name="hourglass_empty" className="animate-spin" /> Escaneando…</> : <><Icon name="document_scanner" /> OCR</>}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombres" value={tomador.nombres} onChange={(v) => setTomador((t) => ({ ...t, nombres: v }))} placeholder="Juan Carlos" required />
              <Field label="Apellidos" value={tomador.apellidos} onChange={(v) => setTomador((t) => ({ ...t, apellidos: v }))} placeholder="Pérez Gómez" required />
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 w-20">
                  <label className="text-caption font-semibold text-on-surface-variant">Tipo</label>
                  <select className="input" value={tomador.tipoDoc} onChange={(e) => setTomador((t) => ({ ...t, tipoDoc: e.target.value }))}>
                    {['V', 'E', 'J', 'G'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-caption font-semibold text-on-surface-variant">Documento *</label>
                  <input className="input" placeholder="12345678" value={tomador.documento} onChange={(e) => setTomador((t) => ({ ...t, documento: e.target.value }))} />
                </div>
              </div>
              <Field label="Correo electrónico" value={tomador.email} onChange={(v) => setTomador((t) => ({ ...t, email: v }))} placeholder="ejemplo@correo.com" type="email" />
              <Field label="Teléfono" value={tomador.telefono} onChange={(v) => setTomador((t) => ({ ...t, telefono: v }))} placeholder="(0414) 555-0000" />
              <Field label="Fecha de Nacimiento" value={tomador.fechaNacimiento} onChange={(v) => setTomador((t) => ({ ...t, fechaNacimiento: v }))} type="date" />
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-4 flex items-center gap-2">
              <Icon name="directions_car" className="text-primary text-[20px]" filled />
              Datos del Vehículo
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Marca *', key: 'marca', placeholder: 'Toyota' },
                { label: 'Modelo *', key: 'modelo', placeholder: 'Corolla' },
                { label: 'Año *', key: 'anio', placeholder: '2022' },
                { label: 'Color', key: 'color', placeholder: 'Plata' },
                { label: 'Placa *', key: 'placa', placeholder: 'ABC-1234' },
                { label: 'N° Chasis', key: 'chasis', placeholder: '2T1BUR…' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-caption font-semibold text-on-surface-variant">{label}</label>
                  <input className="input" placeholder={placeholder} value={vehiculo[key]} onChange={(e) => setVehiculo((v) => ({ ...v, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          <StepFooter onBack={back} onNext={next} nextDisabled={!tomador.nombres || !tomador.documento || !vehiculo.placa} />
        </div>
      )}

      {/* ─── PASO 3: Cotización ──────────────────────────── */}
      {step === 3 && planRecomendado && (
        <div className="flex flex-col gap-5">
          {/* Hero cotización */}
          <div className="card p-6 text-center"
            style={{ background: `linear-gradient(135deg, ${planRecomendado.colorHex}18, transparent)`, borderTop: `4px solid ${planRecomendado.colorHex}` }}>
            <p className="text-caption text-on-surface-variant mb-1">Prima mensual total</p>
            <p className="text-[56px] font-black leading-none" style={{ color: planRecomendado.colorHex }}>${primaTotal}</p>
            <p className="text-caption text-on-surface-variant mt-1">${(primaTotal / 30).toFixed(2)}/día</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-label-md font-bold"
              style={{ backgroundColor: planRecomendado.colorHex + '20', color: planRecomendado.colorHex }}>
              <Icon name={planRecomendado.icono} className="text-[16px]" filled />
              {planRecomendado.nombre}
            </div>
          </div>

          {/* Desglose */}
          <div className="card p-5">
            <h3 className="text-headline-md text-on-surface mb-3">Desglose de Prima</h3>
            <div className="flex flex-col divide-y divide-outline-variant/30">
              <div className="flex justify-between py-3">
                <span className="text-body-md text-on-surface">Prima base — {planRecomendado.nombre}</span>
                <span className="font-bold text-on-surface">${primaBase}</span>
              </div>
              {coberturasDisponibles
                .filter((c) => adicionales.includes(c.id))
                .map((c) => (
                  <div key={c.id} className="flex justify-between py-3">
                    <span className="text-body-md text-on-surface-variant">{c.nombre}</span>
                    <span className="font-semibold text-on-surface-variant">${c.precio}</span>
                  </div>
                ))}
              <div className="flex justify-between py-3 font-black text-lg">
                <span className="text-on-surface">Total</span>
                <span className="text-primary">${primaTotal}</span>
              </div>
            </div>
          </div>

          {/* Coberturas adicionales disponibles */}
          {coberturasDisponibles.length > 0 && (
            <div className="card p-5">
              <h3 className="text-headline-md text-on-surface mb-1">Coberturas Adicionales</h3>
              <p className="text-caption text-on-surface-variant mb-4">Opcionales compatibles con tu plan {planRecomendado.nombre}</p>
              <div className="flex flex-col gap-3">
                {coberturasDisponibles.map((cob) => {
                  const checked = adicionales.includes(cob.id)
                  return (
                    <label key={cob.id} className={clsx(
                      'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      checked ? 'border-primary bg-primary/5' : 'border-outline-variant/50 hover:border-primary/40',
                    )}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setAdicionales((a) => checked ? a.filter((x) => x !== cob.id) : [...a, cob.id])}
                        className="sr-only"
                      />
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', checked ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant')}>
                        <Icon name={cob.icon} className="text-[20px]" filled />
                      </div>
                      <div className="flex-1">
                        <p className="text-label-md font-bold text-on-surface">{cob.nombre}</p>
                        <p className="text-caption text-on-surface-variant">{cob.descripcion}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-label-md font-black text-primary">+${cob.precio}</p>
                        <p className="text-[11px] text-on-surface-variant">al mes</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={back} className="btn-soft flex-1"><Icon name="arrow_back" /> Volver</button>
            <button onClick={downloadQuote} className="btn-soft"><Icon name="download" /> PDF</button>
            <button onClick={next} className="btn-primary flex-1">Proceder a Emisión <Icon name="rocket_launch" /></button>
          </div>
        </div>
      )}

      {/* ─── PASO 4: Emisión final ───────────────────────── */}
      {step === 4 && planRecomendado && (
        <div className="flex flex-col gap-5 max-w-2xl mx-auto">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-elev-primary"
                style={{ backgroundColor: planRecomendado.colorHex }}>
                <Icon name="rocket_launch" className="text-[24px] text-white" filled />
              </div>
              <div>
                <h3 className="text-headline-md text-on-surface font-black">Confirmación Final</h3>
                <p className="text-caption text-on-surface-variant">Revisa todos los datos antes de emitir</p>
              </div>
            </div>

            {[
              { section: 'Plan', rows: [
                { label: 'Plan', value: planRecomendado.nombre },
                { label: 'Prima mensual', value: `$${primaTotal}` },
                { label: 'Modalidad', value: 'Mensual' },
              ]},
              { section: 'Tomador', rows: [
                { label: 'Nombre', value: `${tomador.nombres} ${tomador.apellidos}` },
                { label: 'Documento', value: `${tomador.tipoDoc}-${tomador.documento}` },
                { label: 'Correo', value: tomador.email || '—' },
              ]},
              { section: 'Vehículo', rows: [
                { label: 'Descripción', value: `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}` },
                { label: 'Placa', value: vehiculo.placa || '—' },
                { label: 'Uso', value: vehiculo.uso },
              ]},
              { section: 'Inspección IA', rows: [
                { label: 'Piezas buenas', value: String(calcularPiezas(inspState.photos).buenas) },
                { label: 'Piezas regulares', value: String(calcularPiezas(inspState.photos).regulares) },
                { label: 'Piezas malas', value: String(calcularPiezas(inspState.photos).malas) },
              ]},
            ].map(({ section, rows }) => (
              <div key={section} className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2">{section}</p>
                <div className="rounded-xl border border-outline-variant/50 divide-y divide-outline-variant/30">
                  {rows.map(({ label, value }) => (
                    <div key={label} className="flex justify-between px-4 py-2.5">
                      <span className="text-caption text-on-surface-variant">{label}</span>
                      <span className="text-label-md font-semibold text-on-surface text-right max-w-[55%] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={back} className="btn-soft flex-1"><Icon name="arrow_back" /> Volver</button>
            <button
              onClick={emit}
              disabled={emitting}
              className="btn-primary flex-1"
              style={{ backgroundColor: planRecomendado.colorHex }}
            >
              {emitting
                ? <><Icon name="hourglass_empty" className="animate-spin" /> Emitiendo…</>
                : <><Icon name="rocket_launch" /> Emitir Póliza {planRecomendado.nombre}</>}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Helpers de UI ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-caption font-semibold text-on-surface-variant">{label}{required && ' *'}</label>
      <input className="input" type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function StepFooter({ onBack, onNext, nextLabel = 'Siguiente', nextDisabled }) {
  return (
    <div className="flex justify-between pt-2 gap-3">
      <button onClick={onBack} className="btn-soft"><Icon name="arrow_back" /> Volver</button>
      <button onClick={onNext} disabled={nextDisabled} className={clsx('btn-primary', nextDisabled && 'opacity-40 cursor-not-allowed')}>
        {nextLabel} <Icon name="arrow_forward" />
      </button>
    </div>
  )
}
