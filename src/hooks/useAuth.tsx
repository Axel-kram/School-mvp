import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Role } from '../lib/supabase'

interface SignUpParams {
  email: string
  password: string
  role: Role
  schoolId: string
  username: string
}

interface AuthResult {
  error: string | null
}

interface AuthContextValue {
  user: User | null
  role: Role | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (params: SignUpParams) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      setRole((sessionUser?.user_metadata?.role as Role) ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      setRole((sessionUser?.user_metadata?.role as Role) ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: mapAuthError(error.message) }
    return { error: null }
  }

  // Profilen skapas av databastriggern on_auth_user_created, i samma ogonblick
  // som kontot. Ingen manuell insert har - den orsakade kapplopningen dar vyn
  // hann fraga efter profilen innan den fanns.
  async function signUp({ email, password, role, schoolId, username }: SignUpParams): Promise<AuthResult> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          school_id: schoolId,
          username: username.trim(),
        },
      },
    })
    if (error) return { error: mapAuthError(error.message) }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth maste anvandas inom en <AuthProvider>')
  return ctx
}

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Fel e-post eller losenord.'
  }
  if (message.includes('User already registered')) {
    return 'Det finns redan ett konto med den har e-postadressen.'
  }
  if (message.toLowerCase().includes('password should be at least')) {
    return 'Losenordet maste vara minst 8 tecken.'
  }
  if (message.toLowerCase().includes('email not confirmed')) {
    return 'E-postadressen ar inte bekraftad an. Kolla din inkorg.'
  }
  if (message.toLowerCase().includes('database error')) {
    return 'Kontot kunde inte skapas just nu. Forsok igen om en stund.'
  }
  return message
}
