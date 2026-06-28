import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { teacher, classes as classesApi } from '../lib/api'
import { SchoolClass } from '../lib/supabase'

const SUBJECTS = ['Matematik', 'Svenska', 'Engelska', 'Historia', 'Samhällskunskap', 'Biologi', 'Kemi', 'Fysik']

export function TeacherDashboardPage() {
  const navigate = useNavigate()
  const [myClasses, setMyClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSubject, setNewSubject] = useState(SUBJECTS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    teacher.ensureProfile().catch(() => {})
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    const data = await classesApi.getMine()
    setMyClasses(data)
    setLoading(false)
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await classesApi.create(newName.trim(), newSubject)
      setNewName('')
      setShowCreate(false)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar" style={{ paddingBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#ffffff' }}>Mina klasser</span>
        </div>
      </div>

      <div className="page-content">
        <p className="subtitle">
          Skapa en klass per ämne du undervisar i. Eleverna går med via en kod du delar med dem.
          Materialet du laddar upp styr vad AI:n genererar åt just den klassen.
        </p>

        {loading ? (
          <div className="loading-dots">Laddar…</div>
        ) : myClasses.length === 0 && !showCreate ? (
          <div className="empty-state">Du har inga klasser än. Skapa din första nedan.</div>
        ) : (
          myClasses.map(c => (
            <div
              key={c.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/teacher/class/${c.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text1)' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{c.subject}</div>
                </div>
                <div className="goal-badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  Kod: {c.join_code}
                </div>
              </div>
            </div>
          ))
        )}

        {showCreate ? (
          <div className="card-accent">
            <div className="form-group">
              <label className="form-label">Klassnamn</label>
              <input
                className="input"
                placeholder="t.ex. NA21A"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ämne</label>
              <select className="select" value={newSubject} onChange={e => setNewSubject(e.target.value)}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn-primary" disabled={saving || !newName.trim()} onClick={handleCreate}>
              {saving ? 'Skapar…' : 'Skapa klass'}
            </button>
            <button className="btn-ghost" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={() => setShowCreate(false)}>
              Avbryt
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>
            + Skapa ny klass
          </button>
        )}
      </div>
    </div>
  )
}
