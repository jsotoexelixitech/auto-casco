import { useState } from 'react'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Icon from '../components/ui/Icon'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'

const METHOD_TYPES = [
  { v: 'card', label: 'Tarjeta', icon: 'credit_card' },
  { v: 'transfer', label: 'Transferencia', icon: 'account_balance' },
  { v: 'pago-movil', label: 'Pago Móvil', icon: 'smartphone' },
]

export default function PaymentsPage() {
  const {
    pagos,
    addPago,
    addActivity,
    paymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setPrimaryPaymentMethod,
  } = useData()
  const toast = useToast()
  const [topupAmount, setTopupAmount] = useState(50)
  const [processing, setProcessing] = useState(false)
  const [methodOpen, setMethodOpen] = useState(false)
  const [savingMethod, setSavingMethod] = useState(false)
  const [methodDraft, setMethodDraft] = useState({
    type: 'card',
    cardNumber: '',
    cardName: '',
    cardExp: '',
    cardCvv: '',
    bank: 'Banco Mercantil',
    accountNumber: '',
    phone: '',
  })

  const totalIn = pagos.filter((p) => p.monto > 0).reduce((a, p) => a + p.monto, 0)
  const totalOut = pagos
    .filter((p) => p.monto < 0)
    .reduce((a, p) => a + Math.abs(p.monto), 0)

  const topup = () => {
    setProcessing(true)
    setTimeout(() => {
      const primary = paymentMethods.find((m) => m.primary) ?? paymentMethods[0]
      addPago({
        fecha: new Date().toISOString().slice(0, 10),
        concepto: 'Recarga de saldo',
        metodo: primary?.label ?? 'Tarjeta',
        monto: Number(topupAmount),
        estado: 'Completado',
      })
      addActivity({
        type: 'topup',
        title: 'Recarga de Saldo',
        subtitle: primary?.label ?? 'Tarjeta',
        when: 'Hace un momento',
        icon: 'account_balance_wallet',
        tone: 'accent',
        amount: Number(topupAmount),
      })
      toast.success(`Saldo recargado: $${topupAmount}`, { title: '¡Listo!' })
      setProcessing(false)
    }, 900)
  }

  const saveMethod = () => {
    const t = methodDraft.type
    if (t === 'card') {
      const last4 = methodDraft.cardNumber.replace(/\D/g, '').slice(-4)
      if (
        methodDraft.cardNumber.replace(/\s/g, '').length < 13 ||
        !methodDraft.cardName ||
        !methodDraft.cardExp
      ) {
        toast.error('Completa el número, titular y vencimiento de la tarjeta.')
        return
      }
      setSavingMethod(true)
      setTimeout(() => {
        addPaymentMethod({
          type: 'card',
          icon: 'credit_card',
          label: `Tarjeta **** ${last4 || '0000'}`,
          sub: `${detectBrand(methodDraft.cardNumber)} · Vence ${methodDraft.cardExp}`,
        })
        toast.success('Tarjeta agregada correctamente', {
          title: 'Método de pago',
        })
        setSavingMethod(false)
        setMethodOpen(false)
        setMethodDraft({ ...methodDraft, cardNumber: '', cardName: '', cardExp: '', cardCvv: '' })
      }, 900)
    } else if (t === 'transfer') {
      if (!methodDraft.accountNumber) {
        toast.error('Indica el número de cuenta.')
        return
      }
      setSavingMethod(true)
      setTimeout(() => {
        addPaymentMethod({
          type: 'transfer',
          icon: 'account_balance',
          label: 'Transferencia',
          sub: `${methodDraft.bank} · ${methodDraft.accountNumber.slice(-6).padStart(8, '*')}`,
        })
        toast.success('Cuenta bancaria agregada')
        setSavingMethod(false)
        setMethodOpen(false)
        setMethodDraft({ ...methodDraft, accountNumber: '' })
      }, 900)
    } else {
      if (!methodDraft.phone) {
        toast.error('Indica el número de teléfono.')
        return
      }
      setSavingMethod(true)
      setTimeout(() => {
        addPaymentMethod({
          type: 'pago-movil',
          icon: 'smartphone',
          label: 'Pago Móvil',
          sub: `${methodDraft.bank} · ${methodDraft.phone}`,
        })
        toast.success('Pago Móvil agregado')
        setSavingMethod(false)
        setMethodOpen(false)
        setMethodDraft({ ...methodDraft, phone: '' })
      }, 900)
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Pagos' }]}
        title="Pagos y Saldo"
        subtitle="Recarga tu saldo y revisa todo el historial de movimientos."
      />

      <section className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <StatCard icon="payments" label="Movimientos" value={pagos.length} tone="primary" />
        <StatCard icon="trending_up" label="Ingresos" value={`$${totalIn.toFixed(0)}`} tone="success" />
        <StatCard icon="trending_down" label="Egresos" value={`$${totalOut.toFixed(0)}`} tone="accent" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <aside className="lg:order-2 flex flex-col gap-4">
          <div className="card-elev2 p-4 sm:p-5 bg-gradient-brand-soft text-on-primary relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent-500/30 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="account_balance_wallet" filled className="text-accent-300" />
                <h3 className="text-headline-md">Recargar saldo</h3>
              </div>
              <p className="opacity-80 mb-3 text-body-md">
                Añade fondos para activar coberturas instantáneamente.
              </p>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[20, 50, 100, 200].map((a) => (
                  <button
                    key={a}
                    onClick={() => setTopupAmount(a)}
                    className={`min-h-[44px] rounded-lg text-label-md font-bold transition active:scale-95 ${
                      topupAmount === a
                        ? 'bg-gradient-accent text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(Math.max(1, +e.target.value))}
                className="input bg-white/95 mb-3"
              />
              <button onClick={topup} disabled={processing} className="btn-accent w-full">
                {processing ? (
                  <>
                    <Icon name="progress_activity" className="animate-spin" /> Procesando…
                  </>
                ) : (
                  <>
                    <Icon name="add_card" /> Recargar ${topupAmount}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h4 className="text-headline-md">Métodos de pago</h4>
              <span className="text-caption text-on-surface-variant">
                {paymentMethods.length}
              </span>
            </div>
            <div className="space-y-2">
              {paymentMethods.map((m) => (
                <Method
                  key={m.id}
                  m={m}
                  onSetPrimary={() => {
                    setPrimaryPaymentMethod(m.id)
                    toast.success('Método principal actualizado')
                  }}
                  onRemove={() => {
                    if (m.primary) {
                      toast.error(
                        'No puedes eliminar tu método principal. Marca otro como principal primero.',
                      )
                      return
                    }
                    removePaymentMethod(m.id)
                    toast.success('Método de pago eliminado')
                  }}
                />
              ))}
              {!methodOpen && (
                <button
                  onClick={() => setMethodOpen(true)}
                  className="btn-soft w-full mt-2"
                >
                  <Icon name="add" /> Agregar método
                </button>
              )}
            </div>
          </div>

          {/* Inline "Agregar método de pago" — no modal */}
          {methodOpen && (
            <div className="card p-4 sm:p-5 border-2 border-primary/30 bg-primary-fixed/10 animate-slide-up">
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <Icon name="add_card" className="text-primary text-[22px]" filled />
                  <div>
                    <h4 className="text-headline-md text-on-surface">Nuevo método de pago</h4>
                    <p className="text-caption text-on-surface-variant">
                      Tus datos se cifran y guardan de forma segura.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMethodOpen(false)}
                  className="btn-icon"
                  aria-label="Cerrar"
                >
                  <Icon name="close" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {METHOD_TYPES.map((t) => (
                  <button
                    key={t.v}
                    onClick={() => setMethodDraft({ ...methodDraft, type: t.v })}
                    className={clsx(
                      'p-3 min-h-[56px] rounded-xl border-2 transition flex flex-col items-center gap-1 active:scale-95',
                      methodDraft.type === t.v
                        ? 'border-primary bg-primary-fixed/40 ring-2 ring-primary/20 text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary/40',
                    )}
                  >
                    <Icon name={t.icon} className="text-[22px]" filled />
                    <span className="text-caption font-bold">{t.label}</span>
                  </button>
                ))}
              </div>

              {methodDraft.type === 'card' && (
                <CardForm draft={methodDraft} setDraft={setMethodDraft} />
              )}
              {methodDraft.type === 'transfer' && (
                <TransferForm draft={methodDraft} setDraft={setMethodDraft} />
              )}
              {methodDraft.type === 'pago-movil' && (
                <PagoMovilForm draft={methodDraft} setDraft={setMethodDraft} />
              )}

              <div className="flex gap-2 mt-4 pt-3 border-t border-outline-variant/40">
                <button
                  onClick={() => setMethodOpen(false)}
                  className="btn-soft flex-1"
                  disabled={savingMethod}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveMethod}
                  className="btn-primary flex-1"
                  disabled={savingMethod}
                >
                  {savingMethod ? (
                    <>
                      <Icon name="progress_activity" className="animate-spin" /> Guardando…
                    </>
                  ) : (
                    <>
                      <Icon name="lock" /> Guardar método
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </aside>

        <div className="lg:col-span-2 lg:order-1 card overflow-hidden">
          <div className="p-4 border-b border-outline-variant/40">
            <h3 className="text-headline-md text-on-surface">
              Historial de movimientos
            </h3>
          </div>

          <div className="md:hidden flex flex-col divide-y divide-outline-variant/40">
            {pagos.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    p.monto > 0
                      ? 'bg-success-container text-on-success-container'
                      : 'bg-primary-fixed text-primary',
                  )}
                >
                  <Icon name={p.monto > 0 ? 'arrow_downward' : 'arrow_upward'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-md text-on-surface truncate">{p.concepto}</p>
                  <p className="text-caption text-on-surface-variant truncate">
                    {p.fecha} · {p.metodo}
                  </p>
                </div>
                <span
                  className={clsx(
                    'text-label-md font-bold whitespace-nowrap',
                    p.monto > 0 ? 'text-success' : 'text-on-surface',
                  )}
                >
                  {p.monto > 0 ? '+' : '-'}${Math.abs(p.monto).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <table className="w-full hidden md:table">
            <thead className="bg-surface-container-low">
              <tr className="text-left text-caption uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-outline-variant/40 hover:bg-surface-container-low transition"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-label-md text-on-surface">{p.fecha}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-body-md text-on-surface">{p.concepto}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip bg-surface-container text-on-surface-variant">
                      {p.metodo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={clsx(
                        'text-label-md font-bold',
                        p.monto > 0 ? 'text-success' : 'text-on-surface',
                      )}
                    >
                      {p.monto > 0 ? '+' : ''}
                      ${Math.abs(p.monto).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </>
  )
}

function Method({ m, onSetPrimary, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/50 bg-surface-container-low/40">
      <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
        <Icon name={m.icon} filled />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-label-md font-bold truncate">{m.label}</p>
          {m.primary && (
            <span className="chip bg-success-container text-on-success-container shrink-0">
              Principal
            </span>
          )}
        </div>
        <p className="text-caption text-on-surface-variant truncate">{m.sub}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!m.primary && (
          <button
            onClick={onSetPrimary}
            className="btn-icon"
            aria-label="Marcar como principal"
            title="Marcar como principal"
          >
            <Icon name="star_border" className="text-[20px]" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="btn-icon"
          aria-label="Eliminar"
        >
          <Icon name="delete" className="text-[20px]" />
        </button>
      </div>
    </div>
  )
}

function CardForm({ draft, setDraft }) {
  const formatCard = (v) =>
    v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim()
  const formatExp = (v) =>
    v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2')
  const last4 = draft.cardNumber.replace(/\D/g, '').slice(-4)
  const brand = detectBrand(draft.cardNumber)

  return (
    <div className="space-y-3">
      {/* Card preview */}
      <div className="rounded-2xl p-5 bg-gradient-brand text-on-primary aspect-[1.6/1] flex flex-col justify-between relative overflow-hidden shadow-elev-primary">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-4 right-4 text-xl font-bold opacity-70 italic">
          {brand}
        </div>
        <div className="flex items-center gap-2 relative">
          <Icon name="credit_card" className="text-accent-300 text-[28px]" filled />
          <span className="font-bold tracking-wider">La Mundial</span>
        </div>
        <div className="relative">
          <p className="font-mono text-body-lg tracking-widest mb-2 truncate">
            {draft.cardNumber || '#### #### #### ####'}
          </p>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] opacity-70 uppercase tracking-wider">Titular</p>
              <p className="font-bold truncate uppercase">
                {draft.cardName || 'TU NOMBRE'}
              </p>
            </div>
            <div>
              <p className="text-[10px] opacity-70 uppercase tracking-wider">Vence</p>
              <p className="font-bold">{draft.cardExp || '••/••'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Número de tarjeta</label>
          <input
            inputMode="numeric"
            className="input font-mono tracking-widest"
            placeholder="0000 0000 0000 0000"
            value={draft.cardNumber}
            onChange={(e) =>
              setDraft({ ...draft, cardNumber: formatCard(e.target.value) })
            }
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Titular (como aparece en la tarjeta)</label>
          <input
            className="input uppercase"
            placeholder="JUAN PEREZ"
            value={draft.cardName}
            onChange={(e) =>
              setDraft({ ...draft, cardName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="label">Vencimiento</label>
          <input
            inputMode="numeric"
            className="input"
            placeholder="MM/AA"
            value={draft.cardExp}
            onChange={(e) =>
              setDraft({ ...draft, cardExp: formatExp(e.target.value) })
            }
          />
        </div>
        <div>
          <label className="label">CVV</label>
          <input
            inputMode="numeric"
            type="password"
            className="input"
            placeholder="123"
            maxLength={4}
            value={draft.cardCvv}
            onChange={(e) =>
              setDraft({ ...draft, cardCvv: e.target.value.replace(/\D/g, '') })
            }
          />
        </div>
      </div>
      {last4 && (
        <p className="text-caption text-on-surface-variant flex items-center gap-1">
          <Icon name="lock" className="text-success text-[14px]" filled /> Cifrado AES-256 · 3D Secure
        </p>
      )}
    </div>
  )
}

function TransferForm({ draft, setDraft }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="label">Banco</label>
        <select
          className="input"
          value={draft.bank}
          onChange={(e) => setDraft({ ...draft, bank: e.target.value })}
        >
          <option>Banco Mercantil</option>
          <option>Banesco</option>
          <option>Banco de Venezuela</option>
          <option>BBVA Provincial</option>
          <option>Bancaribe</option>
        </select>
      </div>
      <div>
        <label className="label">Tipo de cuenta</label>
        <select className="input" defaultValue="ahorro">
          <option value="ahorro">Cuenta de Ahorro</option>
          <option value="corriente">Cuenta Corriente</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Número de cuenta (20 dígitos)</label>
        <input
          inputMode="numeric"
          className="input font-mono"
          placeholder="0000 0000 00 0000000000"
          value={draft.accountNumber}
          onChange={(e) =>
            setDraft({
              ...draft,
              accountNumber: e.target.value.replace(/\D/g, '').slice(0, 20),
            })
          }
        />
      </div>
    </div>
  )
}

function PagoMovilForm({ draft, setDraft }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="label">Banco</label>
        <select
          className="input"
          value={draft.bank}
          onChange={(e) => setDraft({ ...draft, bank: e.target.value })}
        >
          <option>Banco Mercantil</option>
          <option>Banesco</option>
          <option>Banco de Venezuela</option>
          <option>BBVA Provincial</option>
        </select>
      </div>
      <div>
        <label className="label">Teléfono móvil</label>
        <input
          inputMode="tel"
          className="input"
          placeholder="(0414) 000-0000"
          value={draft.phone}
          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
        />
      </div>
    </div>
  )
}

function detectBrand(num) {
  const s = (num || '').replace(/\D/g, '')
  if (/^4/.test(s)) return 'Visa'
  if (/^5[1-5]/.test(s) || /^2[2-7]/.test(s)) return 'Mastercard'
  if (/^3[47]/.test(s)) return 'AmEx'
  if (/^6/.test(s)) return 'Discover'
  return ''
}
