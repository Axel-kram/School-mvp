import React, { useState } from 'react'
import { auth } from '../lib/api'

type Mode = 'login' | 'signup'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    setSuccessMsg(null)

    if (!email.trim()) { setError('Ange din e-postadress.'); return }
    if (password.length < 6) { setError('Lösenordet måste vara minst 6 tecken.'); return }

    setLoading(true)

    if (mode === 'login') {
      const { error } = await auth.signInWithEmail(email.trim(), password)
      if (error) {
        setError(
          error.message.includes('Invalid login')
            ? 'Fel e-post eller lösenord. Försök igen.'
            : 'Inloggningen misslyckades. Försök igen.'
        )
        setLoading(false)
      }
      // Vid lyckad inloggning navigerar AuthProvider automatiskt via onAuthStateChange
    } else {
      const { error } = await auth.signUpWithEmail(email.trim(), password)
      if (error) {
        setError(
          error.message.includes('already registered')
            ? 'Det finns redan ett konto med den e-postadressen. Logga in istället.'
            : 'Kunde inte skapa konto. Försök igen.'
        )
        setLoading(false)
      } else {
        setSuccessMsg('Konto skapat! Kontrollera din e-post för att bekräfta kontot, sedan kan du logga in.')
        setMode('login')
        setPassword('')
        setLoading(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="login-page">
      <div className="login-logo">SkolAI</div>
      <p className="login-tagline">
        Din personliga studiepartner.<br />
        Anpassad efter dina mål.
      </p>

      {/* Mode toggle */}
      <div style={{
        display: 'flex',
        background: 'var(--bg2)',
        borderRadius: 'var(--radius-md)',
        padding: 4,
        marginBottom: 24,
        width: '100%',
        maxWidth: 320,
      }}>
        {(['login', 'signup'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setSuccessMsg(null) }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === m ? 'var(--bg0)' : 'transparent',
              color: mode === m ? 'var(--text1)' : 'var(--text3)',
              fontWeight: mode === m ? 500 : 400,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {m === 'login' ? 'Logga in' : 'Skapa konto'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label className="form-label">E-postadress</label>
          <input
            type="email"
            className="input"
            placeholder="din@skola.se"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="form-label">Lösenord</label>
          <input
            type="password"
            className="input"
            placeholder={mode === 'signup' ? 'Minst 6 tecken' : '••••••••'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && (
          <div className="feedback-bad" style={{ fontSize: 13 }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div className="feedback-good" style={{ fontSize: 13 }}>
            {successMsg}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginTop: 4 }}
        >
          {loading
            ? mode === 'login' ? 'Loggar in…' : 'Skapar konto…'
            : mode === 'login' ? 'Logga in' : 'Skapa konto'}
        </button>
      </div>

      <p style={{
        marginTop: 32, fontSize: 11, color: 'var(--text3)',
        textAlign: 'center', maxWidth: 280, lineHeight: 1.6,
      }}>
        Dina data lagras säkert på svenska servrar.<br />
        Vi skickar aldrig ditt namn eller din e-post till AI-modellen.
      </p>
    </div>
  )
}
