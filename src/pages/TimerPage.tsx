import React, { useCallback, useEffect, useRef, useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { TopBar } from '../components/TopBar'
import { useProfile } from '../hooks/useProfile'
import { sessions } from '../lib/api'

const PRESETS = [
  { label: '25 min', mins: 25 },
  { label: '45 min', mins: 45 },
  { label: '60 min', mins: 60 },
  { label: '90 min', mins: 90 },
]

const MOTTOS = [
  'En session i taget.',
  'Fokus nu, vila sen.',
  'Du klarar det här.',
  'Varje minut räknas.',
  'Stäng allt annat. Det här är din tid.',
]

const RADIUS = 60
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function TimerPage() {
  const { currentSubject } = useProfile()
  const [preset, setPreset] = useState(25)
  const [secs, setSecs] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [motto] = useState(MOTTOS[Math.floor(Math.random() * MOTTOS.length)])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  const [todaySecs, setTodaySecs] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSecs = preset * 60
  const progress = secs / totalSecs
  const strokeOffset = CIRCUMFERENCE * progress

  const pad = (n: number) => String(n).padStart(2, '0')
  const displayMins = pad(Math.floor(secs / 60))
  const displaySecs = pad(secs % 60)

  const loadToday = useCallback(async () => {
    const total = await sessions.getTodayDuration().catch(() => 0)
    setTodaySecs(total)
  }, [])

  useEffect(() => { loadToday() }, [loadToday])

  const start = async () => {
    setRunning(true)
    setFinished(false)
    const id = await sessions.start(currentSubject, 'chat').catch(() => null)
    setSessionId(id)
    setSessionStart(Date.now())
  }

  const pause = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const reset = () => {
    setRunning(false)
    setFinished(false)
    setSecs(preset * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const changePreset = (mins: number) => {
    if (running) return
    setPreset(mins)
    setSecs(mins * 60)
    setFinished(false)
  }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          setFinished(true)
          const elapsed = Math.round((Date.now() - (sessionStart ?? Date.now())) / 1000)
          if (sessionId) sessions.end(sessionId, elapsed).catch(() => {})
          loadToday()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, sessionId, sessionStart, loadToday])

  const todayMins = Math.round(todaySecs / 60)

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title="Studietimer" />
      <main className="page-content">

        <p className="subtitle">
          Starta timern när du börjar plugga. Appen loggar sessionen automatiskt och räknar in den i din streak.
        </p>

        <div className="timer-presets">
          {PRESETS.map(p => (
            <button
              key={p.mins}
              className={`preset-pill ${preset === p.mins ? 'active' : ''}`}
              onClick={() => changePreset(p.mins)}
              disabled={running}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="timer-ring-wrap">
          <svg width="160" height="160" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="var(--bg3)" strokeWidth="7" />
            <circle
              cx="80" cy="80" r={RADIUS} fill="none"
              stroke={finished ? 'var(--green-text)' : 'var(--accent)'}
              strokeWidth="7"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={finished ? 0 : strokeOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="timer-display">
            <div className="timer-big" style={{ color: finished ? 'var(--green-text)' : 'var(--text1)' }}>
              {finished ? '✓' : `${displayMins}:${displaySecs}`}
            </div>
            <div className="timer-sub">{currentSubject}</div>
          </div>
        </div>

        <div className="timer-motto">
          {finished ? 'Bra jobbat — den sessionen räknas.' : running ? motto : 'Redo när du är det.'}
        </div>

        <div className="timer-btns" style={{ marginTop: 20 }}>
          <button className="btn-secondary" onClick={reset}>↺ Återställ</button>
          <button
            className="btn-primary"
            onClick={running ? pause : start}
            style={{ background: running ? 'var(--amber)' : undefined }}
          >
            {running ? '⏸ Pausa' : finished ? '↺ Ny session' : '▶ Starta'}
          </button>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)' }}>Idag</p>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{todayMins} min totalt</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
            {todayMins === 0
              ? 'Ingen session registrerad ännu. Starta timern för att börja räkna.'
              : todayMins < 30
              ? 'Bra start. Sikta på 45 min för att hålla streaken igång.'
              : todayMins < 60
              ? 'Bra jobbat idag. Du är på rätt spår.'
              : 'Riktigt bra pluggdag — det syns i resultaten.'}
          </p>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
