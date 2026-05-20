import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Stepper from '../components/ui/Stepper'
import Icon from '../components/ui/Icon'
import { useToast } from '../context/ToastContext'
import { useData } from '../context/DataContext'
import { BRAND } from '../theme/tokens'

/* ── Definición de pasos del wizard ─────────────────────────────────
   Mismo patrón que InspectionWizard y SaludTradicional para mantener
   coherencia visual y mental en toda la app. */
const STEPS = [
  { id: 'servicio', label: 'Servicio' },
  { id: 'plan',     label: 'Plan'     },
  { id: 'pago',     label: 'Pago'     },
  { id: 'revision', label: 'Revisión' },
]

/* ── Catálogo de servicios recargables ─────────────────────────────
   Mismos productos que aparecen en /dashboard (ProductosPage) para
   que la app se sienta UNA SOLA pieza coherente. Cada servicio trae
   su paleta de marca propia y el wizard usa esa paleta de manera
   dinámica para que los selectores, badges y CTAs cambien según el
   producto elegido. */
const SERVICES = [
  {
    id:          'vehiculos',
    label:       'Vehículos',
    subtitle:    'Auto Casco',
    tagline:     'Asegura tu auto en minutos',
    description: 'Inspección vehicular con IA · plan de seguro personalizado según el estado real de tu vehículo.',
    icon:        'directions_car_filled',
    accentColor: BRAND.navy,
    accentSoft:  '#EEF0FA',
    overlay:     'linear-gradient(135deg, rgba(15,26,90,0.88) 0%, rgba(59,79,180,0.72) 60%, rgba(15,26,90,0.45) 100%)',
    badge:       'Disponible',
    badgeBg:     '#DCFCE7',
    badgeFg:     '#16A34A',
    priceFrom:   'Desde $0.89/día',
    pricePerDay: 0.89,
    image:       'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    sparkles:    ['auto_awesome', 'shield_with_heart'],
    benefits:    [
      { icon: 'shield',       text: 'Cobertura Amplia / Pérdida Total' },
      { icon: 'auto_awesome', text: 'Análisis IA con Gemini Vision' },
      { icon: 'receipt_long', text: 'Emisión en minutos' },
    ],
  },
  {
    id:          'salud',
    label:       'Salud Tradicional',
    subtitle:    'Cobertura Médica',
    tagline:     'Protege a quienes amas',
    description: 'Atención médica, hospitalización, cirugías y medicamentos para toda tu familia.',
    icon:        'health_and_safety',
    accentColor: '#E84F51',
    accentSoft:  '#FEE2E2',
    overlay:     'linear-gradient(135deg, rgba(232,79,81,0.88) 0%, rgba(248,113,113,0.72) 60%, rgba(232,79,81,0.45) 100%)',
    badge:       'Nuevo',
    badgeBg:     '#FEE2E2',
    badgeFg:     '#9F1239',
    priceFrom:   'Desde $35/mes',
    pricePerDay: 1.15,
    image:       'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
    sparkles:    ['medical_services', 'favorite'],
    benefits:    [
      { icon: 'local_hospital',  text: 'Hospitalización cubierta' },
      { icon: 'medication',      text: 'Medicamentos incluidos' },
      { icon: 'family_restroom', text: 'Cobertura familiar' },
    ],
  },
  {
    id:          'wallet-general',
    label:       'Recarga de Saldo',
    subtitle:    'Billetera Digital',
    tagline:     'Recarga al instante',
    description: 'Saldo libre que puedes usar en cualquier producto — sin caducidad, sin restricciones.',
    icon:        'account_balance_wallet',
    accentColor: '#0D9488',
    accentSoft:  '#CCFBF1',
    overlay:     'linear-gradient(135deg, rgba(13,148,136,0.88) 0%, rgba(20,184,166,0.72) 60%, rgba(13,148,136,0.45) 100%)',
    badge:       'Disponible',
    badgeBg:     '#CCFBF1',
    badgeFg:     '#0F766E',
    priceFrom:   'Desde $1',
    pricePerDay: 1,
    isWallet:    true,
    image:       'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=900&q=80',
    sparkles:    ['bolt', 'savings'],
    benefits:    [
      { icon: 'bolt',        text: 'Recarga instantánea' },
      { icon: 'credit_card', text: 'Múltiples métodos de pago' },
      { icon: 'history',     text: 'Historial completo' },
    ],
  },
  {
    id:          'cobertura-parcial',
    label:       'Cobertura Parcial',
    subtitle:    'RCV / Básica',
    tagline:     'Protección obligatoria',
    description: 'Responsabilidad civil y cobertura básica para protección mínima obligatoria.',
    icon:        'gpp_good',
    accentColor: '#7C3AED',
    accentSoft:  '#EDE9FE',
    overlay:     'linear-gradient(135deg, rgba(124,58,237,0.88) 0%, rgba(167,139,250,0.72) 60%, rgba(124,58,237,0.45) 100%)',
    badge:       'Próximamente',
    badgeBg:     '#F1F5F9',
    badgeFg:     '#64748B',
    priceFrom:   'Próximamente',
    pricePerDay: 0.50,
    image:       'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80',
    sparkles:    ['enhanced_encryption', 'verified_user'],
    benefits:    [
      { icon: 'gavel',         text: 'Responsabilidad Civil' },
      { icon: 'car_crash',     text: 'Daños a terceros' },
      { icon: 'support_agent', text: 'Asistencia en ruta' },
    ],
    disabled:    true,
  },
]

