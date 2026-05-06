import { createContext, useContext, useEffect, useState } from 'react'
import { DEMO_USERS } from '../data/mockData'

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

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const login = (userId) => {
    const u = DEMO_USERS.find((x) => x.id === userId) ?? DEMO_USERS[0]
    setUser(u)
    return u
  }

  const logout = () => setUser(null)

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
