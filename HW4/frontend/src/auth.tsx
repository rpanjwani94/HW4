import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchCurrentUser, loginUser, logoutUser } from './api'
import type { User } from './api'

interface AuthValue {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setReady(true))
  }, [])

  const value: AuthValue = {
    user,
    ready,
    login: async (email, password) => setUser(await loginUser(email, password)),
    logout: async () => {
      await logoutUser()
      setUser(null)
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
