import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { exams as examsApi } from '../lib/api'
import { GradeGoal } from '../lib/supabase'
import { SUBJECTS } from '../hooks/useProfile'

export function AddExamPage() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('Matematik')
  const [date, setDate] = useState('')
  const [goal, setGoal] = useState<GradeGoal>('A')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Min date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const handleSave = async () => {
    if (!date) { setError('Välj ett datum för provet.'); return }
    setSaving(true)
    setError(null)
    try {
      await examsApi.add(subject, date, goal)
      navigate('/dashboard')
    } catch {
      setError('Kunde inte spara provet. Försök igen.')
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title="Lägg till prov" onBack={() => navigate('/dashboard')} />
      <main className="page-content">

        <p className="subtitle">
          Appen räknar baklänges från provdatumet och skapar en studieplan baserad på hur mycket tid som finns kvar.
        </p>

        {error && (
          <div className="feedback-bad" style={{ marginBottom: 12 }}>{error}</div>
        )}

        <div className="card">
          <div className="form-group">
            <label className="form-label">Ämne</label>
            <select className="select" value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Provdatum</label>
            <input
              type="date"
              className="input"
              value={date}
              min={minDate}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Betygsmål</label>
            <div className="grade-picker">
              {(['E', 'C', 'A'] as GradeGoal[]).map(g => (
                <button
                  key={g}
                  className={`grade-btn ${goal === g ? 'active' : ''}`}
                  onClick={() => setGoal(g)}
                >
                  {g}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              {goal === 'A' && 'Högsta nivå — djup förståelse och analytisk förmåga.'}
              {goal === 'C' && 'God nivå — bred kunskap med säker tillämpning.'}
              {goal === 'E' && 'Grundnivå — kärnkunskaper befästa.'}
            </p>
          </div>

          <button className="btn-primary" onClick={handleSave} disabled={saving || !date}>
            {saving ? 'Sparar…' : 'Lägg till prov'}
          </button>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
