import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'

export function TopBar() {
  const { profile, loading } = useProfile()
  const { signOut } = useAuth()

  return (
    <header className="top-bar">
      <span className="top-bar-brand">SkolAI</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="top-bar-streak">
          {loading ? '…' : `🔥 ${profile?.streak ?? 0}`}
        </span>
        <button className="top-bar-logout" onClick={signOut}>
          Logga ut
        </button>
      </div>
    </header>
  )
}
