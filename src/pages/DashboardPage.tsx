import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { useProfile } from '../hooks/useProfile'
import { dashboard, exams as examsApi } from '../lib/api'
import { Exam } from '../lib/supabase'

interface Suggestion { icon: string; color: string; title: string; hint: string; route: string }
interface StatusMsg { type: 'success' | 'progress'; title: string; sub: string; progress?: number }

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { currentSubject, gradeGoals } = useProfile()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [statusMsgs, setStatusMsgs] = useState<StatusMsg[]>([])
  const [examList, setExamList] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboard.getSuggestions().catch(() => []),
      dashboard.getStatusMessages().catch(() => []),
      examsApi.getAll().catch(() => []),
    ]).then(([s, m, e]) => {
      setSuggestions(s as Suggestion[])
      setStatusMsgs(m as StatusMsg[])
      setExamList(e as Exam[])
      setLoading(false)
    })
  }, [])

  const goal = gradeGoals[currentSubject] ?? 'A'

  const displaySuggestions: Suggestion[] = suggestions.length > 0 ? suggestions : [
    { icon: '❓', color: 'purple', title: `Quiz i ${currentSubject}`, hint: 'Testa vad du kan innan du pluggar vidare.', route: '/quiz' },
    { icon: '🃏', color: 'amber', title: `Flashcards i ${currentSubject}`, hint: 'Snabb genomgång av viktiga begrepp.', route: '/flashcards' },
    { icon: '✏️', color: 'teal', title: 'Skriv och få kritik', hint: 'Öva på att formulera dig och få direkt feedback.', route: '/writing' },
  ]

  return (
    <div className="app-shell">
      <TopBar showSubjects />
      <main className="page-content">

        {statusMsgs.map((msg, i) => (
          <div key={i} className={msg.type === 'success' ? 'card-green' : 'card-amber'}>
            <div style={{ fontSize: msg.type === 'success' ? 22 : 16, marginBottom: 6 }}>
              {msg.type === 'success' ? '★' : '→'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: msg.type === 'success' ? 'var(--green-text)' : 'var(--amber-text)', marginBottom: 4 }}>
              {msg.title}
            </div>
            <div style={{ fontSize: 12, color: msg.type === 'success' ? 'var(--green-text)' : 'var(--amber-text)', opacity: 0.85, lineHeight: 1.5 }}>
              {msg.sub}
            </div>
            {msg.progress !== undefined && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${msg.progress}%` }} />
              </div>
            )}
          </div>
        ))}

        <p className="section-label" style={{ marginTop: statusMsgs.length > 0 ? 4 : 0 }}>
          {loading ? 'Hämtar förslag…' : 'Fortsätt härifrån'}
        </p>
        {displaySuggestions.map((s, i) => (
          <div key={i} className="nudge" onClick={() => navigate(s.route)}>
            <div className={`nudge-icon ${s.color}`}>{s.icon}</div>
            <div className="nudge-text">
              <div className="nudge-main">{s.title}</div>
              <div className="nudge-hint">{s.hint}</div>
            </div>
            <span style={{ color: 'var(--text3)', fontSize: 14 }}>→</span>
          </div>
        ))}

        <p className="section-label" style={{ marginTop: 8 }}>Alla verktyg</p>
        <div className="tools-grid">
          {[
            { icon: '❓', name: 'Quiz', desc: 'Testa kunskaper', route: '/quiz' },
            { icon: '🃏', name: 'Flashcards', desc: 'Memorera begrepp', route: '/flashcards' },
            { icon: '✏️', name: 'Skriv & kritik', desc: 'Öppna frågor', route: '/writing' },
            { icon: '📄', name: 'Provfrågor', desc: 'Simulera prov', route: '/exam' },
            { icon: '💬', name: 'Chatt', desc: 'Fråga vad som helst', route: '/chat' },
          ].map(t => (
            <div key={t.route} className="tool-card" onClick={() => navigate(t.route)}>
              <div className="tool-icon">{t.icon}</div>
              <div className="tool-name">{t.name}</div>
              <div className="tool-desc">{t.desc}</div>
              <span className="goal-badge">Mål: {goal}</span>
            </div>
          ))}
        </div>

        <div className="section-header">
          <p className="section-label" style={{ margin: 0 }}>Kommande prov</p>
          <button className="add-link" onClick={() => navigate('/exams/add')}>+ Lägg till</button>
        </div>

        {examList.length === 0 && !loading && (
          <div className="empty-state">
            Inga prov inlagda.<br />Lägg till ett prov för att få en studieplan.
          </div>
        )}

        {examList.slice(0, 3).map(exam => {
          const days = daysUntil(exam.exam_date)
          const soon = days <= 5
          return (
            <div key={exam.id} className="exam-card">
              <div>
                <div className="exam-subject">{exam.subject}</div>
                <div className="exam-date">{formatDate(exam.exam_date)}</div>
                <div className="exam-hint">
                  {soon
                    ? 'Dags att intensifiera — kör ett snabbtest idag.'
                    : 'Gott om tid. Börja med ett par flashcard-ronder.'}
                </div>
              </div>
              <div className={`days-tag ${soon ? 'days-soon' : 'days-ok'}`}>
                {days === 0 ? 'Idag' : days === 1 ? 'Imorgon' : `${days} dagar`}
              </div>
            </div>
          )
        })}

      </main>
      <BottomNav />
    </div>
  )
}
