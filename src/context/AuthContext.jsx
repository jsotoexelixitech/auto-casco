import { createContext, useContext, useEffect, useState } from 'react'
import { DEMO_USERS } from '../data/mockData'
import * as api from '../services/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'lm_auto_casco_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })

  // Probe backend once at app start (silently) and restore JWT session if backend is up
  useEffect(() => {
    api.probeBackend().then((available) => {
      if (!available) return // mock-only mode, nothing to restore
      const token = api.getToken()
      if (token && !user) {
        api.auth.me().then((u) => {
          const mapped = mapApiUser(u)
          setUser(mapped)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
        }).catch((err) => {
          // Token inválido o vencido — limpiar sesión completamente
          api.clearToken()
          if (err?.status === 401) {
            localStorage.removeItem(STORAGE_KEY)
            setUser(null)
          }
        })
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  /**
   * Login — tries real API first, falls back to mock demo users.
   * @param {string} emailOrId - email (real API) or user ID (mock fallback)
   * @param {string} [password]
   */
  const login = async (emailOrId, password) => {
    // Try real backend only if it's available (cached probe)
    const backendUp = api.getBackendAvailability() ?? (await api.probeBackend())

    if (backendUp && password) {
      try {
        const res = await api.auth.login(emailOrId, password)
        api.setToken(res.accessToken)
        const mapped = mapApiUser(res.user)
        setUser(mapped)
        return mapped
      } catch (err) {
        // If it's a 401/400 (real auth error), re-throw so LoginPage can show it
        if (err?.status === 401 || err?.status === 400) throw err
        // Backend was up but call failed (network blip) → silent fallback to mock
      }
    }

    // Mock fallback — match by email or id
    const u =
      DEMO_USERS.find((x) => x.email === emailOrId || x.id === emailOrId) ??
      DEMO_USERS[0]
    setUser(u)
    return u
  }

  const logout = () => {
    api.clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, users: DEMO_USERS, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function mapApiUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title ?? roleLabel(u.role),
    avatar: u.avatar ?? u.name?.slice(0, 2).toUpperCase(),
    color: u.color ?? '#0F1A5A',
    phone: u.phone,
    documento: u.documento,
  }
}

function roleLabel(role) {
  const map = {
    asegurado: 'Asegurado',
    intermediario: 'Intermediario',
  }
  return map[role] ?? role
}
