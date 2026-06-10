import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { useProfile } from '../hooks/useProfile'
import { writing as writingApi, WritingFeedback, sessions } from '../lib/api'

type Phase = 'loading-prompt' | 'writing' | 'loading-feedback' | 'feedback'

export function WritingPage() {
  const navigate = useNavigate()
  const { currentSubject, gradeGoals } = useProfile()
  const goal = gradeGoals[currentSubject] ?? 'A'

  const [prompt, setPrompt] = useState('')
  const [hint, setHint] = useState('')
  const [studentText, setStudentText] = useState('')
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null)
  const [phase, setPhase] = useState<Phase>('loading-prompt')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [startTime] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const id = await sessions.start(currentSubject, 'write')
        setSessionId(id)
        const result = await writingApi.getPrompt(currentSubject, goal)
        setPrompt(result.prompt)
        setHint(result.hint)
        setPhase('writing')
      } catch {
        setError('Kunde inte ladda uppgift. Försök igen.')
        setPhase('writing')
      }
    }
    load()
  }, [currentSubject, goal])

  const handleSubmit = async () => {
    if (studentText.trim().length < 30) return
    setPhase('loading-feedback')
    try {
      const fb = await writingApi.getFeedback(currentSubject, goal, prompt, studentText)
      setFeedback(fb)
      await writingApi.save(currentSubject, prompt, studentText, fb).catch(() => {})
      if (sessionId) {
        await sessions.end(sessionId, Math.round((Date.now() - startTime) / 1000)).catch(() => {})
      }
      setPhase('feedback')
    } catch {
      setError('Kunde inte hämta feedback. Försök igen.')
      setPhase('writing')
    }
  }

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title={`Skriv & kritik · ${currentSubject}`} onBack={() => navigate('/dashboard')} />
      <main className="page-content">

        {error && <div className="feedback-bad" style={{ marginBottom: 12 }}>{error}</div>}

        {phase === 'loading-prompt' && (
          <div className="loading-dots">Skapar en uppgift anpassad till {goal}-nivå…</div>
        )}

        {(phase === 'writing' || phase === 'loading-feedback') && (
          <>
            <div className="card" style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Uppgift · {goal}-nivå</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text1)', lineHeight: 1.6 }}>{prompt}</p>
              {hint && (
                <p style={{ fontSize: 12, color: 'var(--accent-text)', marginTop: 10, lineHeight: 1.5 }}>
                  💡 {hint}
                </p>
              )}
            </div>

            <textarea
              className="textarea"
              placeholder="Skriv ditt svar här — det behöver inte vara perfekt från start. Det är i försöket du lär dig."
              value={studentText}
              onChange={e => setStudentText(e.target.value)}
              rows={8}
              disabled={phase === 'loading-feedback'}
            />

            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, marginBottom: 12, textAlign: 'right' }}>
              {studentText.length} tecken
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={studentText.trim().length < 30 || phase === 'loading-feedback'}
            >
              {phase === 'loading-feedback' ? 'Analyserar ditt svar…' : 'Skicka för feedback'}
            </button>
          </>
        )}

        {phase === 'feedback' && feedback && (
          <>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text1)', marginBottom: 12 }}>
              Det här var ett bra försök — här är din feedback.
            </div>

            {[
              { label: 'Innehåll', text: feedback.feedback_content },
              { label: 'Struktur', text: feedback.feedback_structure },
              { label: 'Språk',    text: feedback.feedback_language },
            ].map(row => (
              <div key={row.label} className="feedback-row">
                <div className="feedback-row-label">{row.label}</div>
                <div className="feedback-row-text">{row.text}</div>
              </div>
            ))}

            {feedback.challenge && goal === 'A' && (
              <div className="card-accent" style={{ marginTop: 4 }}>
                <p style={{ fontSize: 11, color: 'var(--accent-text)', marginBottom: 4 }}>A-UTMANING</p>
                <p style={{ fontSize: 13, color: 'var(--accent-text)', lineHeight: 1.6 }}>{feedback.challenge}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <button className="btn-primary" onClick={() => { setStudentText(''); setFeedback(null); setPhase('loading-prompt') }}>
                Ny uppgift
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                Tillbaka hem
              </button>
            </div>
          </>
        )}

      </main>
      <BottomNav />
    </div>
  )
}
