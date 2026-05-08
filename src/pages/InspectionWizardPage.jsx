import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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

const STEPS = [
  { id: 'docs', label: 'Documentos / OCR' },
  { id: 'loc', label: 'Ubicación' },
  { id: 'photos', label: 'Captura de fotos' },
  { id: 'damage', label: 'Daños y Video 360°' },
  { id: 'review', label: 'Revisión' },
]

const TIPO_LABEL = {
  auto: 'Auto-Gestionable (Cliente)',
  'in-situ': 'In-situ (Perito)',
  video: 'Asistida por Videollamada',
}

export default function InspectionWizardPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { addInspection, addActivity, getInspection, getVehicle } = useData()
  const { user } = useAuth()

  const isEditing = !!id
  const existingInspection = isEditing ? getInspection(id) : null
  const initialStep = isEditing ? 4 : 0

  const [step, setStep] = useState(initialStep)
  const state = useInspectionState()

  useMemo(() => {
    const tipoParam = searchParams.get('tipo')
    if (tipoParam && TIPO_LABEL[tipoParam]) {
      state.setTipoInspeccion(tipoParam)
    }
  }, []) // eslint-disable-line

  const inspectionNumber = useMemo(() => {
    if (existingInspection) return existingInspection.numero
    return `INS-2026-${String(900 + Math.floor(Math.random() * 99)).padStart(3, '0')}`
  }, [existingInspection])

  const next = () => {
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const back = () => {
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = () => {
    if (!isEditing) {
      const newInspection = {
        id: inspectionNumber,
        numero: inspectionNumber,
        estado: 'Pendiente de Validación',
        tipo: TIPO_LABEL[state.tipoInspeccion],
        fechaCreacion: new Date().toISOString(),
        progreso: 100,
        vehicleId: 'veh-001',
        asignadoA: user?.id,
        peritoId: null,
        ubicacion: state.ubicacion,
        danios: state.danios.length,
      }
      addInspection(newInspection)
      addActivity({
        type: 'inspection-start',
        title: `Nueva inspección ${inspectionNumber}`,
        subtitle: `${TIPO_LABEL[state.tipoInspeccion]} · ${user?.name}`,
        when: 'Hace un momento',
        icon: 'verified',
        tone: 'primary',
      })
    }
    toast.success('Inspección enviada al módulo de validación', {
      title: '¡Listo!',
      duration: 4500,
    })
    navigate('/inspecciones')
  }

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
          subtitle={`${existingInspection.tipo} · Creada ${new Date(existingInspection.fechaCreacion).toLocaleString('es-VE')}`}
          actions={
            <>
              <StatusChip status={existingInspection.estado} />
              <button onClick={() => navigate('/inspecciones')} className="btn-soft">
                <Icon name="arrow_back" /> Volver
              </button>
            </>
          }
        />
        <Step5Review state={state} inspectionNumber={existingInspection.numero} />
        {existingInspection.estado === 'Pendiente de Validación' &&
          (user?.role === 'perito' || user?.role === 'admin') && (
            <div className="mt-4 card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-headline-md text-on-surface">
                  Validación del Perito
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  Confirma o rechaza esta inspección.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    toast.error('Inspección rechazada — el cliente recibirá una notificación.')
                    navigate('/inspecciones')
                  }}
                  className="btn-ghost border-error text-error hover:bg-error/5 flex-1 sm:flex-none"
                >
                  <Icon name="close" /> Rechazar
                </button>
                <button
                  onClick={() => {
                    toast.success('Inspección aprobada ✓')
                    navigate('/inspecciones')
                  }}
                  className="btn-accent flex-1 sm:flex-none"
                >
                  <Icon name="task_alt" /> Aprobar
                </button>
              </div>
            </div>
          )}
      </>
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Inspecciones', to: '/inspecciones' },
          { label: 'Nueva' },
        ]}
        eyebrow={inspectionNumber}
        title="Captura de Inspección"
        subtitle={TIPO_LABEL[state.tipoInspeccion]}
        actions={
          <button onClick={() => navigate('/inspecciones')} className="btn-soft">
            <Icon name="close" /> <span className="hidden sm:inline">Cancelar</span>
          </button>
        }
      />

      <div className="mb-4">
        <Stepper steps={STEPS} current={step} onStepClick={(i) => setStep(i)} />
      </div>

      <div className="route-enter pb-2 md:pb-0" key={step}>
        {step === 0 && <Step1Documents state={state} />}
        {step === 1 && <Step2Location state={state} />}
        {step === 2 && <Step3Photos state={state} />}
        {step === 3 && <Step4Damages state={state} />}
        {step === 4 && (
          <Step5Review state={state} inspectionNumber={inspectionNumber} />
        )}
      </div>

      {/* Sticky bottom bar — sits above mobile bottom nav */}
      <div className="fixed inset-x-0 md:left-64 z-30 wizard-footer-sticky md:sticky md:bottom-0 md:inset-auto mt-4">
        <div className="card-elev2 p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-white/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-4px_16px_rgba(15,26,90,0.10)]">
          <button onClick={back} disabled={step === 0} className="btn-soft flex-1 sm:flex-none">
            <Icon name="arrow_back" /> <span className="hidden xs:inline">Anterior</span>
          </button>
          <p className="text-caption text-on-surface-variant hidden md:block">
            Paso {step + 1} de {STEPS.length} · {STEPS[step].label}
          </p>
          {step === STEPS.length - 1 ? (
            <button onClick={submit} className="btn-accent flex-1 sm:flex-none">
              <Icon name="rocket_launch" /> Enviar
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
