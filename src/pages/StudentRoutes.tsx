import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { ProfilePage } from './ProfilePage'
import { ChatPage } from './ChatPage'
import { QuizPage } from './QuizPage'
import { FlashcardsPage } from './FlashcardsPage'
import { WritingPage } from './WritingPage'
import { ExamPage } from './ExamPage'
import { ExamsPage } from './ExamsPage'
import { AddExamPage } from './AddExamPage'
import { AlarmsPage } from './AlarmsPage'
import { AddAlarmPage } from './AddAlarmPage'
import { TimerPage } from './TimerPage'

// Ingen layout-wrapper har: varje sida renderar sin egen TopBar/BottomNav
// (juni-monstret). Wrappade vi dem har skulle undersidorna fa dubbla menyrader.
export function StudentRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/profil" element={<ProfilePage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/flashcards" element={<FlashcardsPage />} />
      <Route path="/writing" element={<WritingPage />} />
      <Route path="/exam" element={<ExamPage />} />
      <Route path="/exams" element={<ExamsPage />} />
      <Route path="/exams/add" element={<AddExamPage />} />
      <Route path="/alarms" element={<AlarmsPage />} />
      <Route path="/alarms/add" element={<AddAlarmPage />} />
      <Route path="/timer" element={<TimerPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
