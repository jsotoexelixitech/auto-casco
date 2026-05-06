import { useMemo, useState } from 'react'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'

export default function CoveragePage() {
  const { plans, policies, getVehicle, buyDays, addPago, addActivity } =
    useData()
  const navigate = useNavigate()
  const toast = useToast()

  const [modalidad, setModalidad] = useState('dias')
  const [planId, setPlanId] = useState('plan-premium')
  const [days, setDays] = useState(4)
  const [policyId, setPolicyId] = useState(policies[0]?.id)
  const [processing, setProcessing] = useState(false)

  const policy = policies.find((p) => p.id === policyId) ?? policies[0]
  const vehicle = getVehicle(policy?.vehicleId)
  const plan = plans.find((p) => p.id === planId)

  const startDate = useMemo(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  }, [])
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
      toast.success(`¡Cobertura activada por ${days} días!`, {
        title: 'Pago confirmado',
      })
      setProcessing(false)
      navigate(`/polizas/${policy.id}`)
    }, 1200)
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Cobertura' },
        ]}
        title="Activación de Cobertura"
        subtitle="Selecciona la modalidad que mejor se adapte a tus necesidades para proteger tu vehículo hoy mismo."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Toggle */}
          <div className="card p-1 flex w-full sm:max-w-md">
            <button
              onClick={() => setModalidad('dias')}
              className={clsx(
                'flex-1 py-2.5 px-3 rounded-lg text-label-md transition',
                modalidad === 'dias'
                  ? 'bg-gradient-brand-soft text-on-primary shadow-elev-primary'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              Por Días
            </button>
            <button
              onClick={() => setModalidad('saldo')}
              className={clsx(
                'flex-1 py-2.5 px-3 rounded-lg text-label-md transition',
                modalidad === 'saldo'
                  ? 'bg-gradient-brand-soft text-on-primary shadow-elev-primary'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              Por Saldo
            </button>
          </div>

          {/* Vehicle selector */}
          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-3">
              Vehículo a proteger
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-outline-variant/60 hover:border-primary/50',
                    )}
                  >
                    <div className="aspect-[16/10] sm:aspect-[16/9] relative bg-surface-container">
                      {v && (
                        <img
                          src={v.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      {active && (
                        <div className="absolute top-1 right-1 w-7 h-7 rounded-full bg-gradient-accent text-white flex items-center justify-center">
                          <Icon name="check" filled />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
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
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plans.map((p) => {
              const active = planId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPlanId(p.id)}
                  className={clsx(
                    'card p-4 sm:p-5 text-left relative overflow-hidden transition active:scale-[0.99]',
                    active
                      ? 'border-2 border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/40 hover:-translate-y-0.5',
                  )}
                >
                  {p.recomendado && (
                    <span className="absolute top-0 right-0 bg-gradient-accent text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-bl-xl font-bold">
                      Recomendado
                    </span>
                  )}
                  <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center mb-3">
                    <Icon name={p.icon} className="text-[24px]" filled />
                  </div>
                  <h3 className="text-headline-md text-primary mb-1 truncate">
                    {p.nombre}
                  </h3>
                  <p className="text-caption sm:text-body-md text-on-surface-variant mb-3 line-clamp-3">
                    {p.descripcion}
                  </p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-headline-lg font-bold text-on-surface">
                      ${p.precioDia}
                    </span>
                    <span className="text-body-md text-outline">/ día</span>
                  </div>
                  <ul className="space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-caption sm:text-body-md text-on-surface-variant">
                        <Icon name="check" className="text-accent-500 text-[16px] shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {active && (
                    <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-gradient-accent text-white flex items-center justify-center">
                      <Icon name="check" className="text-[16px]" filled />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="card p-4 sm:p-5 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1 w-full">
              <label className="label">Días de cobertura</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {[1, 3, 7, 15, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-caption font-bold border transition',
                      days === d
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary',
                    )}
                  >
                    {d} {d === 1 ? 'día' : 'días'}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Math.max(1, +e.target.value))}
                className="input"
                min={1}
                max={365}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="label">Inicio</label>
              <input className="input" type="date" defaultValue={startDate} readOnly />
            </div>
            <div className="flex-1 w-full">
              <label className="label">Fin estimado</label>
              <input className="input" type="date" value={endDate} readOnly />
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="card-elev2 overflow-hidden lg:sticky lg:top-24">
            <div className="bg-gradient-brand-soft text-on-primary p-4 sm:p-5 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-accent-500/30 rounded-full blur-3xl" />
              <div className="relative">
                <h3 className="text-headline-md mb-1">Resumen de Activación</h3>
                <p className="text-body-md opacity-80">
                  Revisa los detalles antes de confirmar.
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5 flex flex-col gap-3">
              {vehicle && (
                <img
                  src={vehicle.image}
                  alt=""
                  className="w-full aspect-[16/9] object-cover rounded-xl"
                />
              )}
              <Row label="Vehículo" value={`${vehicle?.marca} ${vehicle?.modelo}`} />
              <Row label="Modalidad" value={modalidad === 'dias' ? 'Por Días' : 'Por Saldo'} />
              <Row label="Plan seleccionado" value={plan?.nombre} highlight />
              <Row label="Duración" value={`${days} ${days === 1 ? 'día' : 'días'}`} />
              <Row label="Precio diario" value={`$${plan?.precioDia}`} />
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/60">
                <span className="text-headline-md text-on-surface">Total</span>
                <span className="text-display-lg text-primary font-bold">
                  ${total}
                </span>
              </div>
              <button
                onClick={activate}
                disabled={processing}
                className="btn-accent text-body-lg py-3"
              >
                {processing ? (
                  <>
                    <Icon name="progress_activity" className="animate-spin" /> Procesando…
                  </>
                ) : (
                  <>
                    <Icon name="bolt" filled /> Activar Cobertura
                  </>
                )}
              </button>
              <p className="text-center text-caption text-on-surface-variant">
                Al activar, aceptas los términos y condiciones de La Mundial.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2 last:border-0 gap-2">
      <span className="text-body-md text-on-surface-variant">{label}</span>
      <span
        className={clsx(
          'text-on-surface text-right truncate',
          highlight ? 'text-primary font-bold' : 'text-label-md',
        )}
      >
        {value}
      </span>
    </div>
  )
}
