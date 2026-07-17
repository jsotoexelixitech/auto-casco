import { useRef } from 'react'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { BRAND } from '../../theme/tokens'
import { cuotaFromPrimaAnual, isFrecuenciaAnual } from '../../utils/primaFrecuencia'
import { isPaymentCallbackUrl } from '../../utils/checkoutPago'

/**
 * PaymentStep — resumen (plan + vehículo + tomador) e iframe SSO de pagos.
 */
export default function PaymentStep({
  plan,
  tomador,
  titular,
  tomadorEsTitular = false,
  vehiculo,
  embedded = false,
  onBack,
  iframeUrl = '',
  iframeLoading = false,
  iframeError = '',
  onRetryIframe,
  /** Cuando el iframe navega a /pago/resultado (mismo origen). */
  onIframeCallback,
}) {
  const iframeRef = useRef(null)
  const personaTomador = (tomadorEsTitular && titular) ? titular : (tomador || titular || null)

  if (!plan) return null

  const primaAnual = Number(plan.prima?.anual ?? plan.prima?.monto ?? 0)
  const frecuencia = plan.frecuencia || null
  const frecuenciaCodigo = frecuencia?.cvalor ?? plan.frecuenciaCodigo ?? null
  const monto = frecuencia
    ? cuotaFromPrimaAnual(primaAnual, frecuencia)
    : Number(plan.prima?.cuota ?? plan.prima?.monto ?? primaAnual ?? 0)
  const montoLabel = Number.isFinite(monto)
    ? `$${Number(monto).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'
  const primaCaption = frecuencia
    ? (isFrecuenciaAnual(frecuencia)
      ? 'Prima anual'
      : `Cuota ${String(frecuencia.xdescripcion || '').toLowerCase()}`)
    : 'Prima'

  function handleIframeLoad() {
    if (!onIframeCallback || !iframeRef.current) return
    try {
      const href = iframeRef.current.contentWindow?.location?.href
      if (href && isPaymentCallbackUrl(href)) {
        onIframeCallback(href)
      }
    } catch {
      // Cross-origin (portal Pagos): normal hasta que redirija a nuestro dominio
    }
  }

  return (
    <div className={clsx('flex flex-col gap-5', embedded ? 'pb-2' : 'pb-32 md:pb-8')}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-stretch">
        <div className="lg:col-span-4 flex flex-col gap-4 min-w-0">
          <div
            className="rounded-2xl p-4 sm:p-5 relative overflow-hidden text-white flex flex-col gap-3"
            style={{ backgroundColor: '#0F1A5A', borderLeft: '4px solid #ACACAC' }}
          >
            <div className="relative">
              <h2 className="text-headline-md font-bold text-white leading-tight">
                Confirmación del Pago
              </h2>
              <p className="text-caption text-white/70 text-sm mt-0.5">
                Realiza el pago en el portal para completar el proceso.
              </p>
            </div>
            <hr className="my-2 border-white/20" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Icon name={plan.icono || 'verified_user'} className="text-white text-[20px]" filled />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm uppercase tracking-widest opacity-70 mb-0.5">Plan seleccionado</p>
                <h3 className="text-label-md sm:text-headline-md font-bold leading-tight break-words">
                  {plan.nombre}
                </h3>
                {(plan.subtitulo || plan.descripcion) && (
                  <p className="text-sm text-white/70 mt-0.5 leading-snug line-clamp-2">
                    {plan.subtitulo || plan.descripcion}
                  </p>
                )}
              </div>
            </div>

            <div className="relative bg-white/10 rounded-xl px-4 py-6 text-center backdrop-blur min-w-0">
              <p className="text-display-lg font-bold leading-none tabular-nums text-white">
                {montoLabel}
              </p>
            </div>

            {(frecuencia?.xdescripcion || frecuenciaCodigo) && (
              <div className="relative pt-3 border-t border-white/20">
                <p className="text-sm font-bold uppercase tracking-wide text-white/70 mb-2">
                  Frecuencia de pago
                </p>
                <div className="rounded-lg px-2.5 py-2.5 border-2 border-secondary bg-secondary text-white text-[12px] font-semibold text-center shadow-sm min-h-[44px] flex items-center justify-center">
                  {frecuencia?.xdescripcion || frecuenciaCodigo}
                </div>
              </div>
            )}
          </div>

          {(vehiculo?.placa || vehiculo?.serial || vehiculo?.marca) && (
            <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
              <h3 className="text-label-md sm:text-headline-md text-on-surface mb-3 flex items-center gap-2">
                <Icon name="directions_car" className="text-primary" filled /> Datos del Vehículo
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Marca" value={vehiculo?.marca} />
                <Field label="Modelo" value={vehiculo?.modelo} />
                <Field label="Color" value={vehiculo?.color} />
                <Field label="Año" value={vehiculo?.anio} />
                <Field label="Placa" value={vehiculo?.placa} mono />
                <Field label="Serial" value={vehiculo?.serial} mono />
              </div>
            </div>
          )}

          <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
            <h3 className="text-label-md sm:text-headline-md text-on-surface mb-3 flex items-center gap-2">
              <Icon name="person" className="text-primary" filled /> Datos del Tomador
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Nombres" value={personaTomador?.nombres} />
              <Field label="Apellidos" value={personaTomador?.apellidos} />
              <Field label="Documento" value={personaTomador?.documento} mono />
              <Field label="Teléfono" value={personaTomador?.telefono} mono />
              <Field label="Correo" value={personaTomador?.email} className="col-span-2" />
              {tomadorEsTitular && (
                <p className="col-span-2 text-caption text-primary">Mismo titular de la inspección</p>
              )}
            </div>
          </div>

          {!embedded && (
            <button type="button" onClick={onBack} className="btn-soft w-full sm:w-auto self-start">
              <Icon name="arrow_back" /> Volver al resultado
            </button>
          )}
        </div>

        <div className="lg:col-span-8 min-w-0 flex flex-col gap-3">
          <div
            className="card overflow-hidden flex flex-col flex-1 min-h-[480px] lg:min-h-0 h-full"
            style={{ borderTop: `3px solid ${BRAND.navy}` }}
          >
            <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center gap-2 shrink-0">
              <Icon name="lock" className="text-[18px] text-primary" filled />
              <div className="min-w-0 flex-1">
                <p className="text-label-md font-bold text-primary truncate">Portal de pagos</p>
                <p className="text-caption text-on-surface-variant truncate">
                  Conexión segura · La Mundial de Seguros
                </p>
              </div>
            </div>
            <div className="relative flex-1 min-h-[360px] lg:min-h-0 w-full bg-surface-container-low overflow-hidden">
              {iframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-surface-container-low/90">
                  <Icon name="progress_activity" className="text-[32px] text-primary animate-spin" />
                  <p className="text-caption text-on-surface-variant">Preparando portal de pagos…</p>
                </div>
              )}
              {iframeError && !iframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 p-4 text-center">
                  <Icon name="error" className="text-[40px] text-error" filled />
                  <p className="text-body-md text-on-surface-variant max-w-sm">{iframeError}</p>
                  {onRetryIframe && (
                    <button type="button" className="btn-primary" onClick={onRetryIframe}>
                      Reintentar
                    </button>
                  )}
                </div>
              )}
              {iframeUrl && !iframeError && (
                <iframe
                  ref={iframeRef}
                  title="Sistema de pagos La Mundial"
                  src={iframeUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="payment *; clipboard-write"
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={handleIframeLoad}
                />
              )}
            </div>
          </div>

          <div
            className="rounded-xl px-3.5 py-3 flex items-start gap-2 bg-amber-50 border border-amber-200 italic"
          >
            <Icon name="info" className="text-[20px] text-amber-600 shrink-0 mt-0.5" filled />
              <p className="text-caption text-sm text-amber-600 leading-snug min-w-0">
              Completa el proceso de pago para continuar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono, className }) {
  return (
    <div className={clsx('bg-surface-container-low rounded-xl px-3 py-2.5', className)}>
      <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-bold mb-0.5">{label}</p>
      <p className={clsx('font-semibold text-on-surface text-label-md truncate', mono && 'font-mono')}>
        {value || '—'}
      </p>
    </div>
  )
}