/* ── Catálogos de períodos ─────────────────────────────────────────
 * Cada período tiene su factor en días y un descuento sugerido por
 * "compra al mayor". Esto es solo simulación de cara al cliente.
 */
const PERIODS = [
  {
    id: 'dias',
    label: 'Días',
    short: 'día',
    plural: 'días',
    daysPer: 1,
    discount: 0,
    icon: 'today',
    quick: [1, 3, 7, 15],
    color: '#0EA5E9',
    description: 'Cobertura por el tiempo exacto que la necesitas',
  },
  {
    id: 'semanas',
    label: 'Semanas',
    short: 'semana',
    plural: 'semanas',
    daysPer: 7,
    discount: 0.05,
    icon: 'date_range',
    quick: [1, 2, 4, 8],
    color: '#0D9488',
    description: 'Ahorra 5% al recargar por semanas',
  },
  {
    id: 'meses',
    label: 'Meses',
    short: 'mes',
    plural: 'meses',
    daysPer: 30,
    discount: 0.10,
    icon: 'calendar_month',
    quick: [1, 3, 6, 12],
    color: '#9333EA',
    description: 'Ahorra 10% al recargar mensualmente',
  },
  {
    id: 'anual',
    label: 'Año',
    short: 'año',
    plural: 'años',
    daysPer: 365,
    discount: 0.20,
    icon: 'event_available',
    quick: [1, 2, 3, 5],
    color: '#F59E0B',
    description: 'Ahorra hasta 20% — el mejor precio del año',
    badge: 'Mejor valor',
  },
]

const BANCOS = [
  { id: '0172', label: 'Bancamiga',    short: 'Banca Amiga',  color: '#0E7A3D' },
  { id: '0171', label: 'Banco Activo', short: 'Banco Activo', color: '#E11D48' },
]

const PAYMENT_METHODS = [
  { id: 'card',     label: 'Tarjeta de crédito/débito', icon: 'credit_card',            sub: 'Visa, Mastercard, Amex' },
  { id: 'transfer', label: 'Transferencia bancaria',    icon: 'account_balance',        sub: 'Banca Amiga · Banco Activo' },
  { id: 'mobile',   label: 'Pago móvil',                icon: 'smartphone',             sub: 'C2P / 0414-xxxxxxx' },
  { id: 'otp',      label: 'Token OTP bancario',        icon: 'key',                    sub: 'Código de un solo uso' },
  { id: 'wallet',   label: 'Saldo en billetera',        icon: 'account_balance_wallet', sub: 'Disponible: $145.50' },
]

const TASA_BS = 36.5

