import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'

interface TopBarProps {
  // Juni-sidorna skickar dessa. Juli-versionen tog inga props alls, sa titel
  // och tillbaka-knapp foll bort tyst pa varje undersida.
  title?: string
  showSubjects?: boolean
  onBack?: () => void
}

export function TopBar({ title, showSubjects = true, onBack }: TopBarProps) {
  const { profile, loading, subjects, currentSubject, setCurrentSubject } = useProfile()
  const { signOut } = useAuth()

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {onBack && (
          <button className="top-bar-back" onClick={onBack} aria-label="Tillbaka">
            ←
          </button>
        )}
        <span className="top-bar-brand">{title ?? 'SkolAI'}</span>
      </div>

      {showSubjects && subjects.length > 0 && (
        <div className="top-bar-subjects">
          {subjects.map((s) => (
            <button
              key={s}
              className={'subject-pill' + (s === currentSubject ? ' subject-pill-active' : '')}
              onClick={() => setCurrentSubject(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="top-bar-right">
        <span className="top-bar-streak">{loading ? '…' : `🔥 ${profile?.streak ?? 0}`}</span>
        <button className="top-bar-logout" onClick={signOut}>
          Logga ut
        </button>
      </div>
    </header>
  )
}
