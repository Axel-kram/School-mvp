import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { useProfile } from '../hooks/useProfile'
import { flashcards as flashApi, Flashcard, sessions } from '../lib/api'

const ENCOURAGEMENT = [
  'Varje kort du bemästrar är ett steg närmare målet.',
  'Bra fokus — kort som inte sitter nu lägger sig med repetition.',
  'Du är på rätt spår. Fortsätt!',
  'Det tar tid att memorera — du gör precis rätt.',
]

export function FlashcardsPage() {
  const navigate = useNavigate()
  const { currentSubject, gradeGoals } = useProfile()
  const goal = gradeGoals[currentSubject] ?? 'A'

  const [cards, setCards] = useState<Flashcard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [startTime] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const id = await sessions.start(currentSubject, 'flash')
        setSessionId(id)
        const cs = await flashApi.generate(currentSubject, goal)
        setCards(cs)
        setKnown(new Array(cs.length).fill(false))
        setLoading(false)
      } catch {
        setError('Kunde inte ladda flashcards.')
        setLoading(false)
      }
    }
    load()
  }, [currentSubject, goal])

  const current = cards[index]
  const knownCount = known.filter(Boolean).length

  const handleKnew = async (didKnow: boolean) => {
    if (!current) return
    const updated = [...known]
    updated[index] = didKnow
    setKnown(updated)
    await flashApi.saveResult(currentSubject, current.front, current.back, didKnow).catch(() => {})

    if (index + 1 >= cards.length) {
      setDone(true)
      if (sessionId) {
        const secs = Math.round((Date.now() - startTime) / 1000)
        await sessions.end(sessionId, secs).catch(() => {})
      }
    } else {
      setIndex(i => i + 1)
      setFlipped(false)
    }
  }

  if (loading) return (
    <div className="app-shell">
      <TopBar showSubjects={false} title={`Flashcards · ${currentSubject}`} onBack={() => navigate('/dashboard')} />
      <main className="page-content"><div className="loading-dots">Genererar flashcards…</div></main>
      <BottomNav />
    </div>
  )

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title={`Flashcards · ${currentSubject}`} onBack={() => navigate('/dashboard')} />
      <main className="page-content">

        {error && <div className="feedback-bad">{error}</div>}

        {!done && current && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="subtitle" style={{ margin: 0 }}>Kort {index + 1} av {cards.length}</span>
              <span style={{ fontSize: 12, color: 'var(--green-text)' }}>{knownCount} kan ✓</span>
            </div>

            <div className="flashcard-wrap" onClick={() => setFlipped(f => !f)}>
              <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
                <div className="flashcard-face">
                  <span className="flash-front-text">{current.front}</span>
                  <span className="flash-hint-label">Tryck för att vända</span>
                </div>
                <div className="flashcard-face flashcard-back">
                  <span className="flash-back-text">{current.back}</span>
                </div>
              </div>
            </div>

            <div className="flash-actions" style={{ marginTop: 10 }}>
              <button className="flash-btn-no" onClick={() => handleKnew(false)}>✗ Kan inte än</button>
              <button className="flash-btn-yes" onClick={() => handleKnew(true)}>✓ Sitter!</button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
              {ENCOURAGEMENT[index % ENCOURAGEMENT.length]}
            </div>
          </>
        )}

        {done && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              {knownCount === cards.length ? '🎯' : knownCount >= cards.length * 0.7 ? '⭐' : '💪'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text1)', marginBottom: 8 }}>
              {knownCount} av {cards.length} kort sitter
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 20 }}>
              {knownCount === cards.length
                ? 'Perfekt! Alla kort sitter. Kör igen imorgon för att befästa.'
                : `${cards.length - knownCount} kort behöver lite mer träning. Kör en runda till!`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-primary" onClick={() => { setIndex(0); setFlipped(false); setKnown(new Array(cards.length).fill(false)); setDone(false) }}>
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
