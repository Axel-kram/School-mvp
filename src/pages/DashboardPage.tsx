import { useState } from 'react'
import type { FormEvent } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { user } = useAuth()
  const { profile, loading, error, joinClass } = useProfile()

  const [code, setCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinInfo, setJoinInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    setJoinError(null)
    setJoinInfo(null)

    if (!code.trim()) {
      setJoinError('Fyll i en klasskod.')
      return
    }

    setSubmitting(true)
    const result = await joinClass(code)
    setSubmitting(false)

    if (result.alreadyMember) {
      setJoinInfo('Du är redan med i den här klassen.')
      setCode('')
      return
    }

    if (result.error) {
      setJoinError(result.error)
      return
    }

    setJoinInfo('Du har gått med i klassen!')
    setCode('')
  }

  if (loading) {
    return <p>Laddar din dashboard…</p>
  }

  if (error) {
    return <p className="auth-error">{error}</p>
  }

  const firstName = user?.email ? user.email.split('@')[0] : ''

  return (
    <div className="dashboard-page">
      <h1>Hej{firstName ? ', ' + firstName : ''}!</h1>

      <section>
        <h2>Dina klasser</h2>
        {profile?.classes.length ? (
          <ul>
            {profile.classes.map((c) => (
              <li key={c.id}>
                {c.name}
                {c.subject ? ' — ' + c.subject : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>Du är inte med i några klasser än.</p>
        )}
      </section>

      <section>
        <h2>Gå med i klass</h2>
        <form onSubmit={handleJoin} className="join-class-form">
          <input
            type="text"
            placeholder="Klasskod"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Går med…' : 'Gå med'}
          </button>
        </form>
        {joinInfo && <p className="auth-info">{joinInfo}</p>}
        {joinError && <p className="auth-error">{joinError}</p>}
      </section>
    </div>
  )
}
