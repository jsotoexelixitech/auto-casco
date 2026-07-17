import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Stepper from '../components/ui/Stepper'
import WizardStickyFooter from '../components/ui/WizardStickyFooter'
import Icon from '../components/ui/Icon'
import { BRAND, PLAN_TONES } from '../theme/tokens'
import { useToast } from '../context/ToastContext'
import { useData } from '../context/DataContext'
import { payments } from '../services/api'
import { createEmissionAuto, ValrepApiError } from '../services/valrepApi'
import { buildEmissionAutoPayload } from '../utils/buildEmissionAutoPayload'
import { stripPlanParenLabels } from '../utils/mapValrepPlanes'
import { cuotaFromPrimaAnual } from '../utils/primaFrecuencia'
import {
  clearInspectionDraft,
  loadInspectionDraft,
  updateInspectionDraft,
} from '../utils/inspectionDraft'
import {
  INSPECTION_WIZARD_STEPS,
  EMISSION_STEP,
} from '../utils/inspectionWizardSteps'
import { upsertInspectionRecord, saveEmissionSnapshot, loadEmissionSnapshot, emissionResultPath } from '../utils/emissionResult'
import { policies as policiesApi } from '../services/api'

/**
 * Pantalla post-pago: resumen (vehículo, titular, tomador, análisis, pago)
 * y emisión de póliza. Estilos alineados con los pasos del wizard.
 */
