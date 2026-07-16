import { Routes, Route, Navigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { DashboardPage } from './DashboardPage'
import { ProfilePage } from './ProfilePage'

export function StudentRoutes() {
  return (
    <div className="student-layout">
      <TopBar />
      <main className="student-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
