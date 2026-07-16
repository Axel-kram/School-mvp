import { Routes, Route, Navigate } from 'react-router-dom'
import { TeacherTopBar } from '../components/TeacherTopBar'
import { TeacherDashboardPage } from './TeacherDashboardPage'
import { TeacherClassPage } from './TeacherClassPage'

export function TeacherRoutes() {
  return (
    <div className="student-layout">
      <TeacherTopBar />
      <main className="student-content">
        <Routes>
          <Route path="/" element={<TeacherDashboardPage />} />
          <Route path="/class/:classId" element={<TeacherClassPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
