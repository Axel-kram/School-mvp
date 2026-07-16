import { useAuth } from '../hooks/useAuth'

export function TeacherTopBar() {
  const { user, signOut } = useAuth()

  return (
    <header className="top-bar">
      <span className="top-bar-brand">SkolAI — Lärare</span>
      <button className="top-bar-logout" onClick={signOut}>
        Logga ut
      </button>
    </header>
  )
}
