import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { exams as examsApi } from '../lib/api'
import { Exam } from '../lib/supabase'

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function ExamsPage() {
  const navigate = useNavigate()
  const [examList, setExamList] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const data = await examsApi.getAll().catch(() => [])
    setExamList(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    await examsApi.delete(id).catch(() => {})
    setExamList(list => list.filter(e => e.id !== id))
  }

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title="Provplanering" onBack={() => navigate('/dashboard')} />
      <main className="page-content">

        <p className="subtitle">
          Lägg in dina prov så skapar appen en studieplan och påminner dig i god tid.
        </p>

        <div className="section-header">
          <p className="section-label" style={{ margin: 0 }}>Kommande prov</p>
          <button className="add-link" onClick={() => navigate('/exams/add')}>+ Lägg till</button>
        </div>

        {loading && <div className="loading-dots">Hämtar prov…</div>}

        {!loading && examList.length === 0 && (
          <div className="empty-state">
            Inga prov inlagda.<br />Lägg till ett prov för att få en personlig studieplan.
          </div>
        )}

        {examList.map(exam => {
          const days = daysUntil(exam.exam_date)
          const soon = days <= 5
          const urgent = days <= 2
          return (
            <div key={exam.id} className="exam-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="exam-subject">{exam.subject}</div>
                  <div className="exam-date">{formatDate(exam.exam_date)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    Mål: {exam.grade_goal}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div className={`days-tag ${urgent ? 'days-soon' : soon ? 'days-soon' : 'days-ok'}`}>
                    {days === 0 ? 'Idag!' : days === 1 ? 'Imorgon' : `${days} dagar`}
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => handleDelete(exam.id)}
                    style={{ fontSize: 11, color: 'var(--red-text)' }}
                  >
                    Ta bort
                  </button>
                </div>
              </div>

              <div className="exam-hint" style={{ marginTop: 8 }}>
                {urgent
                  ? '🔴 Bråttom! Prioritera de svagaste områdena nu.'
                  : soon
                  ? '🟡 Dags att intensifiera — kör quiz och provfrågor.'
                  : '🟢 Gott om tid. Börja med flashcards och bygg upp kunskapen.'}
              </div>

              {/* Study plan suggestion */}
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="preset-pill active" onClick={() => navigate('/quiz')}>Quiz →</button>
                <button className="preset-pill active" onClick={() => navigate('/flashcards')}>Flashcards →</button>
                <button className="preset-pill active" onClick={() => navigate('/exam')}>Provfrågor →</button>
              </div>
            </div>
          )
        })}

      </main>
      <BottomNav />
    </div>
  )
}
