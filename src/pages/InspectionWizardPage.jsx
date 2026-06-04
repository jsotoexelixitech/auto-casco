import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Stepper from '../components/ui/Stepper'
import Icon from '../components/ui/Icon'
import StatusChip from '../components/ui/StatusChip'
import Step1Documents from './inspection/Step1Documents'
import Step2Location from './inspection/Step2Location'
import Step3Photos from './inspection/Step3Photos'
import Step4Damages from './inspection/Step4Damages'
import Step5Review from './inspection/Step5Review'
import { useInspectionState } from './inspection/useInspectionState'
import { useToast } from '../context/ToastContext'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { determinarPlan, calcularPiezas } from '../utils/planEngine'
import ResultadoPlan from '../components/inspection/ResultadoPlan'
import PaymentStep from '../components/inspection/PaymentStep'
import PaymentSuccess from '../components/inspection/PaymentSuccess'

const STEPS = [
  { id: 'docs',   label: 'Documentos'  },
  { id: 'loc',    label: 'Ubicación'   },
  { id: 'photos', label: 'Fotografías' },
  { id: 'damage', label: 'Daños'       },
  { id: 'review', label: 'Revisión'    },
]

export default function InspectionWizardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { addInspection, addActivity, getInspection, getVehicle } = useData()
  const { user } = useAuth()

  const isEditing = !!id
  const existingInspection = isEditing ? getInspection(id) : null
  const initialStep = isEditing ? 4 : 0

  const [step, setStep]           = useState(initialStep)
  const [resultado, setResultado] = useState(null)   // plan result post-envío
  const [phase, setPhase]         = useState('result')   // 'result' | 'payment' | 'success'
  const [paymentData, setPaymentData] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const state = useInspectionState()

  const inspectionNumber = useMemo(() => {
    if (existingInspection) return existingInspection.numero
    return `INS-2026-${String(900 + Math.floor(Math.random() * 99)).padStart(3, '0')}`
  }, [existingInspection])

  // Validación: no avanzar desde el paso de fotos sin análisis completado
  const piezasActuales = calcularPiezas(state.photos)
  const hayFotosAnalizando = Object.values(state.photos).some((p) => p.analyzing)
  const hayFotosAnalizadas = piezasActuales.analizadas > 0

  const next = () => {
    if (step === 0) {
      if (!state.docs.cedula && !state.docs.rif) {
        toast.error('Carga tu Cédula o RIF para continuar.', { title: 'Acción requerida' })
        return
      }
      if (!state.docs.carnet) {
        toast.error('Carga tu Carnet de Circulación para continuar.', { title: 'Acción requerida' })
        return
      }
      if (state.vehiculo.is0km && !state.docs.certificadoOrigen) {
        toast.error('Para vehículos 0km debes cargar el Certificado de Origen.', { title: 'Acción requerida' })
        return
      }
    }

    if (step === 2 && !hayFotosAnalizadas) {
      toast.error('Sube al menos una foto para que la IA analice tu vehículo antes de continuar.', { title: 'Fotos requeridas' })
      return
    }
    if (step === 2 && hayFotosAnalizando) {
      toast.info('Espera a que termine el análisis IA antes de continuar.', { title: 'IA analizando…' })
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const back = () => { setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const submit = () => {
    // Calcular plan ANTES de guardar
    const result = determinarPlan(state.photos)

    if (!isEditing) {
      const newInspection = {
        id:              inspectionNumber,
        numero:          inspectionNumber,
        estado:          'Completada',
        tipo:            'Auto-Gestionable',
        fechaCreacion:   new Date().toISOString(),
        progreso:        100,
        vehicleId:       'veh-001',
        asignadoA:       user?.id,
        ubicacion:       state.ubicacion,
        danios:          state.danios.length,
        planRecomendado: result.plan?.id ?? null,
      }
      addInspection(newInspection)
      addActivity({
        type:     'inspection-start',
        title:    `Inspección ${inspectionNumber}`,
        subtitle: `Auto-Gestión · ${user?.name} · Plan: ${result.plan?.nombre ?? 'No elegible'}`,
        when:     'Hace un momento',
        icon:     result.elegible ? 'verified' : 'gpp_bad',
        tone:     result.elegible ? 'primary' : 'error',
      })
    }

    toast.success('Inspección completada — aquí está tu resultado IA', { title: '¡Listo!', duration: 4500 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setResultado(result)
  }

  // ── Vista de inspección existente ──────────────────────────────────────────
  if (isEditing && existingInspection) {
    const v = getVehicle(existingInspection.vehicleId)
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { label: 'Inicio', to: '/dashboard' },
            { label: 'Inspecciones', to: '/inspecciones' },
            { label: existingInspection.numero },
          ]}
          eyebrow={existingInspection.numero}
          title={`${v?.marca} ${v?.modelo} ${v?.anio}`}
          subtitle={`Auto-Gestionable · Creada ${new Date(existingInspection.fechaCreacion).toLocaleString('es-VE')}`}
          actions={
            <>
              <StatusChip status={existingInspection.estado} />
              <button onClick={() => navigate('/inspecciones')} className="btn-soft">
                <Icon name="arrow_back" /> Volver
              </button>
            </>
          }
        />
        <div className="flex flex-col gap-4">
          <div className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ borderTop: '3px solid #0F1A5A' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#EEF0FA', color: '#0F1A5A' }}>
              <Icon name="manage_search" className="text-[32px]" filled />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption text-on-surface-variant uppercase tracking-wide mb-1">Estado</p>
              <h3 className="text-headline-lg font-bold" style={{ color: '#0F1A5A' }}>
                {existingInspection.estado}
              </h3>
              <p className="text-body-md text-on-surface-variant mt-0.5">
                La IA analizó tus fotos. Puedes iniciar la emisión de póliza desde el menú principal.
              </p>
            </div>
            <StatusChip status={existingInspection.estado} />
          </div>
          {v && (
            <div className="card p-4 sm:p-5">
              <h4 className="text-headline-md mb-3 flex items-center gap-2">
                <Icon name="directions_car" className="text-primary" filled /> Vehículo
              </h4>
              <div className="flex gap-3 items-center">
                <img src={v.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-on-surface">{v.marca} {v.modelo} {v.anio}</p>
                  <p className="text-caption text-on-surface-variant font-mono tracking-wider">{v.placa}</p>
                  <p className="text-caption text-on-surface-variant">{v.color}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  // ── PANTALLA DE RESULTADO IA + PAGO (post-envío) ───────────────────────────
  if (resultado) {
    // Phase: success → confirmation
    if (phase === 'success') {
      return (
        <PaymentSuccess
          payment={paymentData}
          plan={selectedPlan ?? resultado.plan}
          inspectionNumber={inspectionNumber}
          navigate={navigate}
        />
      )
    }

    // Phase: payment → payment form
    if (phase === 'payment') {
      return (
        <PaymentStep
          plan={selectedPlan ?? resultado.plan}
          inspectionNumber={inspectionNumber}
          onBack={() => setPhase('result')}
          onConfirm={(payload) => {
            setPaymentData(payload)
            setPhase('success')
            addActivity?.({
              type:     'payment-success',
              title:    `Pago de ${payload.plan} confirmado`,
              subtitle: `${payload.method} · $${payload.total.toFixed(2)} · ${payload.reference}`,
              when:     'Hace un momento',
              icon:     'payments',
              tone:     'success',
            })
            toast.success('Pago procesado correctamente — póliza activa', { title: '¡Bienvenido!', duration: 5000 })
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )
    }

    // Phase: result → AI analysis result
    return (
      <ResultadoPlan
        resultado={resultado}
        inspectionNumber={inspectionNumber}
        navigate={navigate}
        photos={state.photos}
        onContratar={(plan) => {
          setSelectedPlan(plan)
          setPhase('payment')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )
  }

  // ── Wizard de nueva inspección ─────────────────────────────────────────────
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Inspecciones', to: '/inspecciones' },
          { label: 'Nueva' },
        ]}
        eyebrow={inspectionNumber}
        title="Inspección de Vehículo"
        subtitle="Auto-Gestión — Fotografía guiada con análisis IA"
        actions={
          <>
            <span className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md font-bold border bg-success-container text-on-success-container border-success/30">
              <Icon name="auto_awesome" className="text-[16px]" filled />
              Análisis IA
            </span>
            <button onClick={() => navigate('/inspecciones')} className="btn-soft">
              <Icon name="close" /> <span className="hidden sm:inline">Cancelar</span>
            </button>
          </>
        }
      />

      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3 bg-brand-50 border border-brand-200">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary text-on-primary">
          <Icon name="auto_awesome" className="text-[20px]" filled />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label-md font-bold truncate text-primary">Inspección con análisis automático</p>
          <p className="text-caption truncate text-on-surface-variant">
            Fotografía el vehículo · Gemini Vision analiza cada imagen · Al finalizar ves el plan disponible.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <Stepper steps={STEPS} current={step} onStepClick={(i) => setStep(i)} />
      </div>

      <div className="route-enter pb-2 md:pb-0" key={step}>
        {step === 0 && <Step1Documents state={state} />}
        {step === 1 && <Step2Location state={state} />}
        {step === 2 && <Step3Photos state={state} autoGestion />}
        {step === 3 && <Step4Damages state={state} />}
        {step === 4 && <Step5Review state={state} inspectionNumber={inspectionNumber} />}
      </div>

      {/* Preview de plan IA — solo visible en paso de fotos cuando hay análisis */}
      {step === 2 && hayFotosAnalizadas && !hayFotosAnalizando && (() => {
        const preview = determinarPlan(state.photos)
        const toneMap = {
          success: { bg: '#DCFCE7', fg: '#16A34A', border: '#86EFAC' },
          warning: { bg: '#FEF3C7', fg: '#D97706', border: '#FCD34D' },
          error:   { bg: '#FEE2E2', fg: '#DC2626', border: '#FCA5A5' },
        }
        const t = toneMap[preview.plan?.color] ?? { bg: '#EEF0FA', fg: '#0F1A5A', border: '#C8CCE8' }
        return (
          <div className="rounded-xl p-3 sm:p-4 border-2 flex items-start gap-3 animate-fade-in"
            style={{ backgroundColor: t.bg, borderColor: t.border }}>
            <Icon
              name={preview.elegible ? (preview.plan?.icono ?? 'verified_user') : 'gpp_bad'}
              className="text-[26px] shrink-0 mt-0.5"
              style={{ color: t.fg }}
              filled
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-label-md" style={{ color: t.fg }}>
                {preview.elegible
                  ? `Plan disponible: ${preview.plan?.nombre}`
                  : 'Vehículo no asegurable según análisis actual'}
              </p>
              <p className="text-caption mt-0.5" style={{ color: t.fg }}>
                {piezasActuales.buenas}B · {piezasActuales.regulares}R · {piezasActuales.malas}M
                {' · '}
                {piezasActuales.analizadas} zona(s) analizadas
                {' — Sigue subiendo fotos para un resultado más preciso.'}
              </p>
            </div>
          </div>
        )
      })()}

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
            <button onClick={submit} className="btn-accent flex-1 sm:flex-none">
              <Icon name="auto_awesome" /> Ver resultado IA
            </button>
          ) : step === 2 && !hayFotosAnalizadas ? (
            <button disabled className="btn-primary flex-1 sm:flex-none opacity-40 cursor-not-allowed">
              <Icon name="photo_camera" /> Sube fotos primero
            </button>
          ) : step === 2 && hayFotosAnalizando ? (
            <button disabled className="btn-primary flex-1 sm:flex-none opacity-60 cursor-not-allowed">
              <Icon name="auto_awesome" className="animate-pulse" /> IA analizando…
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

// ── Componente de resultado del plan ──────────────────────────────────────────
