import { useMemo, useState } from 'react'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'

export default function CoveragePage() {
  const { plans, policies, getVehicle, buyDays, addPago, addActivity } = useData()
  const navigate = useNavigate()
  const toast = useToast()

  const [modalidad, setModalidad] = useState('dias')
  const [planId, setPlanId] = useState('plan-premium')
  const [days, setDays] = useState(4)
  const [policyId, setPolicyId] = useState(policies[0]?.id)
  const [processing, setProcessing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const policy = policies.find((p) => p.id === policyId) ?? policies[0]
  const vehicle = getVehicle(policy?.vehicleId)
  const plan = plans.find((p) => p.id === planId)

  const startDate = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const endDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + Number(days || 0))
    return d.toISOString().slice(0, 10)
  }, [days])

  const total = (plan?.precioDia ?? 0) * Number(days || 0)

  const activate = () => {
    setProcessing(true)
    setTimeout(() => {
      buyDays(policy.id, Number(days), total)
      addPago({
        fecha: new Date().toISOString().slice(0, 10),
        concepto: `Compra de ${days} días — ${policy.numero}`,
        metodo: 'Saldo',
        monto: -total,
        estado: 'Completado',
      })
      addActivity({
        type: 'days-bought',
        title: `Compra de ${days} días`,
        subtitle: `Pago con saldo · ${policy.numero}`,
        when: 'Hace un momento',
        icon: 'add_shopping_cart',
        tone: 'primary',
        amount: -total,
      })
      toast.success(`¡Cobertura activada por ${days} días!`, { title: 'Pago confirmado' })
      setProcessing(false)
      navigate(`/polizas/${policy.id}`)
    }, 1200)
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Cobertura' }]}
        title="Activación de Cobertura"
        subtitle="Selecciona tu plan y la cantidad de días para proteger tu vehículo hoy mismo."
      />

      {/* ── Main content — full width ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 pb-36 sm:pb-32">

        {/* Modalidad toggle */}
        <div className="card p-1 flex w-full sm:max-w-xs">
          {[
            { id: 'dias', label: 'Por Días', icon: 'calendar_today' },
            { id: 'saldo', label: 'Por Saldo', icon: 'account_balance_wallet' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModalidad(m.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-label-md transition',
                modalidad === m.id
                  ? 'bg-gradient-brand-soft text-on-primary shadow-elev-primary'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              <Icon name={m.icon} className="text-[16px]" />
              {m.label}
            </button>
          ))}
        </div>

        {/* Vehicle selector */}
        <section className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-1">Vehículo a proteger</h3>
          <p className="text-body-md text-on-surface-variant mb-3">
            Elige el vehículo que quieres cubrir en este periodo.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {policies.map((p) => {
              const v = getVehicle(p.vehicleId)
              const active = p.id === policyId
              return (
                <button
                  key={p.id}
                  onClick={() => setPolicyId(p.id)}
                  className={clsx(
                    'rounded-xl border-2 overflow-hidden text-left transition active:scale-[0.99]',
                    active
                      ? 'border-primary ring-2 ring-primary/20 shadow-elev-primary'
                      : 'border-outline-variant/60 hover:border-primary/50',
                  )}
                >
                  <div className="aspect-[16/10] relative bg-surface-container">
                    {v && <img src={v.image} alt="" className="w-full h-full object-cover" />}
                    {active && (
                      <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-gradient-accent text-white flex items-center justify-center shadow-elev-accent">
                        <Icon name="check" className="text-[16px]" filled />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-label-md font-bold text-on-surface truncate">
                      {v?.marca} {v?.modelo}
                    </p>
                    <p className="text-caption text-on-surface-variant truncate">
                      {v?.placa} · {p.plan}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Plan selector — full width 3 cols */}
        <section>
          <h3 className="text-headline-md text-on-surface mb-1">Plan de cobertura</h3>
          <p className="text-body-md text-on-surface-variant mb-3">
            Elige el nivel de protección que mejor se adapta a ti.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {plans.map((p) => {
              const active = planId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPlanId(p.id)}
                  className={clsx(
                    'card p-5 sm:p-6 text-left relative overflow-hidden transition active:scale-[0.99] group',
                    active
                      ? 'border-2 border-primary ring-2 ring-primary/20 shadow-elev-primary'
                      : 'hover:border-primary/40 hover:-translate-y-1 hover:shadow-elev-2',
                  )}
                >
                  {p.recomendado && (
                    <span className="absolute top-0 right-0 bg-gradient-accent text-white text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-bl-xl font-bold">
                      Recomendado
                    </span>
                  )}

                  {/* Active check */}
                  {active && (
                    <span className="absolute top-3 left-3 w-7 h-7 rounded-full bg-gradient-accent text-white flex items-center justify-center shadow-elev-accent">
                      <Icon name="check" className="text-[16px]" filled />
                    </span>
                  )}

                  <div
                    className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition',
                      active
                        ? 'bg-gradient-brand-soft text-on-primary shadow-elev-primary'
                        : 'bg-primary-fixed text-primary group-hover:bg-gradient-brand-soft group-hover:text-on-primary',
                    )}
                  >
                    <Icon name={p.icon} className="text-[26px]" filled />
                  </div>

                  <h3
                    className={clsx(
                      'text-headline-md mb-1 truncate transition',
                      active ? 'text-primary' : 'text-on-surface',
                    )}
                  >
                    {p.nombre}
                  </h3>
                  <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2">
                    {p.descripcion}
                  </p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-display-lg font-bold text-on-surface">${p.precioDia}</span>
                    <span className="text-body-md text-outline">/ día</span>
                  </div>

                  <ul className="space-y-1.5">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-body-md text-on-surface-variant"
                      >
                        <Icon
                          name="check_circle"
                          className={clsx(
                            'text-[18px] shrink-0 transition',
                            active ? 'text-accent-500' : 'text-success',
                          )}
                          filled
                        />
                        <span className="line-clamp-1">{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>
        </section>

        {/* Days selector */}
        <section className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-1">¿Cuántos días?</h3>
          <p className="text-body-md text-on-surface-variant mb-3">
            Selecciona un periodo o escribe el número exacto de días.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="flex gap-2 flex-wrap mb-3">
                {[1, 3, 7, 15, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={clsx(
                      'px-4 py-2 rounded-full text-label-md font-bold border-2 transition active:scale-95',
                      days === d
                        ? 'bg-gradient-brand-soft text-on-primary border-primary shadow-elev-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary',
                    )}
                  >
                    {d === 1 ? '1 día' : `${d} días`}
                  </button>
                ))}
              </div>
              <label className="label">Número de días personalizado</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Math.max(1, +e.target.value))}
                className="input max-w-[160px]"
                min={1}
                max={365}
              />
            </div>
            <div>
              <label className="label">Inicio de cobertura</label>
              <input className="input" type="date" defaultValue={startDate} readOnly />
            </div>
            <div>
              <label className="label">Fin estimado</label>
              <input className="input" type="date" value={endDate} readOnly />
            </div>
          </div>
        </section>

      </div>

      {/* ── Sticky checkout bar ───────────────────────────────────────────── */}
      {/* Mobile: sits above BottomNav (72px+safe-area). md+: at true bottom, left offset for sidebar */}
      <div className="fixed inset-x-0 z-40 md:left-64 checkout-sticky">
        {/* Confirmation layer */}
        {confirmed && (
          <div className="bg-success text-on-success px-4 py-2 flex items-center justify-between gap-3 text-label-md">
            <div className="flex items-start gap-2 min-w-0">
              <Icon name="info" filled className="text-[18px] shrink-0 mt-0.5" />
              <span className="text-caption sm:text-label-md break-words min-w-0">
                Confirma: <strong>{days} {days === 1 ? 'día' : 'días'}</strong> ·{' '}
                <strong>{plan?.nombre}</strong> · {vehicle?.marca} {vehicle?.modelo} · <strong>${total}</strong>
              </span>
            </div>
            <button
              onClick={() => setConfirmed(false)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/20 shrink-0"
              aria-label="Cancelar"
            >
              <Icon name="close" />
            </button>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-xl border-t-2 border-primary/20 shadow-[0_-8px_32px_rgba(15,26,90,0.15)]">
          <div className="max-w-container mx-auto container-pad py-3">
            <div className="flex items-center gap-3">

              {/* Plan pill */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                  <Icon name={plan?.icon ?? 'verified_user'} className="text-[20px]" filled />
                </div>
                <div className="min-w-0">
                  <p className="text-caption text-on-surface-variant leading-none">Plan</p>
                  <p className="text-label-md font-bold text-on-surface truncate">{plan?.nombre}</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-outline-variant/60 shrink-0" />

              {/* Days */}
              <div className="hidden sm:block shrink-0">
                <p className="text-caption text-on-surface-variant leading-none">Duración</p>
                <p className="text-label-md font-bold text-on-surface">
                  {days} {days === 1 ? 'día' : 'días'}
                </p>
              </div>

              <div className="hidden sm:block w-px h-8 bg-outline-variant/60 shrink-0" />

              {/* Vehicle */}
              <div className="hidden md:block shrink-0 min-w-0 max-w-[140px]">
                <p className="text-caption text-on-surface-variant leading-none">Vehículo</p>
                <p className="text-label-md font-bold text-on-surface truncate">
                  {vehicle?.marca} {vehicle?.modelo}
                </p>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Total */}
              <div className="shrink-0 text-right">
                <p className="text-caption text-on-surface-variant leading-none">Total</p>
                <p className="text-display-lg font-bold text-primary leading-none">${total}</p>
              </div>

              {/* CTA */}
              <button
                onClick={() => {
                  if (!confirmed) {
                    setConfirmed(true)
                    return
                  }
                  setConfirmed(false)
                  activate()
                }}
                disabled={processing}
                className={clsx(
                  'shrink-0 flex items-center gap-2 font-bold text-label-md sm:text-body-md py-3 px-4 sm:px-6 rounded-xl transition active:scale-[0.97] min-h-[48px] shadow-elev-accent',
                  confirmed
                    ? 'bg-success text-on-success hover:brightness-110'
                    : 'text-white hover:brightness-110',
                  !confirmed && 'bg-gradient-accent',
                  processing && 'opacity-70 cursor-not-allowed',
                )}
                style={
                  !confirmed
                    ? { backgroundImage: 'linear-gradient(135deg,#FF6675 0%,#E84F51 50%,#B23F44 100%)' }
                    : {}
                }
              >
                {processing ? (
                  <>
                    <Icon name="progress_activity" className="animate-spin text-[20px]" />
                    <span className="hidden sm:inline">Procesando…</span>
                  </>
                ) : confirmed ? (
                  <>
                    <Icon name="check_circle" className="text-[20px]" filled />
                    <span>Confirmar pago</span>
                  </>
                ) : (
                  <>
                    <Icon name="bolt" className="text-[20px]" filled />
                    <span className="sm:hidden">Activar</span>
                    <span className="hidden sm:inline">Activar Cobertura</span>
                  </>
                )}
              </button>
            </div>

            {/* Fine print */}
            <p className="text-center text-[11px] text-on-surface-variant mt-1.5 leading-snug">
              ${plan?.precioDia}/día × {days} {days === 1 ? 'día' : 'días'} · {plan?.nombre} ·{' '}
              {vehicle?.placa} · Al activar aceptas los{' '}
              <button className="underline hover:text-primary transition">
                términos y condiciones
              </button>{' '}
              de La Mundial.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
