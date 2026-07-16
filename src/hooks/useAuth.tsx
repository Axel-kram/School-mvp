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

  async function signUp({ email, password, role, schoolId, username }: SignUpParams): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })
    if (error) return { error: mapAuthError(error.message) }

    const newUser = data.user
    if (!newUser) {
      return {
        error: 'Kontot skapades, men kunde inte loggas in direkt. Kontrollera din e-post eller försök logga in manuellt.',
      }
    }

    const table = role === 'teacher' ? 'teacher_profiles' : 'student_profiles'
    const { error: profileError } = await supabase.from(table).insert({
      user_id: newUser.id,
      school_id: schoolId,
      username: username.trim(),
    })

    if (profileError) {
      return { error: 'Kontot skapades, men profilen kunde inte sparas: ' + profileError.message }
    }

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
  if (!ctx) throw new Error('useAuth måste användas inom en <AuthProvider>')
  return ctx
}

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Fel e-post eller lösenord.'
  }
  if (message.includes('User already registered')) {
    return 'Det finns redan ett konto med den här e-postadressen.'
  }
  if (message.toLowerCase().includes('password should be at least')) {
    return 'Lösenordet måste vara minst 8 tecken.'
  }
  if (message.toLowerCase().includes('email not confirmed')) {
    return 'E-postadressen är inte bekräftad än. Kolla din inkorg.'
  }
  return message
}
