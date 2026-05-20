import { useState } from 'react'
import clsx from 'clsx'
import PageHeader from '../ui/PageHeader'
import Icon from '../ui/Icon'
import { PLAN_TONES, BRAND } from '../../theme/tokens'

/**
 * PaymentStep — simulated payment step shown after the AI analysis review.
 * Renders a payment-method selector + form pre-filled with demo data.
 * Calls onConfirm(payload) when the user confirms the payment.
 */
const BANCOS = [
  { id: '0172', label: 'Bancamiga',    short: 'Banca Amiga',  color: '#0E7A3D' },
  { id: '0171', label: 'Banco Activo', short: 'Banco Activo', color: '#E11D48' },
]

const PAYMENT_METHODS = [
  { id: 'card',        label: 'Tarjeta de crédito/débito', icon: 'credit_card',     sub: 'Visa, Mastercard, Amex' },
  { id: 'transfer',    label: 'Transferencia bancaria',    icon: 'account_balance', sub: 'Banca Amiga · Banco Activo' },
  { id: 'pago-movil',  label: 'Pago móvil',                icon: 'phone_iphone',    sub: 'Bs. al instante' },
  { id: 'otp',         label: 'Token OTP bancario',        icon: 'key',             sub: 'Código de un solo uso' },
  { id: 'cash',        label: 'Pago en oficina',           icon: 'storefront',      sub: 'Oficina más cercana' },
]

const DEMO_CARD = {
  titular:     'Carolina Rivas',
  numero:      '4532 •••• •••• 1234',
  expira:      '12/27',
  cvv:         '•••',
  banco:       'Bancamiga',
}

