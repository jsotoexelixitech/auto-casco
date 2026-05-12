/**
 * Auto Casco — API Client
 * Centralized HTTP client with JWT auth, error handling, and
 * graceful fallback to mock data when the backend is unavailable.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

const TOKEN_KEY = 'ac_token'

/* ── Token helpers ─────────────────────────────────────────────────────── */
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/* ── Backend availability (cached for the session) ─────────────────────── */
let backendAvailable = null

export function getBackendAvailability() {
  return backendAvailable
}

export function setBackendAvailability(v) {
  backendAvailable = v
}

/**
 * Probe backend once. Cached for the session.
 * Uses /health endpoint with a 1.5s timeout.
 */
export async function probeBackend() {
  if (backendAvailable !== null) return backendAvailable
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)
    await fetch(`${BASE_URL.replace('/api', '')}/health`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    backendAvailable = true
  } catch {
    backendAvailable = false
  }
  return backendAvailable
}

/* ── Core request ──────────────────────────────────────────────────────── */
async function request(method, path, body) {
  // Short-circuit if backend is known to be down (avoids console errors)
  if (backendAvailable === false) {
    throw new ApiError(0, 'Backend unavailable')
  }

  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (networkErr) {
    // Network failure (offline, CORS, ERR_CONNECTION_REFUSED, etc.)
    // Mark backend as unavailable so subsequent calls short-circuit cleanly.
    backendAvailable = false
    throw new ApiError(0, 'Backend unavailable')
  }

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `HTTP ${res.status}`
    throw new ApiError(res.status, Array.isArray(msg) ? msg.join('. ') : msg)
  }

  // First successful response confirms the backend is up
  if (backendAvailable !== true) backendAvailable = true

  // NestJS TransformInterceptor wraps data in { success, data, timestamp }
  return json?.data !== undefined ? json.data : json
}

export const get = (path) => request('GET', path)
export const post = (path, body) => request('POST', path, body)
export const patch = (path, body) => request('PATCH', path, body)
export const del = (path) => request('DELETE', path)

/* ── Custom error ──────────────────────────────────────────────────────── */
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

/* ─────────────────────────────────────────────────────────────────────── *
 *  Domain-specific helpers                                                 *
 * ─────────────────────────────────────────────────────────────────────── */

/* Auth */
export const auth = {
  login: (email, password) =>
    post('/auth/login', { email, password }),
  register: (name, email, password, phone, documento) =>
    post('/auth/register', { name, email, password, phone, documento }),
  me: () => get('/auth/me'),
}

/* Policies */
export const policies = {
  list: () => get('/policies'),
  get: (id) => get(`/policies/${id}`),
  create: (data) => post('/policies', data),
  buyDays: (id, days, total) =>
    post(`/policies/${id}/buy-days`, { days, total }),
}

/* Vehicles */
export const vehicles = {
  list: () => get('/vehicles'),
  get: (id) => get(`/vehicles/${id}`),
  create: (data) => post('/vehicles', data),
}

/* Inspections */
export const inspections = {
  list: () => get('/inspections'),
  get: (id) => get(`/inspections/${id}`),
  create: (data) => post('/inspections', data),
}

/* Siniestros */
export const siniestros = {
  list: () => get('/siniestros'),
  get: (id) => get(`/siniestros/${id}`),
  create: (data) => post('/siniestros', data),
}

/* Payments */
export const payments = {
  list: () => get('/payments'),
  topup: (monto, metodo) => post('/payments/topup', { monto, metodo }),
  methods: () => get('/payments/methods'),
  addMethod: (data) => post('/payments/methods', data),
  removeMethod: (id) => del(`/payments/methods/${id}`),
  setPrimary: (id) => patch(`/payments/methods/${id}/primary`),
}

/* Plans */
export const plans = {
  list: () => get('/plans'),
}

/* ── Connectivity check (legacy alias) ─────────────────────────────────── */
export const isBackendAvailable = probeBackend
