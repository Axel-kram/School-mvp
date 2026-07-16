import { BrowserRouter } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { StudentRoutes } from './pages/StudentRoutes'
import { TeacherRoutes } from './pages/TeacherRoutes'

export default function App() {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <span className="spinner" aria-hidden="true" />
        <p>Laddar…</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <BrowserRouter>
      {role === 'student' && <StudentRoutes />}
      {role === 'teacher' && <TeacherRoutes />}
      {role === null && (
        <div className="app-loading">
          <p>Kunde inte hitta din roll. Kontakta support.</p>
        </div>
      )}
    </BrowserRouter>
  )
}
