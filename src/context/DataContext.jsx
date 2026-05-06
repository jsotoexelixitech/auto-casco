import { createContext, useContext, useMemo, useState } from 'react'
import {
  ACTIVITY_FEED,
  INSPECTIONS,
  NOTIFICATIONS,
  PAGOS,
  PLANS,
  POLICIES,
  SINIESTROS,
  VEHICLES,
} from '../data/mockData'

const DataContext = createContext(null)

const INITIAL_PAYMENT_METHODS = [
  {
    id: 'pm-1',
    type: 'card',
    label: 'Tarjeta **** 1234',
    sub: 'Visa · Vence 12/27',
    icon: 'credit_card',
    primary: true,
  },
  {
    id: 'pm-2',
    type: 'transfer',
    label: 'Transferencia',
    sub: 'Banco Mercantil · 0105...',
    icon: 'account_balance',
  },
]

export function DataProvider({ children }) {
  const [policies, setPolicies] = useState(POLICIES)
  const [inspections, setInspections] = useState(INSPECTIONS)
  const [vehicles, setVehicles] = useState(VEHICLES)
  const [siniestros, setSiniestros] = useState(SINIESTROS)
  const [pagos, setPagos] = useState(PAGOS)
  const [activities, setActivities] = useState(ACTIVITY_FEED)
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const [paymentMethods, setPaymentMethods] = useState(INITIAL_PAYMENT_METHODS)

  const helpers = useMemo(
    () => ({
      getVehicle: (id) => vehicles.find((v) => v.id === id),
      getPolicy: (id) => policies.find((p) => p.id === id),
      getInspection: (id) => inspections.find((i) => i.id === id),
      getSiniestro: (id) => siniestros.find((s) => s.id === id),
      getPolicyByVehicle: (vehicleId) =>
        policies.find((p) => p.vehicleId === vehicleId),
      addInspection: (inspection) =>
        setInspections((prev) => [inspection, ...prev]),
      updateInspection: (id, patch) =>
        setInspections((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        ),
      addPolicy: (policy) => setPolicies((prev) => [policy, ...prev]),
      addActivity: (activity) =>
        setActivities((prev) => [
          { ...activity, id: `act-${Date.now()}` },
          ...prev,
        ]),
      addPago: (pago) =>
        setPagos((prev) => [{ ...pago, id: `PAY-${Date.now()}` }, ...prev]),
      buyDays: (policyId, days /*, total */) => {
        setPolicies((prev) =>
          prev.map((p) =>
            p.id === policyId
              ? {
                  ...p,
                  estado: 'Activa',
                  diasRestantes: (p.diasRestantes ?? 0) + days,
                  diasContratados: (p.diasContratados ?? 0) + days,
                }
              : p,
          ),
        )
      },
      addSiniestro: (siniestro) =>
        setSiniestros((prev) => [
          { ...siniestro, id: siniestro.id ?? `SIN-${Date.now()}` },
          ...prev,
        ]),
      updateSiniestro: (id, patch) =>
        setSiniestros((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        ),
      markNotificationRead: (id) =>
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        ),
      markAllNotificationsRead: () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false }))),
      addPaymentMethod: (m) =>
        setPaymentMethods((prev) => [
          { ...m, id: m.id ?? `pm-${Date.now()}` },
          ...prev,
        ]),
      removePaymentMethod: (id) =>
        setPaymentMethods((prev) => prev.filter((m) => m.id !== id)),
      setPrimaryPaymentMethod: (id) =>
        setPaymentMethods((prev) =>
          prev.map((m) => ({ ...m, primary: m.id === id })),
        ),
    }),
    [vehicles, policies, inspections, siniestros],
  )

  return (
    <DataContext.Provider
      value={{
        plans: PLANS,
        vehicles,
        policies,
        inspections,
        siniestros,
        pagos,
        activities,
        notifications,
        paymentMethods,
        ...helpers,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
