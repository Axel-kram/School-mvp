import React from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import { useProfile } from '../hooks/useProfile'

interface TopBarProps {
  showSubjects?: boolean
  title?: string
  onBack?: () => void
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Nattugla'
  if (h < 10) return 'God morgon'
  if (h < 13) return 'God förmiddag'
  if (h < 18) return 'God eftermiddag'
  return 'God kväll'
}

function getDayLabel(offset: number) {
  const days = ['S', 'M', 'T', 'O', 'T', 'F', 'L']
  const d = new Date()
  d.setDate(d.getDate() - (6 - offset))
  return days[d.getDay()]
}

export function TopBar({ showSubjects = true, title, onBack }: TopBarProps) {
  const { dark, toggle } = useDarkMode()
  const { currentSubject, setCurrentSubject, subjects, streak } = useProfile()

  const streakDays = Array.from({ length: 7 }, (_, i) => i < streak && streak > 0)

  return (
    <div className="topbar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {onBack ? (
          <button className="back-btn" onClick={onBack}>
            ← {title ?? 'Tillbaka'}
          </button>
        ) : (
          <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--text1)' }}>
            {title ?? getGreeting()}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="dm-toggle" onClick={toggle}>
            <span style={{ fontSize: 16, color: 'var(--text3)' }}>{dark ? '☀️' : '🌙'}</span>
            <div className={`toggle ${dark ? 'on' : ''}`}>
              <div className="toggle-dot" />
            </div>
          </div>
          <div className="streak-pill">
            <div className="streak-dot" />
            {streak} {streak === 1 ? 'dag' : 'dagar'}
          </div>
        </div>
      </div>

      <div className="streak-bar">
        {streakDays.map((done, i) => (
          <div key={i} className={`streak-day ${done ? 'done' : ''}`} title={getDayLabel(i)} />
        ))}
      </div>

      {showSubjects && (
        <div className="subject-row">
          {subjects.map(s => (
            <button
              key={s}
              className={`subject-pill ${currentSubject === s ? 'active' : ''}`}
              onClick={() => setCurrentSubject(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
