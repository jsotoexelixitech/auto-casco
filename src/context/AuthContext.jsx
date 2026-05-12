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

  // Restore session from JWT token on app reload
  useEffect(() => {
    const token = api.getToken()
    if (token && !user) {
      api.auth.me().then((u) => {
        const mapped = mapApiUser(u)
        setUser(mapped)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
      }).catch(() => {
        api.clearToken()
      })
    }
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
    // Try real backend first
    if (password) {
      try {
        const res = await api.auth.login(emailOrId, password)
        api.setToken(res.accessToken)
        const mapped = mapApiUser(res.user)
        setUser(mapped)
        return mapped
      } catch (err) {
        // If it's a 401, re-throw so LoginPage can show the error
        if (err?.status === 401 || err?.status === 400) throw err
        // Otherwise backend unavailable → fall through to mock
        console.warn('[Auth] Backend unavailable, using mock login')
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

export const useAuth = () => {
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
    admin: 'Administrador',
    perito: 'Perito',
    asegurado: 'Asegurado',
    intermediario: 'Intermediario',
  }
  return map[role] ?? role
}
