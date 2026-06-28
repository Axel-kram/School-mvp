import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { DarkModeProvider } from './hooks/useDarkMode'
import { ProfileProvider } from './hooks/useProfile'

import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { QuizPage } from './pages/QuizPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { WritingPage } from './pages/WritingPage'
import { ExamPage } from './pages/ExamPage'
import { ChatPage } from './pages/ChatPage'
import { TimerPage } from './pages/TimerPage'
import { AlarmsPage } from './pages/AlarmsPage'
import { AddAlarmPage } from './pages/AddAlarmPage'
import { ProfilePage } from './pages/ProfilePage'
import { ExamsPage } from './pages/ExamsPage'
import { AddExamPage } from './pages/AddExamPage'
import { TeacherDashboardPage } from './pages/TeacherDashboardPage'
import { TeacherClassPage } from './pages/TeacherClassPage'

// Auth guard — redirects to login if not signed in
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg0)',
      }}>
        <div style={{ fontSize: 14, color: 'var(--text3)' }}>Laddar…</div>
      </div>
    )
  }
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg0)',
      }}>
        <div style={{ fontSize: 14, color: 'var(--text3)' }}>Laddar…</div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Protected */}
      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/quiz" element={<RequireAuth><QuizPage /></RequireAuth>} />
      <Route path="/flashcards" element={<RequireAuth><FlashcardsPage /></RequireAuth>} />
      <Route path="/writing" element={<RequireAuth><WritingPage /></RequireAuth>} />
      <Route path="/exam" element={<RequireAuth><ExamPage /></RequireAuth>} />
      <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
      <Route path="/timer" element={<RequireAuth><TimerPage /></RequireAuth>} />
      <Route path="/alarms" element={<RequireAuth><AlarmsPage /></RequireAuth>} />
      <Route path="/alarms/add" element={<RequireAuth><AddAlarmPage /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/exams" element={<RequireAuth><ExamsPage /></RequireAuth>} />
      <Route path="/exams/add" element={<RequireAuth><AddExamPage /></RequireAuth>} />
      <Route path="/teacher" element={<RequireAuth><TeacherDashboardPage /></RequireAuth>} />
      <Route path="/teacher/class/:id" element={<RequireAuth><TeacherClassPage /></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <DarkModeProvider>
        <AuthProvider>
          <ProfileProvider>
            <AppRoutes />
          </ProfileProvider>
        </AuthProvider>
      </DarkModeProvider>
    </BrowserRouter>
  )
}
