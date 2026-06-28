import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { TopBar } from '../components/TopBar'
import { alarms as alarmsApi } from '../lib/api'
import { SUBJECTS } from '../hooks/useProfile'

const DAYS_SHORT = ['M', 'T', 'O', 'T', 'F', 'L', 'S']
const DAY_FULL = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
const DURATIONS = [15, 25, 45, 60, 90]

function formatAlarmDays(days: number[]): string {
  if (days.length === 5 && !days.includes(5) && !days.includes(6)) return 'Vardagar'
  if (days.length === 7) return 'Varje dag'
  if (days.length === 0) return 'Välj minst en dag'
  return days.map(d => DAY_FULL[d]).join(', ')
}

export function AddAlarmPage() {
  const navigate = useNavigate()
  const [time, setTime] = useState('18:00')
  const [subject, setSubject] = useState('Matematik')
  const [days, setDays] = useState([0, 1, 3, 4]) // M T T F
  const [duration, setDuration] = useState(25)
  const [saving, setSaving] = useState(false)

  const toggleDay = (d: number) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  const handleSave = async () => {
    if (days.length === 0) return
    setSaving(true)
    await alarmsApi.add({
      subject, days_of_week: days, time_of_day: time + ':00',
      duration_minutes: duration, active: true,
    }).catch(() => {})
    navigate('/alarms')
  }

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title="Nytt larm" onBack={() => navigate('/alarms')} />
      <main className="page-content">

        <p className="subtitle">
          Välj en tid du faktiskt håller. Ju mer konsekvent du pluggar, desto mer värde ger appen.
        </p>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Tid</label>
            <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Dagar</label>
            <div className="day-picker">
              {DAYS_SHORT.map((d, i) => (
                <button
                  key={i}
                  className={`day-dot ${days.includes(i) ? 'active' : ''}`}
                  onClick={() => toggleDay(i)}
                  style={{ width: 38, height: 38, fontSize: 12 }}
                >
                  {d}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              {formatAlarmDays(days)}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Ämne</label>
            <select className="select" value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sessionslängd</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DURATIONS.map(d => (
                <button
                  key={d}
                  className={`preset-pill ${duration === d ? 'active' : ''}`}
                  onClick={() => setDuration(d)}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={handleSave} disabled={saving || days.length === 0}>
            {saving ? 'Sparar…' : 'Spara larm'}
          </button>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
