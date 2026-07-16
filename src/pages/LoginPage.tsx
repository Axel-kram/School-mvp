import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../lib/supabase'
import { SchoolSelect } from '../components/SchoolSelect'

type Mode = 'login' | 'signup'

export function LoginPage() {
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [schoolId, setSchoolId] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function resetMessages() {
    setError(null)
    setInfo(null)
  }

  function switchMode(next: Mode) {
    resetMessages()
    setMode(next)
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    resetMessages()

    if (!email || !password) {
      setError('Fyll i både e-post och lösenord.')
      return
    }

    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)

    if (error) setError(error)
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    resetMessages()

    if (!email || !password || !confirmPassword) {
      setError('Fyll i alla fält.')
      return
    }
    if (!username.trim()) {
      setError('Fyll i ett användarnamn.')
      return
    }
    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken.')
      return
    }
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.')
      return
    }
    if (!schoolId) {
      setError('Välj din skola innan du skapar kontot.')
      return
    }

    setSubmitting(true)
    const { error } = await signUp({ email, password, role, schoolId, username })
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }

    setInfo('Kontot är skapat! Kontrollera din e-post om du behöver bekräfta adressen innan du kan logga in.')
    setMode('login')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark" aria-hidden="true" />
          <span className="auth-brand-name">SkolAI</span>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={'auth-tab' + (mode === 'login' ? ' auth-tab-active' : '')}
            onClick={() => switchMode('login')}
          >
            Logga in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={'auth-tab' + (mode === 'signup' ? ' auth-tab-active' : '')}
            onClick={() => switchMode('signup')}
          >
            Skapa konto
          </button>
        </div>

        {info && <p className="auth-info">{info}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="login-email">
                E-post
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="login-password">
                Lösenord
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Loggar in…' : 'Logga in'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="signup-username">
                Användarnamn
              </label>
              <input
                id="signup-username"
                type="text"
                autoComplete="nickname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="signup-email">
                E-post
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field-label" htmlFor="signup-password">
                  Lösenord
                </label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="signup-confirm">
                  Bekräfta lösenord
                </label>
                <input
                  id="signup-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="field">
              <span className="field-label">Jag är…</span>
              <div className="role-toggle" role="radiogroup" aria-label="Välj roll">
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'student'}
                  className={'role-option' + (role === 'student' ? ' role-option-active' : '')}
                  onClick={() => setRole('student')}
                >
                  Elev
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'teacher'}
                  className={'role-option' + (role === 'teacher' ? ' role-option-active' : '')}
                  onClick={() => setRole('teacher')}
                >
                  Lärare
                </button>
              </div>
            </div>

            <div className="field">
              <SchoolSelect value={schoolId} onChange={setSchoolId} />
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Skapar konto…' : 'Skapa konto'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