export default function RecargaSaldoPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { addActivity } = useData()

  /* Catálogo estático de productos = mismos que aparecen en
     /dashboard. Esto unifica la app: lo que se ve en Productos
     se puede recargar acá con la misma identidad visual. */
  const services = SERVICES

  const [step, setStep] = useState(0)
  /* Default explícito en 'vehiculos' — primer producto de la lista.
     useEffect con [] garantiza que al MONTAR la página siempre
     empiece limpia, incluso tras HMR o navegación de vuelta. */
  const [serviceId,    setServiceId]    = useState('vehiculos')
  const [periodId,     setPeriodId]     = useState('meses')
  const [qty,          setQty]          = useState(1)
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [banco,        setBanco]        = useState(BANCOS[0].id)
  const [otpCode,      setOtpCode]      = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [success,      setSuccess]      = useState(null)

  /* Resetea todo al estado inicial cuando el componente monta
     (evita que el HMR o la re-navegación hereden estado viejo). */
  useEffect(() => {
    setStep(0)
    setServiceId('vehiculos')
    setPeriodId('meses')
    setQty(1)
    setCustomAmount('')
    setPaymentMethod('card')
    setBanco(BANCOS[0].id)
    setOtpCode('')
    setSuccess(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const service = services.find((s) => s.id === serviceId) ?? services[0]
  const period  = PERIODS.find((p) => p.id === periodId)

  /* ── Cálculo en vivo ─── */
  const calc = useMemo(() => {
    if (!service || !period) return null
    if (service.isWallet) {
      const amount = Number(customAmount) || qty * 10
      const iva = amount * 0.16
      return {
        days: 0,
        subtotal: amount,
        discount: 0,
        iva,
        total: amount + iva,
        totalBs: (amount + iva) * TASA_BS,
      }
    }
    const days = qty * period.daysPer
    const subtotal = days * service.pricePerDay
    const discount = subtotal * period.discount
    const afterDiscount = subtotal - discount
    const iva = afterDiscount * 0.16
    const total = afterDiscount + iva
    return {
      days,
      subtotal,
      discount,
      iva,
      total,
      totalBs: total * TASA_BS,
    }
  }, [service, period, qty, customAmount])

  const otpValido = paymentMethod !== 'otp' || otpCode.length === 6
  const walletValido = !service?.isWallet || Number(customAmount) > 0
  const canPay = otpValido && walletValido

  /* ── Validación por paso ─────────────────────── */
  function isStepValid() {
    if (step === 0) return !!service
    if (step === 1) return walletValido
    if (step === 2) return otpValido
    return true
  }

  function nextStep() {
    if (!isStepValid()) {
      toast.error(
        step === 1 ? 'Ingresa un monto antes de continuar'
        : step === 2 ? 'Completa los 6 dígitos del código OTP'
        : 'Completa este paso antes de continuar',
        { title: 'Falta información' },
      )
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function prevStep() {
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── Submit ─── */
  async function handleRecargar() {
    setSubmitting(true)
    const reference = `RCG-${new Date().getFullYear()}${String(Math.floor(Math.random() * 90000) + 10000)}`
    await new Promise((r) => setTimeout(r, 1600))

    setSuccess({
      reference,
      service: service.label,
      days: calc.days,
      total: calc.total,
      period,
      qty,
      paymentMethod: PAYMENT_METHODS.find((m) => m.id === paymentMethod),
      banco: ['transfer', 'mobile', 'otp'].includes(paymentMethod)
        ? BANCOS.find((b) => b.id === banco)?.label
        : null,
    })
    addActivity?.({
      type: 'recarga',
      title: service.isWallet
        ? `Recarga de billetera: $${calc.total.toFixed(2)}`
        : `Recarga: ${qty} ${qty === 1 ? period.short : period.plural} para ${service.label}`,
      subtitle: `Ref: ${reference}`,
      when: 'Hace un momento',
      icon: 'account_balance_wallet',
      tone: 'success',
    })
    setSubmitting(false)
    toast.success('¡Recarga realizada exitosamente!', { title: 'Saldo agregado', duration: 5000 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (success) return <SuccessView data={success} navigate={navigate} />

  /* ─────────────────────────────────────────── */
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Recarga de Saldo' },
        ]}
        eyebrow={`Paso ${step + 1} de ${STEPS.length}`}
        title="Recarga tu saldo"
        subtitle={
          step === 0 ? 'Empecemos eligiendo qué quieres recargar'
          : step === 1 ? service?.isWallet ? 'Elige el monto a recargar' : 'Define el período y la cantidad de cobertura'
          : step === 2 ? 'Selecciona el método de pago que prefieras'
          : 'Revisa los datos y confirma la recarga'
        }
        actions={
          <button onClick={() => navigate('/dashboard')} className="btn-soft">
            <Icon name="close" /> <span className="hidden sm:inline">Cancelar</span>
          </button>
        }
      />

      <div className="mb-2">
        <Stepper flat steps={STEPS} current={step} onStepClick={(i) => {
          /* Permite saltar atrás libremente; hacia adelante solo si los
             pasos previos están válidos. */
          if (i < step) setStep(i)
          else if (i === step + 1 && isStepValid()) setStep(i)
        }} />
      </div>

      <div className="pb-20" key={step}>
        {step === 0 && <StepServicio
          services={services} serviceId={serviceId} setServiceId={setServiceId}
        />}
        {step === 1 && (service?.isWallet
          ? <StepMonto    service={service} customAmount={customAmount} setCustomAmount={setCustomAmount} setQty={setQty} />
          : <StepPlan     service={service} periodId={periodId} setPeriodId={setPeriodId}
                          period={period} qty={qty} setQty={setQty} calc={calc} />
        )}
        {step === 2 && <StepPago
          service={service}
          paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
          banco={banco} setBanco={setBanco}
          otpCode={otpCode} setOtpCode={setOtpCode}
        />}
        {step === 3 && <StepRevision
          service={service} period={period} qty={qty} calc={calc}
          paymentMethod={paymentMethod} banco={banco}
        />}
      </div>

      {/* ════════════════════ FOOTER STICKY ════════════════════
          Mismo patrón EXACTO que InspectionWizardPage para
          coherencia visual total en la app. */}
      <div className="fixed inset-x-0 md:left-64 z-50 wizard-footer-sticky md:sticky md:bottom-0 md:inset-auto mt-4">
        <div className="card-elev2 p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-white/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-4px_16px_rgba(15,26,90,0.10)]">

          {/* Anterior — disabled en paso 0, siempre visible */}
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="btn-soft flex-1 sm:flex-none"
          >
            <Icon name="arrow_back" />
            <span className="hidden xs:inline">Anterior</span>
          </button>

          {/* Info central — solo desktop */}
          <p className="text-caption text-on-surface-variant hidden md:block text-center">
            Paso {step + 1} de {STEPS.length} · {STEPS[step].label}
            {step > 0 && calc?.total ? ` · $${calc.total.toFixed(2)}` : ''}
          </p>

          {/* CTA — Siguiente o Confirmar pago */}
          {step < STEPS.length - 1 ? (
            <button onClick={nextStep} className="btn-primary flex-1 sm:flex-none">
              <span className="hidden xs:inline">Siguiente</span>
              <Icon name="arrow_forward" />
            </button>
          ) : (
            <button
              onClick={handleRecargar}
              disabled={submitting || !canPay}
              className="btn-accent flex-1 sm:flex-none"
            >
              {submitting ? (
                <><Icon name="autorenew" className="animate-spin" /><span className="hidden xs:inline">Procesando…</span></>
              ) : (
                <><Icon name="bolt" filled /><span>Confirmar pago</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PASOS DEL WIZARD — cada uno es un componente puro que recibe lo
   que necesita por props y delega a Section para la card contenedora.
   ══════════════════════════════════════════════════════════════════ */

function StepServicio({ services, serviceId, setServiceId }) {
  return (
    <Section
      title="¿Qué quieres recargar?"
      subtitle="Selecciona el producto al que quieres agregar saldo o tiempo de cobertura"
      icon="touch_app"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
        {services.map((s) => {
          const sel    = s.id === serviceId
          const active = !s.disabled
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => active && setServiceId(s.id)}
              disabled={!active}
              className={clsx(
                /* safe-clip: previene el bug de border-radius en Chromium
                   cuando scale() coexiste con overflow-hidden + border-radius */
                'safe-clip group relative text-left rounded-3xl flex flex-col shadow-md h-full min-h-[340px]',
                'transition-[transform,box-shadow] duration-300 ease-out',
                active
                  ? 'bg-white hover:shadow-2xl hover:-translate-y-1.5 active:scale-[0.98] cursor-pointer'
                  : 'bg-white cursor-not-allowed',
              )}
            >
              {/* ── Hero image — mismo patrón que ProductosPage ────────── */}
              <div className="relative h-40 overflow-hidden shrink-0 rounded-t-3xl isolate">
                <img
                  src={s.image}
                  alt={s.label}
                  className={clsx(
                    'absolute inset-0 w-full h-full object-cover transform-gpu transition-transform duration-700 ease-out',
                    active ? 'group-hover:scale-110' : 'grayscale opacity-70',
                  )}
                  loading="lazy"
                  draggable={false}
                />
                {/* Brand overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: active
                      ? s.overlay
                      : 'linear-gradient(135deg, rgba(100,116,139,0.85) 0%, rgba(148,163,184,0.6) 100%)',
                  }}
                />

                {/* Sparkles decorativos */}
                {active && s.sparkles?.map((sp, i) => (
                  <div
                    key={sp}
                    className="absolute opacity-25 transition-opacity duration-700 group-hover:opacity-45 pointer-events-none"
                    style={{ top: i === 0 ? '20%' : '55%', left: i === 0 ? '58%' : '10%', transform: `rotate(${i * 20}deg)` }}
                  >
                    <Icon name={sp} filled className="text-[40px] text-white drop-shadow-lg" />
                  </div>
                ))}

                {/* Top row: subtitle pill + badge de disponibilidad */}
                <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/95 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/25">
                    {s.subtitle}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md shrink-0"
                    style={{ backgroundColor: s.badgeBg, color: s.badgeFg }}
                  >
                    {s.badge}
                  </span>
                </div>

                {/* Título + tagline al fondo de la imagen */}
                <div className="absolute bottom-3 inset-x-4 z-10">
                  <h3 className="text-headline-lg font-bold text-white leading-tight drop-shadow-lg">
                    {s.label}
                  </h3>
                  <p className="text-[12px] text-white/90 mt-0.5 font-semibold drop-shadow line-clamp-1">
                    {s.tagline}
                  </p>
                </div>

                {/* Check de selección — círculo flotante sobre la imagen */}
                {sel && active && (
                  <div
                    className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white transition-all"
                    style={{ backgroundColor: s.accentColor }}
                  >
                    <Icon name="check" className="text-[16px] text-white" />
                  </div>
                )}
              </div>

              {/* ── Icono flotante + descripción breve ──────────────────
                  El icono usa -mt-8 para salir del cuerpo hacia arriba,
                  superponiéndose SOLO en el espacio vacío debajo de la
                  imagen (donde ya no hay texto). No hay solapamiento.   */}
              <div className="relative px-4 pt-3 pb-1 flex items-center gap-3 shrink-0">
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg shrink-0 -mt-8 relative z-10 transform-gpu transition-[transform] duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6"
                  style={{
                    width: 52, height: 52,
                    background: active
                      ? `linear-gradient(135deg, ${s.accentColor} 0%, ${s.accentColor}DD 100%)`
                      : 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
                    border: '3px solid #FFFFFF',
                  }}
                >
                  <Icon name={s.icon} filled className="text-[26px] text-white drop-shadow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-caption text-on-surface-variant leading-snug line-clamp-2">
                    {s.description}
                  </p>
                </div>
              </div>

              {/* ── Beneficios + CTA ──────────────────────────────────── */}
              <div className="flex flex-col gap-3 px-4 pt-2 pb-4 flex-1">
                <div className="flex flex-col gap-1.5 flex-1">
                  {s.benefits.map((b) => (
                    <div key={b.text} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: active ? `${s.accentColor}15` : '#F1F5F9' }}
                      >
                        <Icon
                          name={b.icon}
                          filled
                          className="text-[14px]"
                          style={{ color: active ? s.accentColor : '#94A3B8' }}
                        />
                      </div>
                      <span className="text-[12px] text-on-surface font-medium truncate">{b.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA strip */}
                <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/30">
                  <div className="min-w-0">
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">
                      {active ? 'Prima' : 'Estado'}
                    </p>
                    <p className="text-label-md font-bold truncate"
                      style={{ color: active ? s.accentColor : '#94A3B8' }}>
                      {s.priceFrom}
                    </p>
                  </div>
                  {active ? (
                    <div
                      className="flex items-center gap-1.5 font-bold text-label-md px-3 py-2 rounded-xl transition-[gap] duration-200 group-hover:gap-2.5 shadow-sm shrink-0"
                      style={{ backgroundColor: s.accentColor, color: '#FFFFFF' }}
                    >
                      <span>{sel ? 'Seleccionado' : 'Elegir'}</span>
                      <Icon name={sel ? 'check' : 'arrow_forward'} className="text-[15px]" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-caption text-on-surface-variant shrink-0">
                      <Icon name="schedule" className="text-[15px]" />
                      <span>Pronto</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Section>
  )
}

function StepMonto({ service, customAmount, setCustomAmount, setQty }) {
  const accent = service?.accentColor ?? BRAND.navy
  return (
    <Section
      title="Monto a recargar"
      subtitle="Elige cuánto quieres añadir a tu billetera"
      icon="savings"
      accent={accent}
    >
      <ServiceBanner service={service} extra="Saldo libre · sin caducidad · multi-producto" />

      <div className="flex flex-col gap-4 mt-3">
        {/* Atajos de monto */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-2">
            Atajos populares
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map((v) => {
              const sel = Number(customAmount) === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setCustomAmount(String(v)); setQty(v) }}
                  className={clsx(
                    'safe-clip py-3 rounded-xl border-2 font-bold transition-[transform,box-shadow,border-color] text-display-sm',
                    sel ? 'shadow-md text-white -translate-y-0.5' : 'border-outline-variant/40 hover:-translate-y-0.5 text-on-surface bg-white',
                  )}
                  style={sel ? { backgroundColor: accent, borderColor: accent } : undefined}
                >
                  ${v}
                </button>
              )
            })}
          </div>
        </div>

        {/* Input personalizado con $ prefijo */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-2">
            O ingresa un monto personalizado
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-display-md font-bold pointer-events-none"
              style={{ color: Number(customAmount) > 0 ? accent : '#94A3B8' }}>
              $
            </span>
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-2xl border-2 border-outline-variant/40 pl-10 pr-4 py-4 text-display-md font-bold text-on-surface focus:ring-2 outline-none transition-[border-color,box-shadow]"
              style={{
                borderColor: Number(customAmount) > 0 ? accent : undefined,
                boxShadow: Number(customAmount) > 0 ? `0 0 0 4px ${accent}15` : undefined,
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-caption font-bold text-on-surface-variant pointer-events-none">
              USD
            </span>
          </div>
          {Number(customAmount) > 0 && (
            <p className="mt-2 text-caption text-on-surface-variant flex items-center gap-1.5">
              <Icon name="currency_exchange" className="text-[14px]" style={{ color: accent }} />
              Equivale a Bs. {(Number(customAmount) * TASA_BS).toLocaleString('es-VE', { maximumFractionDigits: 0 })} aprox.
            </p>
          )}
        </div>
      </div>
    </Section>
  )
}

function StepPlan({ service, periodId, setPeriodId, period, qty, setQty, calc }) {
  const accent = service?.accentColor ?? BRAND.navy
  return (
    <Section
      title="Plan de recarga"
      subtitle="Define el período y la cantidad de cobertura"
      icon="event_repeat"
      accent={accent}
    >
      <ServiceBanner service={service} extra={`Tarifa base: $${service?.pricePerDay}/día`} />

      <div className="flex flex-col gap-4 mt-3">
        <SubBlock label="Período" hint="Mientras más tiempo, mejor precio">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PERIODS.map((p) => {
              const sel = p.id === periodId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setPeriodId(p.id); setQty(p.quick[0]) }}
                  className={clsx(
                    'safe-clip relative rounded-xl p-2.5 border-2 text-left transition-[transform,box-shadow,border-color,background-color]',
                    sel ? 'shadow-sm' : 'hover:border-outline-variant border-outline-variant/40',
                  )}
                  style={sel ? { borderColor: p.color, backgroundColor: `${p.color}10` } : { backgroundColor: '#FFF' }}
                >
                  {p.badge && (
                    <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow"
                      style={{ backgroundColor: p.color, color: '#FFF' }}>
                      {p.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Icon name={p.icon} className="text-[20px]" style={{ color: p.color }} filled />
                    <p className="font-bold text-label-md" style={{ color: sel ? p.color : '#1F2937' }}>{p.label}</p>
                  </div>
                  {p.discount > 0 && (
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: p.color }}>
                      -{Math.round(p.discount * 100)}%
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </SubBlock>

        <SubBlock label={`Cantidad de ${period.plural}`} hint="Usa los atajos o ajusta con +/-">
          <div className="grid grid-cols-4 gap-2 mb-2">
            {period.quick.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setQty(v)}
                className={clsx(
                  'py-2.5 rounded-xl border-2 font-bold transition-[transform,box-shadow,border-color,background-color]',
                  qty === v
                    ? 'shadow-sm text-white'
                    : 'border-outline-variant/40 hover:border-primary text-on-surface',
                )}
                style={qty === v ? { backgroundColor: period.color, borderColor: period.color } : {}}
              >
                {v}
                <span className="block text-[10px] font-normal opacity-80">
                  {v === 1 ? period.short : period.plural}
                </span>
              </button>
            ))}
          </div>
          <div className="rounded-xl border-2 border-outline-variant/40 p-2.5 flex items-center justify-between bg-surface-container-low">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="btn-icon" style={{ backgroundColor: '#FFF' }}>
              <Icon name="remove" />
            </button>
            <div className="text-center">
              <p className="text-display-md font-bold leading-none" style={{ color: period.color }}>
                {qty}
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                {qty === 1 ? period.short : period.plural}
              </p>
            </div>
            <button onClick={() => setQty(qty + 1)} className="btn-icon" style={{ backgroundColor: '#FFF' }}>
              <Icon name="add" />
            </button>
          </div>
        </SubBlock>

        <div className="rounded-xl p-3 flex items-center gap-2 border"
          style={{ backgroundColor: `${period.color}10`, borderColor: `${period.color}40` }}>
          <Icon name="event_available" className="text-[20px]" style={{ color: period.color }} filled />
          <div className="flex-1">
            <p className="text-label-md text-on-surface font-semibold">
              {qty} {qty === 1 ? period.short : period.plural} de cobertura
            </p>
            <p className="text-caption text-on-surface-variant">
              Equivale a {calc?.days} días en total
              {calc?.discount > 0 && (
                <> · <span className="font-bold" style={{ color: period.color }}>ahorras ${calc.discount.toFixed(2)}</span></>
              )}
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}

function StepPago({ service, paymentMethod, setPaymentMethod, banco, setBanco, otpCode, setOtpCode }) {
  const accent = service?.accentColor ?? BRAND.navy
  return (
    <Section
      title="Método de pago"
      subtitle="Elige cómo prefieres pagar"
      icon="payments"
      accent={accent}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PAYMENT_METHODS.map((m) => {
          const sel = m.id === paymentMethod
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaymentMethod(m.id)}
              className={clsx(
                'safe-clip flex items-center gap-2.5 rounded-2xl p-3 border-2 text-left bg-white',
                'transition-[transform,box-shadow,border-color] duration-200',
                sel ? 'shadow-md -translate-y-0.5' : 'hover:-translate-y-0.5 hover:shadow-sm border-outline-variant/40',
              )}
              style={sel ? { borderColor: accent, backgroundColor: `${accent}08` } : undefined}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: sel
                  ? `linear-gradient(135deg, ${accent} 0%, ${accent}DD 100%)`
                  : '#EEF0FA',
                  color: sel ? '#FFF' : accent }}>
                <Icon name={m.icon} className="text-[22px]" filled />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-label-md text-on-surface truncate">{m.label}</p>
                <p className="text-caption text-on-surface-variant truncate">{m.sub}</p>
              </div>
              {sel && (
                <Icon name="check_circle" filled className="text-[20px] shrink-0" style={{ color: accent }} />
              )}
            </button>
          )
        })}
      </div>

      {['transfer', 'mobile', 'otp'].includes(paymentMethod) && (
        <div className="mt-4 rounded-2xl border-2 p-3.5 flex flex-col gap-3.5"
          style={{ borderColor: `${accent}30`, backgroundColor: `${accent}06` }}>
          <SubBlock label="Selecciona tu banco" hint="Solo Banca Amiga y Banco Activo soportados">
            <BancoSelector value={banco} onChange={setBanco} accent={accent} />
          </SubBlock>

          {paymentMethod === 'otp' && (
            <SubBlock
              label="Código OTP (6 dígitos)"
              hint={`El código llega a tu app de ${BANCOS.find((b) => b.id === banco)?.label} y expira en 60s`}
              rightSlot={
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                  <Icon name="lock" className="text-[12px]" /> Más seguro
                </span>
              }
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                className="w-full rounded-xl border-2 px-3 py-3 text-display-sm font-mono font-bold text-center tracking-[0.5em] text-on-surface focus:ring-2 outline-none bg-white transition-[border-color,box-shadow]"
                style={{
                  borderColor: otpCode.length === 6 ? accent : '#E2E8F0',
                  boxShadow: otpCode.length === 6 ? `0 0 0 4px ${accent}20` : undefined,
                }}
              />
            </SubBlock>
          )}
        </div>
      )}
    </Section>
  )
}

function StepRevision({ service, period, qty, calc, paymentMethod, banco }) {
  const accent = service?.accentColor ?? BRAND.navy
  const metodo = PAYMENT_METHODS.find((m) => m.id === paymentMethod)
  const bancoLabel = ['transfer', 'mobile', 'otp'].includes(paymentMethod)
    ? BANCOS.find((b) => b.id === banco)?.label
    : null

  return (
    <Section
      title="Confirma tu recarga"
      subtitle="Revisa todos los datos antes de pagar"
      icon="task_alt"
      accent={accent}
    >
      {/* ── Hero del recibo con paleta del servicio ── */}
      <div className="relative rounded-2xl overflow-hidden mb-4"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}DD 50%, ${accent}AA 100%)` }}>
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full opacity-10 bg-white" />
        <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-white" />
        <div className="relative p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white/15 backdrop-blur-sm border border-white/25 shadow-lg">
              <Icon name={service?.icon ?? 'receipt_long'} className="text-[28px]" filled />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider opacity-85 font-bold">
                {service?.chip}
              </p>
              <h3 className="text-headline-md font-bold truncate">{service?.label}</h3>
              <p className="text-caption opacity-90 mt-0.5 truncate">{service?.subtitle}</p>
            </div>
            <div className="hidden sm:block text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider opacity-85 font-bold">Total</p>
              <p className="text-headline-lg font-bold leading-none">${calc?.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Píldoras informativas */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {!service?.isWallet ? (
              <>
                <RevisionPill icon={period.icon} label={`${qty} ${qty === 1 ? period.short : period.plural}`} />
                <RevisionPill icon="event_available" label={`${calc?.days} días`} />
                {calc?.discount > 0 && (
                  <RevisionPill icon="local_offer" label={`-${Math.round(period.discount * 100)}%`} highlight />
                )}
              </>
            ) : (
              <RevisionPill icon="savings" label="Recarga única" />
            )}
            <RevisionPill icon="schedule" label="Activación inmediata" />
          </div>
        </div>
      </div>

      {/* ── Detalle (2 columnas en desktop, apilado en mobile) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Cobro */}
        <ReceiptCard accent={accent} icon="receipt_long" title="Detalle del cobro">
          {!service?.isWallet ? (
            <SumRow label={`${calc?.days} días × $${service?.pricePerDay}`} value={`$${calc?.subtotal.toFixed(2)}`} />
          ) : (
            <SumRow label="Monto base" value={`$${(calc?.subtotal ?? 0).toFixed(2)}`} />
          )}
          {calc?.discount > 0 && (
            <SumRow
              label={`Descuento -${Math.round(period.discount * 100)}%`}
              value={`-$${calc?.discount.toFixed(2)}`}
              valueColor="#16A34A"
            />
          )}
          <SumRow label="IVA 16%" value={`$${calc?.iva.toFixed(2)}`} />
          <div className="border-t-2 border-dashed mt-2 pt-2" style={{ borderColor: `${accent}40` }}>
            <div className="flex items-baseline justify-between">
              <span className="text-label-lg font-bold text-on-surface">Total a pagar</span>
              <div className="text-right">
                <p className="text-display-md font-bold leading-none" style={{ color: accent }}>
                  ${calc?.total.toFixed(2)}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  ≈ Bs. {calc?.totalBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </ReceiptCard>

        {/* Forma de pago */}
        <ReceiptCard accent={accent} icon="payments" title="Forma de pago">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}DD 100%)` }}>
              <Icon name={metodo?.icon ?? 'credit_card'} className="text-[22px] text-white" filled />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-label-md text-on-surface truncate">{metodo?.label}</p>
              <p className="text-caption text-on-surface-variant truncate">{metodo?.sub}</p>
            </div>
          </div>
          {bancoLabel && (
            <div className="rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}20` }}>
              <Icon name="account_balance" className="text-[18px]" style={{ color: accent }} filled />
              <span className="text-caption font-bold text-on-surface">{bancoLabel}</span>
            </div>
          )}
          {!bancoLabel && (
            <div className="mt-1 text-caption text-on-surface-variant flex items-center gap-1.5">
              <Icon name="verified" className="text-[14px]" style={{ color: accent }} filled />
              Cobro seguro · protegido con cifrado SSL
            </div>
          )}
        </ReceiptCard>
      </div>

      {/* Aviso demo */}
      <div className="mt-3 rounded-xl px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D' }}>
        <Icon name="info" className="text-[16px] shrink-0" style={{ color: '#B45309' }} filled />
        <p className="text-caption" style={{ color: '#78350F' }}>
          <strong>Demo</strong> — la transacción es simulada y aparecerá en <strong>Mis Movimientos</strong> al confirmar.
        </p>
      </div>
    </Section>
  )
}

/* Píldora dentro del hero de Revisión */
function RevisionPill({ icon, label, highlight }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm border',
      highlight
        ? 'bg-amber-300 text-amber-900 border-amber-200/50'
        : 'bg-white/15 text-white border-white/25',
    )}>
      <Icon name={icon} className="text-[14px]" filled />
      {label}
    </span>
  )
}

/* Card de recibo con encabezado coloreado */
function ReceiptCard({ accent, icon, title, children }) {
  return (
    <div className="rounded-2xl bg-white border border-outline-variant/40 overflow-hidden">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-outline-variant/30"
        style={{ backgroundColor: `${accent}08` }}>
        <Icon name={icon} className="text-[16px]" style={{ color: accent }} filled />
        <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
          {title}
        </p>
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        {children}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SUCCESS
   ══════════════════════════════════════════════════════════════════ */
function SuccessView({ data, navigate }) {
  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Recarga exitosa' }]}
        title="¡Recarga completada!"
        subtitle="Tu saldo se ha agregado correctamente"
      />
      <div className="rounded-3xl p-8 text-center relative overflow-hidden"
        style={{ backgroundColor: '#DCFCE7', border: '2px solid #86EFAC' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-15 bg-green-500" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl">
            <Icon name="account_balance_wallet" className="text-[60px] text-green-700" filled />
          </div>
          <div>
            <h1 className="text-display-md font-bold text-green-800">¡Recarga exitosa!</h1>
            <p className="text-body-md text-green-700 mt-2">
              Tu cobertura ya está activa en <strong>{data.service}</strong>
            </p>
          </div>
          <div className="bg-white/70 rounded-2xl px-6 py-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-green-700">Total recargado</p>
            <p className="text-display-lg font-bold text-green-800">${data.total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryRow icon="confirmation_number" label="Referencia" value={data.reference} mono />
        <SummaryRow icon="schedule"           label="Período"
          value={`${data.qty} ${data.qty === 1 ? data.period.short : data.period.plural}`} />
        <SummaryRow icon="event_available"     label="Días de cobertura" value={`${data.days} días`} />
        <SummaryRow icon={data.paymentMethod.icon} label="Método de pago" value={data.paymentMethod.label} />
        {data.banco && (
          <SummaryRow icon="account_balance" label="Banco" value={data.banco} />
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate('/movimientos')} className="btn-primary flex-1 py-3">
          <Icon name="history" /> Ver Mis Movimientos
        </button>
        <button onClick={() => navigate('/dashboard')} className="btn-soft flex-1 py-3">
          <Icon name="storefront" /> Volver a Productos
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   UI building blocks
   ══════════════════════════════════════════════════════════════════ */

/**
 * Card de sección con header (icono + título + subtítulo).
 * El borde superior usa el accent color del servicio actual para
 * dar coherencia visual con el producto que se está recargando.
 */
function Section({ title, subtitle, icon, accent = BRAND.navy, children }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Encabezado sin card — solo una línea de acento + icono + texto */}
      <div className="flex items-center gap-2.5 pl-3 border-l-4 transition-[border-color] duration-300"
        style={{ borderColor: accent }}>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accent}15`, color: accent }}>
            <Icon name={icon} className="text-[18px]" filled />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-label-lg font-bold leading-tight" style={{ color: accent }}>
            {title}
          </h3>
          {subtitle && <p className="text-caption text-on-surface-variant mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {/* Contenido directo, sin wrapper con borde */}
      <div>{children}</div>
    </div>
  )
}

/**
 * Banner compacto del servicio seleccionado, mostrado dentro de los pasos
 * Plan/Monto/Pago para mantener el contexto sin tomar mucho espacio.
 */
function ServiceBanner({ service, extra }) {
  if (!service) return null
  const accent = service.accentColor
  return (
    <div className="rounded-2xl flex items-center gap-3 p-3 mb-1"
      style={{ backgroundColor: `${accent}0E`, border: `1px solid ${accent}25` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}DD 100%)` }}>
        <Icon name={service.icon} className="text-[20px] text-white" filled />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: accent }}>
          Recargando · {service.chip}
        </p>
        <p className="font-bold text-label-md text-on-surface truncate">{service.label}</p>
      </div>
      {extra && (
        <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: '#FFF', color: accent, border: `1px solid ${accent}30` }}>
          {extra}
        </span>
      )}
    </div>
  )
}

/**
 * Sub-bloque dentro de una Section — para agrupar campos relacionados
 * sin agregar otra Card. Usado en "Plan de recarga" (período + cantidad).
 */
function SubBlock({ label, hint, rightSlot, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
        {rightSlot}
      </div>
      {hint && <p className="text-caption text-on-surface-variant mb-2 leading-snug">{hint}</p>}
      {children}
    </div>
  )
}

function BancoSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BANCOS.map((b) => {
        const sel = b.id === value
        return (
          <button
            key={b.id}
            onClick={() => onChange(b.id)}
            className={clsx(
              'safe-clip flex items-center gap-2 rounded-xl p-2.5 border-2 text-left bg-white',
              'transition-[transform,box-shadow,border-color] duration-200',
              sel ? 'shadow-md -translate-y-0.5' : 'hover:-translate-y-0.5 border-outline-variant/40',
            )}
            style={sel ? { borderColor: b.color, backgroundColor: `${b.color}10` } : undefined}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-caption shadow-sm"
              style={{ backgroundColor: b.color }}>
              {b.id}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-label-md truncate" style={{ color: sel ? b.color : '#1F2937' }}>
                {b.label}
              </p>
              <p className="text-caption text-on-surface-variant truncate">{b.short}</p>
            </div>
            {sel && <Icon name="check_circle" className="text-[18px]" style={{ color: b.color }} filled />}
          </button>
        )
      })}
    </div>
  )
}

function SumRow({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between text-label-md">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-bold" style={{ color: valueColor ?? '#1F2937' }}>{value}</span>
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
