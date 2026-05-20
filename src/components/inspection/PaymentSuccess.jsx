import PageHeader from '../ui/PageHeader'
import Icon from '../ui/Icon'
import { PLAN_TONES, BRAND } from '../../theme/tokens'

/**
 * PaymentSuccess — confirmation screen shown after a simulated payment.
 */
export default function PaymentSuccess({ payment, plan, inspectionNumber, navigate }) {
  const tone = PLAN_TONES[plan?.color] ?? PLAN_TONES.success
  const policyNumber = `POL-2026-${String(900 + Math.floor(Math.random() * 99)).padStart(3, '0')}`

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Movimientos', to: '/movimientos' },
        ]}
        eyebrow={inspectionNumber}
        title="¡Pago procesado!"
        subtitle="Tu póliza ha sido emitida correctamente"
      />

      {/* ── Success hero ────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden"
        style={{ backgroundColor: tone.bg, border: `2px solid ${tone.border}` }}
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-15"
          style={{ backgroundColor: tone.fg }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
          style={{ backgroundColor: tone.fg }} />

        <div className="relative flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl">
            <Icon name="check_circle" className="text-[64px]" style={{ color: tone.fg }} filled />
          </div>
          <div>
            <h1 className="text-display-md font-bold leading-tight" style={{ color: tone.fg }}>
              ¡Listo! 🎉
            </h1>
            <p className="text-body-md mt-2 max-w-md mx-auto" style={{ color: tone.fg }}>
              Tu pago de <strong>${payment?.total?.toFixed(2)}</strong> fue procesado correctamente
              y tu póliza está activa.
            </p>
          </div>
        </div>
      </div>

      {/* ── Policy info ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard
          icon="policy"
          label="Número de póliza"
          value={policyNumber}
          mono
          tone={tone}
        />
        <InfoCard
          icon="receipt_long"
          label="Referencia de pago"
          value={payment?.reference ?? '—'}
          mono
          tone={tone}
        />
        <InfoCard
          icon={plan?.icono ?? 'verified_user'}
          label="Plan contratado"
          value={plan?.nombre ?? '—'}
          tone={tone}
        />
        <InfoCard
          icon="event_repeat"
          label="Frecuencia"
          value={(payment?.periodo ?? 'mensual').replace(/^./, (c) => c.toUpperCase())}
          tone={tone}
        />
      </div>

      {/* ── Next steps ─────────────────────────────────────────────── */}
      <div className="card p-5" style={{ borderTop: `3px solid ${BRAND.navy}` }}>
        <h3 className="text-headline-md font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.navy }}>
          <Icon name="rocket_launch" className="text-[22px]" filled />
          Próximos pasos
        </h3>
        <div className="flex flex-col gap-2.5">
          {[
            { icon: 'mail',                 label: 'Recibirás un correo con la póliza en PDF en los próximos minutos.' },
            { icon: 'phone_iphone',         label: 'Guarda el número de póliza en tu teléfono para asistencia 24/7.' },
            { icon: 'support_agent',        label: 'Si tienes alguna duda, contáctanos por WhatsApp o desde el menú de Ayuda.' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#EEF0FA', color: BRAND.navy }}>
                <Icon name={s.icon} className="text-[18px]" filled />
              </div>
              <p className="text-body-md text-on-surface flex-1 pt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTAs ───────────────────────────────────────────────────── */}
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

function InfoCard({ icon, label, value, mono, tone }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: tone.bg, color: tone.fg }}>
        <Icon name={icon} className="text-[22px]" filled />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide font-bold">{label}</p>
        <p className={`font-bold text-on-surface text-label-md truncate ${mono ? 'font-mono' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
