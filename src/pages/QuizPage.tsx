import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { useProfile } from '../hooks/useProfile'
import { quiz as quizApi, QuizQuestion, sessions } from '../lib/api'

type Phase = 'loading' | 'question' | 'answered' | 'done'

export function QuizPage() {
  const navigate = useNavigate()
  const { currentSubject, gradeGoals, studentProfile } = useProfile()
  const goal = gradeGoals[currentSubject] ?? 'A'

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const id = await sessions.start(currentSubject, 'quiz')
        setSessionId(id)
        setStartTime(Date.now())
        const weaknesses = studentProfile?.weaknesses?.[currentSubject] ?? []
        const qs = await quizApi.generate(currentSubject, goal, weaknesses)
        setQuestions(qs)
        setPhase('question')
      } catch {
        setError('Kunde inte ladda quiz. Kontrollera din anslutning och försök igen.')
        setPhase('done')
      }
    }
    load()
  }, [currentSubject, goal])

  const currentQ = questions[index]

  const handleAnswer = async (optionIndex: number) => {
    if (phase !== 'question') return
    setSelected(optionIndex)
    setPhase('answered')
    const correct = optionIndex === currentQ.correct_index
    if (correct) setScore(s => s + 1)
    await quizApi.saveResult(currentSubject, correct, currentQ.question).catch(() => {})
  }

  const handleNext = async () => {
    if (index + 1 >= questions.length) {
      setPhase('done')
      if (sessionId) {
        const secs = Math.round((Date.now() - startTime) / 1000)
        await sessions.end(sessionId, secs).catch(() => {})
      }
    } else {
      setIndex(i => i + 1)
      setSelected(null)
      setPhase('question')
    }
  }

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title={`Quiz · ${currentSubject}`} onBack={() => navigate('/dashboard')} />
      <main className="page-content">

        {phase === 'loading' && (
          <div className="loading-dots">Genererar frågor anpassade till {goal}-nivå…</div>
        )}

        {error && <div className="feedback-bad">{error}</div>}

        {phase !== 'loading' && phase !== 'done' && currentQ && (
          <>
            <div className="subtitle" style={{ marginBottom: 4 }}>
              Fråga {index + 1} av {questions.length} · {goal}-nivå · {currentSubject}
            </div>
            {index > 0 && (
              <div style={{ fontSize: 12, color: 'var(--accent-text)', marginBottom: 12 }}>
                {score} av {index} rätt hittills — fortsätt så!
              </div>
            )}

            <div className="card">
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text1)', lineHeight: 1.55, marginBottom: 16 }}>
                {currentQ.question}
              </p>

              {currentQ.options.map((opt, i) => {
                let cls = 'quiz-option'
                if (phase === 'answered') {
                  if (i === currentQ.correct_index) cls += ' correct'
                  else if (i === selected) cls += ' wrong'
                }
                return (
                  <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={phase === 'answered'}>
                    {opt}
                  </button>
                )
              })}

              {phase === 'answered' && (
                <>
                  <div className={selected === currentQ.correct_index ? 'feedback-good' : 'feedback-bad'} style={{ marginTop: 10 }}>
                    {selected === currentQ.correct_index
                      ? `Rätt! ${currentQ.explanation}`
                      : `Inte riktigt. ${currentQ.explanation}`}
                  </div>
                  {currentQ.tip && (
                    <div style={{ fontSize: 12, color: 'var(--accent-text)', fontStyle: 'italic', marginTop: 8 }}>
                      💡 {currentQ.tip}
                    </div>
                  )}
                  <button className="btn-primary" style={{ marginTop: 14 }} onClick={handleNext}>
                    {index + 1 >= questions.length ? 'Se resultat' : 'Nästa fråga →'}
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {phase === 'done' && !error && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              {score === questions.length ? '🏆' : score >= questions.length * 0.7 ? '⭐' : '💪'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text1)', marginBottom: 8 }}>
              {score} av {questions.length} rätt
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 20 }}>
              {score === questions.length
                ? 'Perfekt! Du kan det här. Dags att utmana dig med svårare frågor.'
                : score >= questions.length * 0.7
                ? 'Bra jobbat! Ett par områden är värda en extra titt.'
                : 'Bra start. Det som inte sitter nu lägger sig med repetition — kör igen!'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-primary" onClick={() => { setIndex(0); setScore(0); setPhase('loading'); setQuestions([]) }}>
                Nytt quiz
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
