/**
 * DataContext — Hybrid: loads live data from the API when available,
 * gracefully falls back to mock data for offline / demo use.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
import * as api from '../services/api'
import { getToken } from '../services/api'

const DataContext = createContext(null)

const MOCK_PAYMENT_METHODS = [
  { id: 'pm-1', type: 'card', label: 'Tarjeta **** 1234', sub: 'Visa · Vence 12/27', icon: 'credit_card', isPrimary: true, primary: true },
  { id: 'pm-2', type: 'transfer', label: 'Transferencia', sub: 'Banco Mercantil · 0105...', icon: 'account_balance', isPrimary: false, primary: false },
]

export function DataProvider({ children }) {
  /* ── State ────────────────────────────────────────────────────────── */
  const [policies, setPolicies] = useState(POLICIES)
  const [siniestros, setSiniestros] = useState(SINIESTROS)
  const [pagos, setPagos] = useState(PAGOS)
  const [paymentMethods, setPaymentMethods] = useState(MOCK_PAYMENT_METHODS)
  const [plans, setPlans] = useState(PLANS)
  // These remain mock (complex data with images, wizard state etc.)
  const [inspections, setInspections] = useState(INSPECTIONS)
  const [vehicles, setVehicles] = useState(VEHICLES)
  const [activities, setActivities] = useState(ACTIVITY_FEED)
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const [apiReady, setApiReady] = useState(false)

  /* ── Initial load from API ────────────────────────────────────────── */
  const loadFromApi = useCallback(async () => {
    if (!getToken()) return          // Not logged in — use mock

    // Skip API entirely if backend is known to be down
    const backendUp = api.getBackendAvailability() ?? (await api.probeBackend())
    if (!backendUp) return

    try {
      const [apiPolicies, apiSiniestros, apiPagos, apiMethods, apiPlans] =
        await Promise.allSettled([
          api.policies.list(),
          api.siniestros.list(),
          api.payments.list(),
          api.payments.methods(),
          api.plans.list(),
        ])

      if (apiPolicies.status === 'fulfilled' && apiPolicies.value?.length)
        setPolicies(normalizePolicies(apiPolicies.value))

      if (apiSiniestros.status === 'fulfilled' && apiSiniestros.value?.length)
        setSiniestros(apiSiniestros.value)

      if (apiPagos.status === 'fulfilled' && apiPagos.value?.length)
        setPagos(normalizePagos(apiPagos.value))

      if (apiMethods.status === 'fulfilled' && apiMethods.value?.length)
        setPaymentMethods(normalizeMethods(apiMethods.value))

      if (apiPlans.status === 'fulfilled' && apiPlans.value?.length)
        setPlans(apiPlans.value)

      setApiReady(true)
    } catch (err) {
      console.warn('[DataContext] API load failed, using mock data', err)
    }
  }, [])

  useEffect(() => { loadFromApi() }, [loadFromApi])

  /* ── Helpers ──────────────────────────────────────────────────────── */
  const helpers = useMemo(() => ({
    getVehicle: (id) => vehicles.find((v) => v.id === id),
    getPolicy: (id) => policies.find((p) => p.id === id),
    getInspection: (id) => inspections.find((i) => i.id === id),
    getSiniestro: (id) => siniestros.find((s) => s.id === id),
    getPolicyByVehicle: (vehicleId) => policies.find((p) => p.vehicleId === vehicleId),

    /* Inspections (mock only for now) */
    addInspection: (inspection) => setInspections((prev) => [inspection, ...prev]),
    updateInspection: (id, patch) =>
      setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),

    /* Policies */
    addPolicy: async (policy) => {
      if (getToken() && apiReady) {
        try {
          const v = vehicles.find((x) => x.id === policy.vehicleId || x.placa === policy.placa)
          if (v) {
            const created = await api.policies.create({
              vehicleId: v.id,
              planNombre: policy.plan ?? 'Estándar',
              modalidad: 'dias',
              diasContratados: policy.diasContratados ?? 30,
              prima: policy.prima ?? 0,
              coberturas: policy.coberturas ?? [],
            })
            const normalized = normalizePolicies([created])[0]
            setPolicies((prev) => [normalized, ...prev])
            return normalized
          }
        } catch (err) {
          console.warn('[DataContext] addPolicy API failed', err)
        }
      }
      // Fallback: add locally
      setPolicies((prev) => [policy, ...prev])
      return policy
    },

    buyDays: async (policyId, days, total = 0) => {
      const policy = policies.find((p) => p.id === policyId)
      if (getToken() && apiReady && policy?.dbId) {
        try {
          const updated = await api.policies.buyDays(policy.dbId, days, total)
          setPolicies((prev) =>
            prev.map((p) => (p.id === policyId ? { ...p, ...normalizePolicies([updated])[0] } : p)),
          )
          return
        } catch (err) {
          console.warn('[DataContext] buyDays API failed', err)
        }
      }
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === policyId
            ? { ...p, estado: 'Activa', diasRestantes: (p.diasRestantes ?? 0) + days, diasContratados: (p.diasContratados ?? 0) + days }
            : p,
        ),
      )
    },

    /* Siniestros */
    addSiniestro: async (siniestro) => {
      if (getToken() && apiReady) {
        try {
          // Map vehicleId from our mock vehicles if needed
          const v = vehicles.find((x) => x.id === siniestro.vehicleId)
          const created = await api.siniestros.create({
            vehicleId: v?.id ?? siniestro.vehicleId,
            tipo: siniestro.tipo,
            severidad: siniestro.severidad,
            lugar: siniestro.lugar ?? '',
            descripcion: siniestro.descripcion ?? '',
            fecha: siniestro.fecha,
            hora: siniestro.hora,
            heridos: siniestro.heridos ?? false,
            autoridad: siniestro.autoridad ?? false,
          })
          setSiniestros((prev) => [created, ...prev])
          return created
        } catch (err) {
          console.warn('[DataContext] addSiniestro API failed', err)
        }
      }
      const s = { ...siniestro, id: siniestro.id ?? `SIN-${Date.now()}` }
      setSiniestros((prev) => [s, ...prev])
      return s
    },

    updateSiniestro: (id, patch) =>
      setSiniestros((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s))),

    /* Payments */
    addPago: async (pago) => {
      if (getToken() && apiReady) {
        try {
          const created = await api.payments.topup(Math.abs(pago.monto), pago.metodo)
          const normalized = normalizePago(created)
          setPagos((prev) => [normalized, ...prev])
          return normalized
        } catch (err) {
          console.warn('[DataContext] addPago API failed', err)
        }
      }
      const p = { ...pago, id: `PAY-${Date.now()}` }
      setPagos((prev) => [p, ...prev])
      return p
    },

    /* Payment methods */
    addPaymentMethod: async (m) => {
      if (getToken() && apiReady) {
        try {
          const created = await api.payments.addMethod({
            type: m.type,
            label: m.label,
            sub: m.sub,
            icon: m.icon,
            isPrimary: m.primary ?? false,
          })
          const normalized = normalizeMethod(created)
          setPaymentMethods((prev) => [...prev.filter((x) => x.id !== normalized.id), normalized])
          return normalized
        } catch (err) {
          console.warn('[DataContext] addPaymentMethod API failed', err)
        }
      }
      const method = { ...m, id: m.id ?? `pm-${Date.now()}` }
      setPaymentMethods((prev) => [method, ...prev])
      return method
    },

    removePaymentMethod: async (id) => {
      if (getToken() && apiReady) {
        try {
          await api.payments.removeMethod(id)
        } catch (err) {
          console.warn('[DataContext] removePaymentMethod API failed', err)
        }
      }
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id))
    },

    setPrimaryPaymentMethod: async (id) => {
      if (getToken() && apiReady) {
        try {
          await api.payments.setPrimary(id)
        } catch (err) {
          console.warn('[DataContext] setPrimary API failed', err)
        }
      }
      setPaymentMethods((prev) =>
        prev.map((m) => ({ ...m, primary: m.id === id, isPrimary: m.id === id })),
      )
    },

    /* Activity & notifications (local only) */
    addActivity: (activity) =>
      setActivities((prev) => [{ ...activity, id: `act-${Date.now()}` }, ...prev]),
    markNotificationRead: (id) =>
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n))),
    markAllNotificationsRead: () =>
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false }))),

    /* Reload from API */
    reload: loadFromApi,
    apiReady,
  }), [vehicles, policies, inspections, siniestros, apiReady, loadFromApi])

  return (
    <DataContext.Provider
      value={{
        plans,
        vehicles,
        policies,
        inspections,
        siniestros,
        pagos,
        activities,
        notifications,
        paymentMethods,
        apiReady,
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

/* ── Normalizers (API → frontend shape) ──────────────────────────────── */
function normalizePolicies(list) {
  return list.map((p) => ({
    ...p,
    // Keep dbId for API calls, id stays the human-readable numero
    dbId: p.id,
    id: p.numero ?? p.id,
    numero: p.numero ?? p.id,
    plan: p.plan ?? p.planNombre ?? 'Estándar',
    modalidad: p.modalidad === 'dias' ? 'Por Días' : p.modalidad,
    vigenciaDesde: p.vigenciaDesde ?? p.fechaInicio?.slice(0, 10) ?? '',
    vigenciaHasta: p.vigenciaHasta ?? p.fechaFin?.slice(0, 10) ?? '',
    saldo: p.saldo ?? p.saldoDisponible ?? 0,
    coberturas: Array.isArray(p.coberturas) ? p.coberturas : [],
  }))
}

function normalizePagos(list) {
  return list.map((p) => ({
    id: p.id,
    fecha: p.fecha?.slice(0, 10) ?? p.createdAt?.slice(0, 10) ?? '',
    concepto: p.concepto,
    metodo: p.metodo,
    monto: p.monto,
    estado: p.estado,
  }))
}

function normalizePago(p) {
  return {
    id: p.id,
    fecha: p.fecha?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    concepto: p.concepto,
    metodo: p.metodo,
    monto: p.monto,
    estado: p.estado,
  }
}

function normalizeMethods(list) {
  return list.map(normalizeMethod)
}

function normalizeMethod(m) {
  return {
    id: m.id,
    type: m.type,
    label: m.label,
    sub: m.sub,
    icon: m.icon ?? 'credit_card',
    primary: m.isPrimary ?? m.primary ?? false,
    isPrimary: m.isPrimary ?? m.primary ?? false,
  }
}
