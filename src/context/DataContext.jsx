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
import {
  normalizePolicies,
  normalizePagos,
  normalizePago,
  normalizeMethods,
  normalizeMethod,
} from '../utils/dataNormalizers'
import { ensureVehicleForInspection } from '../utils/persistInspection'

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

    // Validate token before firing all requests — avoids 401 spam in console
    try {
      await api.auth.me()
    } catch (err) {
      if (err?.status === 401) {
        // Token expired/invalid — clearToken already called in api.js request()
        console.info('[DataContext] Sesión vencida — modo demo activo.')
        return
      }
    }

    try {
      const [apiPolicies, apiSiniestros, apiPagos, apiMethods, apiPlans, apiVehicles, apiInspections] =
        await Promise.allSettled([
          api.policies.list(),
          api.siniestros.list(),
          api.payments.list(),
          api.payments.methods(),
          api.plans.list(),
          api.vehicles.list(),
          api.inspections.list(),
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

      if (apiVehicles.status === 'fulfilled' && apiVehicles.value?.length) {
        setVehicles((prev) => {
          const remote = apiVehicles.value.map((v) => ({ ...v, dbId: v.id }))
          const remotePlacas = new Set(remote.map((v) => String(v.placa || '').toUpperCase()))
          const keepLocal = prev.filter((v) => !remotePlacas.has(String(v.placa || '').toUpperCase()))
          return [...remote, ...keepLocal]
        })
      }

      if (apiInspections.status === 'fulfilled' && apiInspections.value?.length) {
        setInspections((prev) => {
          const remote = apiInspections.value.map((i) => {
            let meta = {}
            try {
              meta = typeof i.observaciones === 'string' ? JSON.parse(i.observaciones) : {}
            } catch { /* texto libre */ }
            const numero = i.numero || i.legacyId || i.id
            return {
              ...i,
              dbId: i.id,
              id: numero,
              numero,
              estado: i.estado,
              inspectionNumber: numero,
              policyNumber: meta.policyNumber || null,
              cnrecibo: meta.cnrecibo || null,
              urlpoliza: meta.urlpoliza || null,
              planRecomendado: meta.planRecomendado || null,
              titular: meta.titular || null,
              vehiculo: i.vehicle
                ? { placa: i.vehicle.placa, marca: i.vehicle.marca, modelo: i.vehicle.modelo }
                : null,
            }
          })
          const remoteNums = new Set(remote.map((i) => i.numero))
          const keepLocal = prev.filter((i) => !remoteNums.has(i.numero) && !remoteNums.has(i.id))
          return [...remote, ...keepLocal]
        })
      }

      setApiReady(true)
    } catch (err) {
      console.warn('[DataContext] API load failed, using mock data', err)
    }
  }, [])

  useEffect(() => { loadFromApi() }, [loadFromApi])

  /* ── Helpers ──────────────────────────────────────────────────────── */
  const helpers = useMemo(() => ({
    getVehicle: (id) => vehicles.find((v) => v.id === id || v.dbId === id),
    getPolicy: (id) =>
      policies.find((p) => p.id === id || p.numero === id || p.dbId === id || p.legacyId === id),
    getInspection: (id) =>
      inspections.find((i) => i.id === id || i.numero === id || i.dbId === id),
    getSiniestro: (id) => siniestros.find((s) => s.id === id),
    getPolicyByVehicle: (vehicleId) => policies.find((p) => p.vehicleId === vehicleId),

    /* Inspections — local + API vía upsertInspectionRecord / persistInspection */
    addInspection: (inspection) => {
      setInspections((prev) => {
        const id = inspection.id || inspection.numero
        const without = prev.filter((i) => i.id !== id && i.numero !== id)
        return [inspection, ...without]
      })
      return inspection
    },
    updateInspection: (id, patch) => {
      setInspections((prev) =>
        prev.map((i) => (i.id === id || i.numero === id || i.dbId === id ? { ...i, ...patch } : i)),
      )
    },
    setVehicles: (updater) => setVehicles(updater),

    /* Policies — siempre intenta BD (crea vehículo por placa si hace falta) */
    addPolicy: async (policy) => {
      if (!getToken()) {
        setPolicies((prev) => [policy, ...prev.filter((p) => p.id !== policy.id && p.numero !== policy.numero)])
        return { ...policy, persisted: false, error: 'Sin sesión' }
      }
      try {
        const vehicleId = await ensureVehicleForInspection(
          { placa: policy.placa, ...(policy.vehiculo || {}) },
          { vehicles, setVehicles },
        )
        const created = await api.policies.create({
          vehicleId,
          numero: policy.numero || policy.id,
          planNombre: policy.plan ?? 'Estándar',
          modalidad: 'dias',
          diasContratados: policy.diasContratados ?? 365,
          prima: policy.prima ?? 0,
          coberturas: policy.coberturas ?? [],
          urlPoliza: policy.urlpoliza || policy.urlPoliza || undefined,
          cnRecibo: policy.cnrecibo || policy.cnRecibo || undefined,
        })
        const normalized = {
          ...normalizePolicies([created])[0],
          persisted: true,
          urlpoliza: created.urlPoliza || created.urlpoliza || policy.urlpoliza,
          cnrecibo: created.cnRecibo || created.cnrecibo || policy.cnrecibo,
        }
        setPolicies((prev) => [normalized, ...prev.filter((p) => p.numero !== normalized.numero)])
        return normalized
      } catch (err) {
        console.warn('[DataContext] addPolicy API failed', err)
        const local = { ...policy, persisted: false, error: err?.message }
        setPolicies((prev) => [local, ...prev.filter((p) => p.id !== policy.id && p.numero !== policy.numero)])
        return local
      }
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

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}