export default function PaymentStep({ plan, inspectionNumber, onConfirm, onBack }) {
  const [method, setMethod]     = useState('card')
  const [periodo, setPeriodo]   = useState('mensual')  // diaria | mensual | anual
  const [accepting, setAccepting] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [banco, setBanco]       = useState(BANCOS[0].id)  // banco para transferencia / pago-móvil / OTP
  const [otpCode, setOtpCode]   = useState('')

  if (!plan) return null

  const tone = PLAN_TONES[plan.color] ?? PLAN_TONES.success
  const monto = plan.prima[periodo] ?? plan.prima.mensual
  const impuesto = +(monto * 0.16).toFixed(2)
  const total = +(monto + impuesto).toFixed(2)

  const otpValido = method !== 'otp' || otpCode.length === 6
  const canPay = accepting && !processing && otpValido

  function handleConfirm() {
    if (!canPay) return
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      onConfirm?.({
        method,
        periodo,
        monto,
        total,
        banco: ['transfer', 'pago-movil', 'otp'].includes(method)
          ? BANCOS.find((b) => b.id === banco)?.label
          : null,
        otpCode: method === 'otp' ? otpCode : null,
        plan: plan.nombre,
        reference: `PAY-${Date.now().toString().slice(-8)}`,
      })
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-5 pb-32 md:pb-8">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Inspecciones', to: '/inspecciones' },
          { label: inspectionNumber, to: '#' },
          { label: 'Pago' },
        ]}
        eyebrow={inspectionNumber}
        title="Confirmar pago"
        subtitle="Selecciona tu método de pago y completa la suscripción"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left: payment method + form ─────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Method selector */}
          <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
            <h3 className="text-headline-md font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.navy }}>
              <Icon name="payments" className="text-[22px]" filled />
              Método de pago
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const sel = method === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                      sel
                        ? 'shadow-sm'
                        : 'hover:border-outline-variant border-outline-variant/40',
                    )}
                    style={sel ? { borderColor: BRAND.navy, backgroundColor: `${BRAND.navy}08` } : {}}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: sel ? BRAND.navy : '#EEF0FA', color: sel ? '#FFFFFF' : BRAND.navy }}
                    >
                      <Icon name={m.icon} className="text-[22px]" filled />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface text-label-md truncate">{m.label}</p>
                      <p className="text-caption text-on-surface-variant truncate">{m.sub}</p>
                    </div>
                    {sel && <Icon name="check_circle" className="text-[20px] shrink-0" style={{ color: BRAND.navy }} filled />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Card form (only when card selected) */}
          {method === 'card' && (
            <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-headline-md font-bold flex items-center gap-2" style={{ color: BRAND.navy }}>
                  <Icon name="credit_card" className="text-[22px]" filled />
                  Datos de la tarjeta
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full">
                  Demo
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Titular"      value={DEMO_CARD.titular} />
                <Field label="Banco emisor" value={DEMO_CARD.banco} />
                <Field label="Número de tarjeta" value={DEMO_CARD.numero} mono className="sm:col-span-2" />
                <Field label="Vencimiento"  value={DEMO_CARD.expira} mono />
                <Field label="CVV"          value={DEMO_CARD.cvv} mono />
              </div>
              <p className="text-caption text-on-surface-variant mt-3 flex items-center gap-1.5">
                <Icon name="lock" className="text-[16px]" filled />
                Tus datos están protegidos. Pago simulado con datos de prueba.
              </p>
            </div>
          )}

          {/* Transfer info */}
          {method === 'transfer' && (
            <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
              <h3 className="text-headline-md font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.navy }}>
                <Icon name="account_balance" className="text-[22px]" filled />
                Datos para transferencia
              </h3>
              <BancoSelector value={banco} onChange={setBanco} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <Field label="Banco"          value={BANCOS.find((b) => b.id === banco).label} />
                <Field label="Tipo de cuenta" value="Corriente" />
                <Field label="Cuenta"         value={`${banco}-0000-00-0000000000`} mono className="sm:col-span-2" />
                <Field label="RIF"            value="J-30000000-0" mono />
                <Field label="Beneficiario"   value="La Mundial de Seguros" />
              </div>
            </div>
          )}

          {/* Pago Móvil info */}
          {method === 'pago-movil' && (
            <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
              <h3 className="text-headline-md font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.navy }}>
                <Icon name="phone_iphone" className="text-[22px]" filled />
                Pago móvil
              </h3>
              <BancoSelector value={banco} onChange={setBanco} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <Field label="Banco"     value={`${banco} — ${BANCOS.find((b) => b.id === banco).label}`} />
                <Field label="Cédula"    value="V-12.345.678" mono />
                <Field label="Teléfono"  value="0414-1234567" mono />
                <Field label="Monto Bs." value={`${(total * 36.5).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`} />
              </div>
            </div>
          )}

          {/* OTP — Token bancario */}
          {method === 'otp' && (
            <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-headline-md font-bold flex items-center gap-2" style={{ color: BRAND.navy }}>
                  <Icon name="key" className="text-[22px]" filled />
                  Token OTP
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                  Más seguro
                </span>
              </div>
              <p className="text-caption text-on-surface-variant mb-3">
                Recibirás un código de 6 dígitos en tu app bancaria o por SMS. Ingrésalo para confirmar el pago.
              </p>
              <BancoSelector value={banco} onChange={setBanco} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-3">
                <Field label="Banco emisor" value={BANCOS.find((b) => b.id === banco).label} />
                <Field label="Cédula"       value="V-12.345.678" mono />
                <Field label="Cuenta"       value={`${banco}-•••-••-••••••1234`} mono className="sm:col-span-2" />
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Código OTP (6 dígitos)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="rounded-xl border-2 border-outline-variant/40 px-3 py-3 text-display-sm font-mono font-bold text-center tracking-[0.5em] text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <span className="text-caption text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <Icon name="schedule" className="text-[14px]" />
                  El código expira en 60 segundos
                </span>
              </label>
            </div>
          )}

          {/* Cash info */}
          {method === 'cash' && (
            <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
              <h3 className="text-headline-md font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.navy }}>
                <Icon name="storefront" className="text-[22px]" filled />
                Pago en oficina
              </h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Acércate a la oficina más cercana de La Mundial de Seguros con tu cédula y el código de referencia
                que recibirás por correo. El pago se procesará en menos de 24 horas.
              </p>
            </div>
          )}

          {/* Periodo selector */}
          <div className="card p-4 sm:p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
            <h3 className="text-headline-md font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.navy }}>
              <Icon name="event_repeat" className="text-[22px]" filled />
              Frecuencia
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'diaria',  label: 'Diaria',  prima: plan.prima.diaria },
                { id: 'mensual', label: 'Mensual', prima: plan.prima.mensual },
                { id: 'anual',   label: 'Anual',   prima: plan.prima.anual },
              ].map((p) => {
                const sel = periodo === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setPeriodo(p.id)}
                    className={clsx(
                      'rounded-xl p-3 border-2 text-center transition-all',
                      sel ? 'shadow-sm' : 'hover:border-outline-variant border-outline-variant/40',
                    )}
                    style={sel ? { borderColor: BRAND.navy, backgroundColor: `${BRAND.navy}08` } : {}}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      {p.label}
                    </p>
                    <p className="text-headline-md font-bold" style={{ color: BRAND.navy }}>
                      ${p.prima.toFixed(2)}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Right: summary ────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4 rounded-2xl p-5 border-2 flex flex-col gap-4"
            style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-sm"
                style={{ color: tone.fg }}>
                <Icon name={plan.icono} className="text-[26px]" filled />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tone.fg }}>
                  Plan seleccionado
                </p>
                <h3 className="text-headline-md font-bold leading-tight" style={{ color: tone.fg }}>
                  {plan.nombre}
                </h3>
              </div>
            </div>

            <div className="bg-white/60 rounded-xl p-3 flex flex-col gap-1.5">
              <Row label={`Prima ${periodo}`} value={`$${monto.toFixed(2)}`} fg={tone.fg} />
              <Row label="IVA (16%)"          value={`$${impuesto.toFixed(2)}`} fg={tone.fg} />
              <div className="border-t border-current/15 pt-1.5 mt-1">
                <Row label="Total a pagar" value={`$${total.toFixed(2)}`} fg={tone.fg} bold />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={accepting}
                onChange={(e) => setAccepting(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded shrink-0 accent-current"
                style={{ color: tone.fg }}
              />
              <span className="text-caption" style={{ color: tone.fg }}>
                Acepto los <strong>términos y condiciones</strong> de La Mundial de Seguros y autorizo el cobro
                recurrente con la frecuencia seleccionada.
              </span>
            </label>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirm}
                disabled={!canPay}
                className={clsx(
                  'w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-body-md transition-all',
                  canPay
                    ? 'shadow-md hover:shadow-lg active:scale-[0.98] text-white'
                    : 'opacity-50 cursor-not-allowed text-white',
                )}
                style={{ backgroundColor: tone.fg }}
              >
                {processing ? (
                  <>
                    <Icon name="autorenew" className="text-[20px] animate-spin" />
                    Procesando pago…
                  </>
                ) : (
                  <>
                    <Icon name="lock" className="text-[18px]" filled />
                    Pagar ${total.toFixed(2)}
                  </>
                )}
              </button>
              <button
                onClick={onBack}
                disabled={processing}
                className="btn-soft w-full"
              >
                <Icon name="arrow_back" /> Volver al resultado
              </button>
            </div>

            <p className="text-[11px] text-center" style={{ color: tone.fg }}>
              <Icon name="verified_user" className="text-[14px] inline-block mr-0.5" filled />
              Conexión segura SSL · Pago simulado para demo
            </p>
          </div>
        </div>
      </div>
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
              'flex items-center gap-2 rounded-xl p-2.5 border-2 transition-all text-left',
              sel ? 'shadow-sm' : 'hover:border-outline-variant border-outline-variant/40',
            )}
            style={sel ? { borderColor: b.color, backgroundColor: `${b.color}10` } : {}}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-caption"
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

function Row({ label, value, fg, bold }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={clsx('text-caption', bold ? 'font-bold' : 'opacity-85')} style={{ color: fg }}>
        {label}
      </span>
      <span
        className={clsx(bold ? 'text-headline-md font-bold' : 'text-label-md font-semibold')}
        style={{ color: fg }}
      >
        {value}
      </span>
    </div>
  )
}