export default function PaymentResultPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const {
    addInspection,
    addPolicy,
    addPago,
    addActivity,
    updateInspection,
    getInspection,
    getPolicy,
    vehicles,
    setVehicles,
  } = useData()

  const idOperacion = params.get('idOperacion') || params.get('referenceId') || ''
  const polizaQuery = params.get('poliza') || params.get('cnpoliza') || ''
  const qStatus = (params.get('status') || params.get('paymentStatus') || '').toLowerCase()

  const [draft, setDraft] = useState(() => loadInspectionDraft())
  const [remote, setRemote] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(Boolean(idOperacion) && !polizaQuery)
  /** null | 'emitting' | 'emitted' — overlay antes de la pantalla final */
  const [emitUi, setEmitUi] = useState(null)
  const [done, setDone] = useState(() => {
    if (!polizaQuery) return null
    const snap = loadEmissionSnapshot(polizaQuery)
    if (snap) return snap
    return null
  })
  const [polizaLookupFailed, setPolizaLookupFailed] = useState(false)
  const emitting = emitUi === 'emitting' || emitUi === 'emitted'

  // Reabrir pantalla de éxito: ?poliza=18-1-… (local / contexto / API)
  useEffect(() => {
    if (!polizaQuery || done?.policyNumber === polizaQuery) return

    const snap = loadEmissionSnapshot(polizaQuery)
    if (snap) {
      setDone(snap)
      setPolizaLookupFailed(false)
      return
    }

    const fromCtx = getPolicy?.(polizaQuery)
    if (fromCtx) {
      setDone({
        policyNumber: fromCtx.numero || fromCtx.id,
        cnrecibo: fromCtx.cnrecibo || fromCtx.cnRecibo || null,
        urlpoliza: fromCtx.urlpoliza || fromCtx.urlPoliza || null,
        message: 'Póliza generada exitosamente',
      })
      setPolizaLookupFailed(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const remotePolicy = await policiesApi.get(polizaQuery)
        if (cancelled || !remotePolicy) {
          if (!cancelled) setPolizaLookupFailed(true)
          return
        }
        const payload = {
          policyNumber: remotePolicy.numero || remotePolicy.id,
          cnrecibo: remotePolicy.cnrecibo || remotePolicy.cnRecibo || null,
          urlpoliza: remotePolicy.urlpoliza || remotePolicy.urlPoliza || null,
          message: 'Póliza generada exitosamente',
        }
        saveEmissionSnapshot(payload)
        setDone(payload)
        setPolizaLookupFailed(false)
      } catch {
        if (!cancelled) setPolizaLookupFailed(true)
      }
    })()
    return () => { cancelled = true }
  }, [polizaQuery, done?.policyNumber, getPolicy])


  const plan = draft?.selectedPlan
  const vehiculo = draft?.vehiculo || {}
  const titular = draft?.titular || {}
  const tomador = draft?.tomadorEsTitular ? titular : (draft?.tomador || {})
  const docs = draft?.docs || {}
  const resultado = draft?.resultado || {}
  const piezas = resultado.piezas || {}

  const tipoTitular = docs.tipoTitular ?? docs.naturaleza
  const titularJuridica = tipoTitular === 'juridica'

  const pagoResumen = useMemo(() => {
    const notify = remote?.notify || draft?.paymentNotify || {}
    const paymentInfo = notify.payment || {}
    const frecuencia = plan?.frecuencia || null
    const primaAnual = Number(plan?.prima?.anual ?? plan?.prima?.monto ?? 0)
    const cuota = frecuencia
      ? cuotaFromPrimaAnual(primaAnual, frecuencia)
      : Number(plan?.prima?.cuota ?? draft?.checkout?.totalUsd ?? primaAnual ?? 0)
    const montoUsd = Number(draft?.checkout?.totalUsd ?? cuota ?? 0)
    const amountPaid = Number(
      paymentInfo.amount
      ?? draft?.checkout?.totalVes
      ?? plan?.prima?.mprima
      ?? 0,
    )
    const methodRaw = String(paymentInfo.method || 'mobile').toLowerCase()
    const methodLabel = methodRaw === 'mobile' || methodRaw === 'pago_movil' || methodRaw === 'pagomovil'
      ? 'Pago móvil'
      : methodRaw === 'card' || methodRaw === 'tarjeta'
        ? 'Tarjeta'
        : methodRaw === 'transfer' || methodRaw === 'transferencia'
          ? 'Transferencia'
          : (paymentInfo.method || 'Pago móvil')

    return {
      message: notify.message || paymentInfo.message || 'Pago verificado',
      code: notify.code || paymentInfo.code || '—',
      reference: paymentInfo.reference || '—',
      method: methodLabel,
      amount: amountPaid,
      paidOn: paymentInfo.paidOn || '—',
      verifiedOn: paymentInfo.verifiedOn || paymentInfo.paidOn || '—',
      idOperacion: notify.idOperacion || idOperacion || '—',
      frecuenciaLabel: frecuencia?.xdescripcion || plan?.frecuenciaCodigo || 'Anual',
      montoUsd,
      planNombre: stripPlanParenLabels(plan?.nombre) || '—',
      planSub: stripPlanParenLabels(plan?.subtitulo || ''),
    }
  }, [remote, draft, plan, idOperacion])

  const analisis = useMemo(() => {
    const buenas = Number(piezas.buenas ?? 0)
    const regulares = Number(piezas.regulares ?? 0)
    const malas = Number(piezas.malas ?? 0)
    const total = Math.max(
      Number(piezas.total ?? piezas.analizadas ?? 0),
      buenas + regulares + malas,
    )
    const elegible = resultado.elegible !== false
    const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0)
    const pctBuenas = pct(buenas)
    const pctRegulares = pct(regulares)
    const pctMalas = pct(malas)

    let tono = 'ok'
    let titulo = 'Inspección favorable'
    let resumen = 'El análisis fotográfico no detectó hallazgos relevantes. Puedes continuar con la emisión.'
    if (!elegible) {
      tono = 'bad'
      titulo = 'No elegible para emisión'
      resumen = 'El resultado del análisis no cumple los criterios de asegurabilidad.'
    } else if (malas > 0) {
      tono = 'warn'
      titulo = 'Elegible con daño grave'
      resumen = 'Hay piezas con daño grave. Conviene revisar el detalle antes de emitir.'
    } else if (regulares > 0) {
      tono = 'warn'
      titulo = 'Elegible con detalles menores'
      resumen = 'El estado general es aceptable, con algunas piezas que requieren observación.'
    }

    return {
      elegible,
      tono,
      titulo,
      resumen,
      buenas,
      regulares,
      malas,
      total,
      pctBuenas,
      pctRegulares,
      pctMalas,
    }
  }, [piezas, resultado])

  useEffect(() => {
    try {
      if (window.self !== window.top) {
        window.top.location.replace(window.location.href)
      }
    } catch {
      /* top cross-origin */
    }
  }, [])

  useEffect(() => {
    if (!idOperacion) {
      setLoadingStatus(false)
      return undefined
    }
    let cancelled = false
    let attempts = 0

    const poll = async () => {
      try {
        const st = await payments.getCheckoutStatus(idOperacion)
        if (cancelled) return
        setRemote(st)
        if (st?.paymentVerified || st?.status === 'ok' || st?.status === 'error') {
          setLoadingStatus(false)
          if (st.notify) updateInspectionDraft({ paymentNotify: st.notify, idOperacion })
          return
        }
      } catch {
        /* backend caído */
      }
      attempts += 1
      if (attempts >= 8) {
        if (!cancelled) setLoadingStatus(false)
        return
      }
      window.setTimeout(poll, 1500)
    }

    poll()
    return () => { cancelled = true }
  }, [idOperacion])

  const failed =
    remote?.status === 'error'
    || qStatus === 'error'
    || qStatus === 'fail'
    || qStatus === 'failed'

  const verified =
    remote?.paymentVerified === true
    || remote?.status === 'ok'
    || qStatus === 'ok'
    || qStatus === 'success'
    || qStatus === 'accp'
    || (Boolean(idOperacion) && !failed && !loadingStatus && qStatus !== 'pending')

  const pending = !verified && !failed && loadingStatus
  const paymentPersistedRef = useRef(false)

  // Al confirmar pago (paso Emisión): actualizar inspección con datos del pago
  useEffect(() => {
    if (!verified || failed || !draft?.inspectionNumber) return
    if (paymentPersistedRef.current) return
    paymentPersistedRef.current = true

    const notify = remote?.notify || draft.paymentNotify || {}
    const paymentInfo = notify.payment || {}
    const today = new Date().toISOString().slice(0, 10)
    const pago = {
      id: `PAY-${idOperacion || Date.now().toString().slice(-6)}`,
      fecha: paymentInfo.paidOn || today,
      concepto: `Prima ${draft.selectedPlan?.nombre || 'Auto'} · ${draft.inspectionNumber || ''}`.trim(),
      metodo: paymentInfo.method || 'Pago móvil',
      monto: -(Number(paymentInfo.amount) || Number(draft.checkout?.totalVes) || 0),
      estado: 'Completado',
      reference: paymentInfo.reference || idOperacion,
      idOperacion,
      raw: notify,
    }

    upsertInspectionRecord(
      { getInspection, addInspection, updateInspection, vehicles, setVehicles },
      {
        id: draft.inspectionNumber,
        numero: draft.inspectionNumber,
        dbId: draft.inspectionDbId || undefined,
        estado: 'Pendiente de emisión',
        progreso: 95,
        selectedPlan: draft.selectedPlan,
        planRecomendado: draft.selectedPlan?.id ?? null,
        titular: draft.titular,
        tomador: draft.tomador,
        tomadorEsTitular: draft.tomadorEsTitular,
        vehiculo: draft.vehiculo,
        ubicacion: draft.ubicacion,
        resultado: draft.resultado,
        idOperacion,
        checkout: draft.checkout,
        payment: pago,
        paymentNotify: notify,
      },
    ).then((saved) => {
      if (saved?.dbId) updateInspectionDraft({ inspectionDbId: saved.dbId, paymentNotify: notify, idOperacion })
      else updateInspectionDraft({ paymentNotify: notify, idOperacion })
      if (saved && saved.persisted === false && saved.error) {
        console.warn('[PaymentResult] inspección no persistida:', saved.error)
      }
    })
  }, [
    verified,
    failed,
    draft,
    remote,
    idOperacion,
    getInspection,
    addInspection,
    updateInspection,
    vehicles,
    setVehicles,
  ])

  useEffect(() => {
    if (!emitUi) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [emitUi])

  const emitOverlay = emitUi
    ? createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(9, 17, 51, 0.55)' }}
        role="status"
        aria-live="polite"
        aria-busy={emitUi === 'emitting'}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center text-white relative overflow-hidden shadow-elev-2"
          style={{ backgroundColor: BRAND.navy, borderLeft: '4px solid #ACACAC' }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="relative flex flex-col items-center gap-4">
            {emitUi === 'emitting' ? (
              <>
                <Icon name="progress_activity" className="text-[52px] text-white animate-spin" />
                <div>
                  <h2 className="text-headline-md font-bold text-white">Emitiendo…</h2>
                  <p className="text-body-md text-white/75 mt-2">
                    Estamos generando tu póliza. Esto puede tardar unos segundos.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Icon name="check_circle" className="text-[56px] text-white" filled />
                <div>
                  <h2 className="text-headline-md font-bold text-white">Tu póliza ha sido emitida</h2>
                  <p className="text-body-md text-white/75 mt-2">
                    Preparando el resumen…
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )
    : null

  async function handleContinueEmit() {
    if (emitting || !draft?.selectedPlan) return
    setEmitUi('emitting')
    try {
      const payload = await buildEmissionAutoPayload({
        plan: draft.selectedPlan,
        titular: draft.titular,
        tomador: draft.tomador,
        tomadorEsTitular: draft.tomadorEsTitular,
        docs: draft.docs,
        vehiculo: draft.vehiculo,
        ubicacion: draft.ubicacion,
      })
      const emission = await createEmissionAuto(payload)
      const policyNumber = emission.cnpoliza || `POL-${Date.now().toString().slice(-8)}`
      const notify = remote?.notify || draft.paymentNotify || {}
      const paymentInfo = notify.payment || {}
      const today = new Date().toISOString().slice(0, 10)

      const pago = {
        id: `PAY-${idOperacion || Date.now().toString().slice(-6)}`,
        fecha: paymentInfo.paidOn || today,
        concepto: `Prima ${draft.selectedPlan?.nombre || 'Auto'} · ${draft.inspectionNumber || ''}`.trim(),
        metodo: paymentInfo.method || 'Pago móvil',
        monto: -(Number(paymentInfo.amount) || Number(draft.checkout?.totalVes) || 0),
        estado: 'Completado',
        reference: paymentInfo.reference || idOperacion,
        idOperacion,
        raw: notify,
      }

      const policy = {
        id: String(policyNumber),
        numero: String(policyNumber),
        estado: 'Activa',
        plan: stripPlanParenLabels(draft.selectedPlan?.nombre) || 'Auto Casco',
        modalidad: draft.selectedPlan?.frecuencia?.xdescripcion || 'Anual',
        diasRestantes: 365,
        diasContratados: 365,
        vigenciaDesde: payload.fdesde,
        vigenciaHasta: payload.fhasta,
        prima: Number(draft.checkout?.totalUsd ?? draft.selectedPlan?.prima?.cuota ?? 0),
        placa: draft.vehiculo?.placa,
        vehicleId: 'veh-emission',
        holderId: 'u-local',
        coberturas: [],
        emission,
        cnrecibo: emission.cnrecibo,
        urlpoliza: emission.urlpoliza,
        inspectionNumber: draft.inspectionNumber,
        idOperacion,
      }

      addPago?.(pago)

      const savedPolicy = await addPolicy?.({
        ...policy,
        vehiculo: draft.vehiculo,
      })

      const savedInsp = await upsertInspectionRecord(
        { getInspection, addInspection, updateInspection, vehicles, setVehicles },
        {
          id: draft.inspectionNumber,
          numero: draft.inspectionNumber,
          dbId: draft.inspectionDbId || undefined,
          estado: 'Emitida',
          progreso: 100,
          planRecomendado: draft.selectedPlan?.id ?? null,
          selectedPlan: draft.selectedPlan,
          titular: draft.titular,
          tomador: draft.tomador,
          tomadorEsTitular: draft.tomadorEsTitular,
          vehiculo: draft.vehiculo,
          ubicacion: draft.ubicacion,
          payment: pago,
          emission,
          policyNumber: String(policyNumber),
          cnpoliza: emission.cnpoliza,
          cnrecibo: emission.cnrecibo,
          urlpoliza: emission.urlpoliza,
          idOperacion,
        },
      )

      if (savedInsp && savedInsp.persisted === false) {
        toast.warning(savedInsp.error || 'Inspección no quedó en BD', { title: 'Aviso', duration: 5000 })
      }
      if (savedPolicy && savedPolicy.persisted === false) {
        toast.warning(savedPolicy.error || 'Póliza no quedó en BD', { title: 'Aviso', duration: 5000 })
      }

      addActivity?.({
        type: 'payment-success',
        title: `Póliza ${policyNumber} emitida`,
        subtitle: emission.message || `${draft.selectedPlan?.nombre || 'Plan'} · ${idOperacion || 'pago OK'}`,
        when: 'Hace un momento',
        icon: 'policy',
        tone: 'success',
      })

      const nextDraft = updateInspectionDraft({
        idOperacion,
        paymentNotify: notify,
        emission,
        policy,
        checkout: { ...(draft.checkout || {}), completed: true },
      })

      // Mensaje intermedio antes de la pantalla final
      setEmitUi('emitted')
      await new Promise((r) => setTimeout(r, 1800))

      const donePayload = {
        policyNumber: String(policyNumber),
        cnrecibo: emission.cnrecibo,
        urlpoliza: emission.urlpoliza,
        message: emission.message,
        idOperacion,
        inspectionNumber: draft.inspectionNumber || null,
        planNombre: draft.selectedPlan?.nombre || null,
        cnpoliza: emission.cnpoliza || String(policyNumber),
        fanopol: emission.fanopol ?? null,
        fmespol: emission.fmespol ?? null,
        ncuota: emission.ncuota ?? null,
        placa: draft.vehiculo?.placa || null,
        pago,
        emission,
        draft: nextDraft,
      }
      saveEmissionSnapshot(donePayload)
      setDone(donePayload)
      setEmitUi(null)

      if (emission.urlpoliza) {
        window.open(emission.urlpoliza, '_blank', 'noopener,noreferrer')
      }

      toast.success(emission.message || 'Póliza emitida y guardada', { title: '¡Listo!', duration: 5000 })
      clearInspectionDraft()
      navigate(emissionResultPath(policyNumber), { replace: true })
    } catch (err) {
      const msg = err instanceof ValrepApiError
        ? err.message
        : (err?.message || 'No se pudo emitir la póliza')
      toast.error(msg, { title: 'Error de emisión', duration: 6000 })
      setDraft(loadInspectionDraft())
      setEmitUi(null)
    }
  }

  function handleBackToPayment() {
    updateInspectionDraft({ step: 5 })
    navigate('/inspecciones/nueva?resume=1')
  }

  if (!draft?.selectedPlan && !done && !polizaQuery) {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Pago' }]}
          title="Resultado del pago"
          subtitle="No se encontró el borrador de la inspección"
        />
        <div className="card p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
          <p className="text-body-md text-on-surface-variant mb-4">
            Vuelve a iniciar o reanudar la inspección. Si el pago se completó, contacta soporte con tu referencia.
            Si ya emitiste, abre{' '}
            <code className="text-caption font-mono">/pago/resultado?poliza=TU-NUMERO</code>
            {' '}o ve a Pólizas.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => navigate('/inspecciones')}>
              Ir a inspecciones
            </button>
            <button type="button" className="btn-soft" onClick={() => navigate('/polizas')}>
              Ver pólizas
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!done && polizaQuery && !draft?.selectedPlan) {
    if (polizaLookupFailed) {
      return (
        <div className="flex flex-col gap-4 pb-8">
          <PageHeader
            breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Pólizas', to: '/polizas' }]}
            title="Póliza no encontrada"
            subtitle={polizaQuery}
          />
          <div className="card p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
            <p className="text-body-md text-on-surface-variant mb-4">
              No hay registro local ni en el servidor para esta póliza. Revisa el número o consulta el listado.
            </p>
            <button type="button" className="btn-primary" onClick={() => navigate('/polizas')}>
              Ver pólizas
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-4 pb-8">
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Pólizas', to: '/polizas' }]}
          title="Consultando póliza"
          subtitle={polizaQuery}
        />
        <div className="card p-5 flex items-center gap-3" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
          <Icon name="progress_activity" className="text-[28px] text-primary animate-spin" />
          <p className="text-body-md text-on-surface-variant">Buscando la póliza emitida…</p>
        </div>
      </div>
    )
  }

  if (done) {
    const successTone = PLAN_TONES.success

    return (
      <div
        className="flex w-full items-center justify-center overflow-x-hidden px-1 sm:px-0"
        style={{
          minHeight: 'calc(100dvh - 11.5rem)',
        }}
      >
        <div
          className="card w-full max-w-md p-5 sm:p-6 text-center shadow-elev-2"
          style={{ borderTop: `3px solid ${BRAND.navy}` }}
        >
          <div
            className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: successTone.bg, color: successTone.fg }}
          >
            <Icon name="check_circle" className="text-[36px]" filled />
          </div>

          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">
            La Mundial de Seguros
          </p>
          <h2 className="text-headline-md font-bold text-primary mt-1.5 leading-snug">
            {done.message || 'Póliza emitida con éxito'}
          </h2>

          <div
            className="mt-4 rounded-xl px-3 py-3 text-center"
            style={{ backgroundColor: '#EEF0FA', border: '1px solid rgba(15,26,90,0.12)' }}
          >
            <p className="text-[10px] uppercase tracking-wide text-primary/70 font-bold mb-0.5">
              Número de póliza
            </p>
            <p className="text-label-md font-bold text-primary font-mono break-all">
              {done.policyNumber}
            </p>
            {done.cnrecibo && (
              <p className="text-caption text-on-surface-variant mt-1.5">
                Recibo · <span className="font-mono text-on-surface">{done.cnrecibo}</span>
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <div className={clsx('grid gap-2', done.urlpoliza ? 'grid-cols-2' : 'grid-cols-1')}>
              <button
                type="button"
                className="btn-soft w-full"
                onClick={() => navigate(`/polizas/${encodeURIComponent(done.policyNumber)}`)}
              >
                Ver Detalle
              </button>
              {done.urlpoliza && (
                <button
                  type="button"
                  className="btn-accent w-full"
                  onClick={() => window.open(done.urlpoliza, '_blank', 'noopener,noreferrer')}
                >
                  <Icon name="picture_as_pdf" filled /> Ver PDF
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn-soft w-full"
              onClick={() => navigate('/dashboard')}
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wizard-page flex flex-col gap-4 overflow-x-hidden">
      {emitOverlay}
      <div className="rounded-xl px-4 py-3 flex items-center gap-3 bg-brand-50 border border-brand-200">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary text-on-primary">
          <Icon name="auto_awesome" className="text-[20px]" filled />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold truncate text-primary">Inspección de Vehículo</p>
          <p className="text-caption text-sm truncate text-on-surface-variant">
            {verified
              ? 'Revisa el resumen e emite la póliza para finalizar.'
              : failed
                ? 'No se pudo verificar el pago. Tus datos se conservan.'
                : 'Confirmando el pago con el portal…'}
          </p>
        </div>
      </div>

      <div>
        <Stepper steps={INSPECTION_WIZARD_STEPS} current={EMISSION_STEP} />
      </div>

      {pending && (
        <div className="card p-4 flex items-center gap-3" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
          <Icon name="progress_activity" className="text-[28px] text-primary animate-spin" />
          <p className="text-body-md text-on-surface-variant">Consultando estado del pago…</p>
        </div>
      )}

      {failed && (
        <div className="card p-4 sm:p-5 flex flex-col gap-3" style={{ borderTop: '3px solid #B91C1C' }}>
          <p className="text-body-md text-on-surface-variant">
            El pago no se verificó. Puedes volver al portal o reanudar la inspección.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={handleBackToPayment}>
              Volver al pago
            </button>
            <button type="button" className="btn-soft" onClick={() => navigate('/inspecciones/nueva?resume=1')}>
              Reanudar inspección
            </button>
          </div>
        </div>
      )}

      {(verified || (!failed && !pending)) && (
        <div className="flex flex-col gap-4">
          {/* Fila 1: pago (mitad) + análisis (mitad) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:items-stretch">
            <div
              className="rounded-2xl p-4 sm:p-5 relative overflow-hidden text-white flex flex-col gap-3 min-w-0 h-full"
              style={{ backgroundColor: '#0F1A5A', borderLeft: '4px solid #ACACAC' }}
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="relative flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Icon name="verified" className="text-white text-[20px]" filled />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">La Mundial de Seguros</p>
                  <h2 className="text-label-md sm:text-headline-md font-bold leading-tight">
                    {verified ? 'Pago Confirmado' : 'Resumen previo a emisión'}
                  </h2>
                  <p className="text-caption text-white/70 mt-0.5 font-mono tracking-wide break-all">
                    {pagoResumen.idOperacion || '—'}
                  </p>
                </div>
                {draft.inspectionNumber && (
                  <span
                    className="shrink-0 self-start rounded-full px-2.5 py-1 text-md font-bold tracking-wide
                               bg-success/35 border border-success/25 text-white font-mono"
                  >
                    {draft.inspectionNumber}
                  </span>
                )}
              </div>

              <div className="relative bg-white/10 rounded-xl px-3.5 py-3 backdrop-blur flex flex-col gap-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-white/70 mb-1">Monto verificado</p>
                  <p className="text-headline-lg sm:text-display-md font-bold leading-none tabular-nums text-white">
                    {pagoResumen.amount > 0 ? formatMoney(pagoResumen.amount, 'Bs') : formatMoney(pagoResumen.montoUsd, '$')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-white/65 font-bold mb-0.5">Plan</p>
                    <p className="text-xs sm:text-sm font-semibold text-white leading-snug break-words">
                      {pagoResumen.planNombre || '—'}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-white/65 font-bold mb-0.5">Frecuencia</p>
                    <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                      {pagoResumen.frecuenciaLabel || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 content-start">
                <PayMeta label="Referencia" value={pagoResumen.reference} mono />
                <PayMeta label="Método" value={pagoResumen.method} />
                <PayMeta
                  label="Fecha"
                  value={formatFecha(pagoResumen.paidOn || pagoResumen.verifiedOn)}
                />
              </div>
            </div>

            <div className="card p-4 sm:p-5 flex flex-col gap-4 min-w-0 h-full" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: analisis.tono === 'bad' ? '#FEE2E2' : analisis.tono === 'warn' ? '#FEF3C7' : '#DCFCE7',
                    color: analisis.tono === 'bad' ? '#B91C1C' : analisis.tono === 'warn' ? '#B45309' : '#15803D',
                  }}
                >
                  <Icon
                    name={analisis.tono === 'bad' ? 'gpp_bad' : analisis.tono === 'warn' ? 'gpp_maybe' : 'verified_user'}
                    className="text-[22px]"
                    filled
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-label-md sm:text-headline-md text-on-surface font-bold">
                      Resumen de la Inspección
                    </h3>
                  </div>
                  <p className="text-body-md text-on-surface-variant mt-1.5 leading-relaxed">
                    {analisis.resumen}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 px-2.5 py-2.5 text-center min-w-0">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Buen estado</p>
                  <p className="text-headline-md font-bold text-on-surface tabular-nums leading-none mt-1" style={{ color: '#16A34A' }}>
                    {analisis.pctBuenas}%
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 px-2.5 py-2.5 text-center min-w-0">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Piezas evaluadas</p>
                  <p className="text-headline-md font-bold text-primary tabular-nums leading-none mt-1">
                    {analisis.total || '—'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                <div className="h-3 rounded-full overflow-hidden flex bg-surface-container">
                  {analisis.total > 0 ? (
                    <>
                      <div className="h-full bg-[#16A34A] transition-all" style={{ width: `${analisis.pctBuenas}%` }} title={`Buen estado ${analisis.pctBuenas}%`} />
                      <div className="h-full bg-[#D97706] transition-all" style={{ width: `${analisis.pctRegulares}%` }} title={`Observación ${analisis.pctRegulares}%`} />
                      <div className="h-full bg-[#DC2626] transition-all" style={{ width: `${analisis.pctMalas}%` }} title={`Daño grave ${analisis.pctMalas}%`} />
                    </>
                  ) : (
                    <div className="h-full w-full bg-outline-variant/40" />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <AnalysisLegend
                    tone="ok"
                    label="Buen estado"
                    count={analisis.buenas}
                    pct={analisis.pctBuenas}
                  />
                  <AnalysisLegend
                    tone="warn"
                    label="Observación"
                    count={analisis.regulares}
                    pct={analisis.pctRegulares}
                  />
                  <AnalysisLegend
                    tone="bad"
                    label="Daño grave"
                    count={analisis.malas}
                    pct={analisis.pctMalas}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fila 2: vehículo, titular, tomador */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectionCard icon="directions_car" title="Datos del Vehículo">
              <Field label="Marca" value={vehiculo.marca} />
              <Field label="Modelo" value={vehiculo.modelo} />
              <Field label="Color" value={vehiculo.color} />
              <Field label="Año" value={vehiculo.anio} />
              <Field label="Placa" value={vehiculo.placa} mono />
              <Field label="Serial" value={vehiculo.serial} mono />
            </SectionCard>

            <SectionCard icon="person" title="Datos del Titular">
              <Field
                label="Tipo"
                value={titularJuridica ? 'Persona Jurídica' : 'Persona Natural'}
              />
              <Field label="Documento" value={titular.documento} mono />
              {titularJuridica ? (
                <Field label="Razón Social" value={titular.razonSocial} className="col-span-2" />
              ) : (
                <>
                  <Field label="Nombres" value={titular.nombres} />
                  <Field label="Apellidos" value={titular.apellidos} />
                </>
              )}
              <Field label="Email" value={titular.email} />
              <Field label="Teléfono" value={titular.telefono} mono />
            </SectionCard>

            <SectionCard icon="badge" title="Datos del Tomador">
              {draft.tomadorEsTitular ? (
                <p className="col-span-2 text-caption text-primary font-semibold">
                  Mismo titular de la inspección
                </p>
              ) : null}
              <Field label="Nombres" value={tomador.nombres || tomador.razonSocial} />
              <Field label="Apellidos" value={tomador.apellidos} />
              <Field label="Documento" value={tomador.documento} mono />
              <Field label="Teléfono" value={tomador.telefono} mono />
              <Field label="Correo" value={tomador.email} className="col-span-2" />
            </SectionCard>
          </div>

          {!verified && !failed && !pending && (
            <div className="card p-4 flex flex-col gap-3" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
              <p className="text-caption text-on-surface-variant">
                Aún no llegó la confirmación del servidor. Puedes reintentar el pago; tus datos siguen guardados.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={handleBackToPayment}>
                  Volver al pago
                </button>
                <button type="button" className="btn-soft" onClick={() => navigate('/inspecciones/nueva?resume=1')}>
                  Reanudar inspección
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Misma barra del wizard: transparencia + layout Cancelar | Paso | acción */}
      {verified && (
        <WizardStickyFooter anchorKey="emission">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-soft flex-1 sm:flex-none"
          >
            <Icon name="close" /> <span className="hidden xs:inline">Cancelar</span>
          </button>
          <p className="text-caption text-on-surface-variant absolute left-1/2 -translate-x-1/2 hidden md:block pointer-events-none">
            Paso {EMISSION_STEP + 1} de {INSPECTION_WIZARD_STEPS.length} · Emisión
          </p>
          <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
            <button
              type="button"
              className="btn-accent flex-1 sm:flex-none"
              disabled={emitting}
              onClick={handleContinueEmit}
            >
              {emitting ? (
                <>
                  <Icon name="progress_activity" className="animate-spin" />
                  Emitiendo…
                </>
              ) : (
                <>
                  <Icon name="policy" filled />
                  Emitir Póliza
                </>
              )}
            </button>
          </div>
        </WizardStickyFooter>
      )}
    </div>
  )
}

function SectionCard({ icon, title, children, cols = 2 }) {
  return (
    <div className="card p-3 sm:p-4 flex flex-col" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
      <h3 className="text-label-md sm:text-headline-md text-on-surface mb-2.5 flex items-center gap-2">
        <Icon name={icon} className="text-primary" filled /> {title}
      </h3>
      <div
        className={clsx(
          'grid gap-1.5 flex-1 content-start',
          cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, mono, className = '' }) {
  return (
    <div
      className={clsx(
        'min-w-0 rounded-lg bg-white/85 border border-primary/15 px-2.5 py-2 flex flex-col gap-0.5 shadow-sm',
        className,
      )}
    >
      <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">{label}</p>
      <p
        className={clsx(
          'text-xs sm:text-sm font-semibold text-on-surface tracking-wide leading-snug break-words [overflow-wrap:anywhere]',
          mono && 'font-mono',
        )}
      >
        {value || '—'}
      </p>
    </div>
  )
}

function PayMeta({ label, value, mono }) {
  return (
    <div className="bg-white/10 rounded-lg px-2.5 py-2 min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-white/65 font-bold mb-0.5">{label}</p>
      <p className={clsx('text-xs sm:text-sm font-semibold text-white truncate', mono && 'font-mono')}>
        {value || '—'}
      </p>
    </div>
  )
}

function AnalysisLegend({ label, count, pct, tone }) {
  const bar =
    tone === 'ok' ? '#16A34A'
      : tone === 'warn' ? '#D97706'
        : tone === 'bad' ? '#DC2626'
          : BRAND.navy
  return (
    <div className="flex items-center gap-2 min-w-0 rounded-lg bg-surface-container-low/80 px-2 py-1.5">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: bar }} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider truncate">{label}</p>
        <p className="text-caption font-semibold text-on-surface tabular-nums">
          {count} · {pct}%
        </p>
      </div>
    </div>
  )
}

function formatMoney(n, prefix = '$') {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  return `${prefix}${num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatFecha(raw) {
  if (!raw || raw === '—') return '—'
  try {
    const d = new Date(raw.length <= 10 ? `${raw}T12:00:00` : raw)
    if (Number.isNaN(d.getTime())) return String(raw)
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return String(raw)
  }
}
