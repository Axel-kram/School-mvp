import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { useProfile } from '../hooks/useProfile'
import { examQuestions as examApi, ExamQuestion, ExamAnswerFeedback, sessions } from '../lib/api'
import { GradeGoal } from '../lib/supabase'

export function ExamPage() {
  const navigate = useNavigate()
  const { currentSubject, gradeGoals } = useProfile()
  const goal = gradeGoals[currentSubject] ?? 'A'

  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [feedback, setFeedback] = useState<ExamAnswerFeedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [gradingLoading, setGradingLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [startTime] = useState(Date.now())
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const id = await sessions.start(currentSubject, 'exam')
        setSessionId(id)
        const qs = await examApi.generate(currentSubject, goal)
        setQuestions(qs)
        setAnswers(new Array(qs.length).fill(''))
        setLoading(false)
      } catch {
        setError('Kunde inte ladda provfrågor.')
        setLoading(false)
      }
    }
    load()
  }, [currentSubject, goal])

  const currentQ = questions[index]
  const currentAnswer = answers[index] ?? ''

  const setCurrentAnswer = (text: string) => {
    const updated = [...answers]
    updated[index] = text
    setAnswers(updated)
  }

  const handleGrade = async () => {
    if (!currentAnswer.trim()) return
    setGradingLoading(true)
    setFeedback(null)
    try {
      const fb = await examApi.grade(currentSubject, currentQ.question, currentAnswer, goal)
      setFeedback(fb)
    } catch {
      setError('Kunde inte betygsätta svaret.')
    }
    setGradingLoading(false)
  }

  const handleNext = async () => {
    if (index + 1 >= questions.length) {
      setDone(true)
      if (sessionId) await sessions.end(sessionId, Math.round((Date.now() - startTime) / 1000)).catch(() => {})
    } else {
      setIndex(i => i + 1)
      setFeedback(null)
    }
  }

  const gradeColor = (g: string) =>
    g === 'A' ? 'var(--green-text)' : g === 'C' ? 'var(--accent-text)' : 'var(--amber-text)'

  if (loading) return (
    <div className="app-shell">
      <TopBar showSubjects={false} title={`Provfrågor · ${currentSubject}`} onBack={() => navigate('/dashboard')} />
      <main className="page-content"><div className="loading-dots">Skapar provfrågor på {goal}-nivå…</div></main>
      <BottomNav />
    </div>
  )

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title={`Provfrågor · ${currentSubject}`} onBack={() => navigate('/dashboard')} />
      <main className="page-content">

        {error && <div className="feedback-bad" style={{ marginBottom: 12 }}>{error}</div>}

        {!done && currentQ && (
          <>
            <div className="subtitle">
              Uppgift {index + 1} av {questions.length} · {goal}-nivå · Visa din tankegång steg för steg.
            </div>

            <div className="card">
              {currentQ.context && (
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, lineHeight: 1.6, fontStyle: 'italic' }}>
                  {currentQ.context}
                </p>
              )}
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text1)', lineHeight: 1.6 }}>
                {currentQ.question}
              </p>
            </div>

            <textarea
              className="textarea"
              placeholder="Skriv ditt svar här. Visa varje steg — det är så läraren ser hur du tänker."
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              rows={6}
              disabled={gradingLoading || !!feedback}
            />

            {!feedback && (
              <button
                className="btn-primary"
                style={{ marginTop: 10 }}
                onClick={handleGrade}
                disabled={!currentAnswer.trim() || gradingLoading}
              >
                {gradingLoading ? 'Rättar…' : 'Kontrollera svar'}
              </button>
            )}

            {feedback && (
              <>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: gradeColor(feedback.grade) }}>
                      {feedback.grade}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{feedback.feedback}</span>
                  </div>

                  {feedback.improvements.length > 0 && (
                    <div className="card-accent">
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent-text)', marginBottom: 8 }}>
                        För att nå {goal === 'A' ? 'full poäng' : 'nästa nivå'}:
                      </p>
                      {feedback.improvements.map((imp, i) => (
                        <p key={i} style={{ fontSize: 13, color: 'var(--accent-text)', marginBottom: 4, lineHeight: 1.5 }}>
                          · {imp}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="card" style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Betygskriterier</p>
                    {(['E', 'C', 'A'] as GradeGoal[]).map(g => (
                      <div key={g} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: gradeColor(g), width: 16, flexShrink: 0 }}>{g}</span>
                        <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{currentQ.grade_criteria[g]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="btn-primary" style={{ marginTop: 14 }} onClick={handleNext}>
                  {index + 1 >= questions.length ? 'Se sammanfattning' : 'Nästa uppgift →'}
                </button>
              </>
            )}
          </>
        )}

        {done && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text1)', marginBottom: 8 }}>Provet klart!</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 20 }}>
              Bra kämpat. Gå igenom feedbacken och se var du kan förbättra dig till nästa gång.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-primary" onClick={() => { setIndex(0); setFeedback(null); setAnswers(new Array(questions.length).fill('')); setDone(false) }}>
                Kör igen
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                Tillbaka hem
              </button>
            </div>
          </div>
        )}

      </main>
      <BottomNav />
    </div>
  )
}
