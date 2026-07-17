import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { useProfile } from '../hooks/useProfile'

const actions = [
  { to: '/chat', label: 'Chatta med AI:n', icon: '💬', hint: 'Fråga om vad som helst' },
  { to: '/quiz', label: 'Quiz', icon: '❓', hint: 'Testa dig själv' },
  { to: '/flashcards', label: 'Flashcards', icon: '🃏', hint: 'Plugga begrepp' },
  { to: '/writing', label: 'Skrivuppgift', icon: '✍️', hint: 'Få feedback på text' },
  { to: '/exam', label: 'Provfrågor', icon: '📝', hint: 'Öva inför prov' },
  { to: '/timer', label: 'Pluggtimer', icon: '⏱️', hint: 'Räkna mot streaken' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile, loading, error, joinClass, currentSubject, setCurrentSubject } = useProfile()

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
    return (
      <div className="student-layout">
        <TopBar showSubjects={false} />
        <main className="student-content">
          <p>Laddar din dashboard…</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (error) {
    return (
      <div className="student-layout">
        <TopBar showSubjects={false} />
        <main className="student-content">
          <p className="auth-error">{error}</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  const hasClasses = (profile?.classes.length ?? 0) > 0

  return (
    <div className="student-layout">
      <TopBar showSubjects={false} />
      <main className="student-content">
        <div className="dashboard-page">
          <h1>Hej{profile?.username ? `, ${profile.username}` : ''}!</h1>

          <section className="dash-section">
            <h2>Dina klasser</h2>
            {hasClasses ? (
              <div className="class-grid">
                {profile!.classes.map((c) => {
                  const isActive = !!c.subject && c.subject === currentSubject
                  return (
                    <button
                      key={c.id}
                      className={'class-card' + (isActive ? ' class-card-active' : '')}
                      onClick={() => c.subject && setCurrentSubject(c.subject)}
                    >
                      <span className="class-card-name">{c.name}</span>
                      <span className="class-card-subject">{c.subject ?? 'Inget ämne'}</span>
                      {isActive && <span className="class-card-badge">Vald</span>}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p>Du är inte med i några klasser än. Fyll i koden du fått av din lärare.</p>
            )}
          </section>

          {hasClasses && (
            <section className="dash-section">
              <h2>Vad vill du göra{currentSubject ? ` i ${currentSubject}` : ''}?</h2>
              {!currentSubject && (
                <p className="auth-info">Välj en klass ovan först, så vet AI:n vilket ämne du menar.</p>
              )}
              <div className="action-grid">
                {actions.map((a) => (
                  <button
                    key={a.to}
                    className="action-card"
                    disabled={!currentSubject}
                    onClick={() => navigate(a.to)}
                  >
                    <span className="action-icon" aria-hidden="true">
                      {a.icon}
                    </span>
                    <span className="action-label">{a.label}</span>
                    <span className="action-hint">{a.hint}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="dash-section">
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
      </main>
      <BottomNav />
    </div>
  )
}
