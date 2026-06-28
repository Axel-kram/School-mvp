import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { useProfile, SUBJECTS } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { auth, gdpr } from '../lib/api'
import { GradeGoal } from '../lib/supabase'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { gradeGoals, setGradeGoal, streak } = useProfile()
  const [deletingData, setDeletingData] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSignOut = async () => {
    await auth.signOut()
    navigate('/')
  }

  const handleDeleteData = async () => {
    setDeletingData(true)
    await gdpr.deleteAllData().catch(() => {})
    await auth.signOut()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <TopBar showSubjects={false} title="Profil" />
      <main className="page-content">

        {/* Account info */}
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Inloggad som</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text1)' }}>
            {user?.email ?? '—'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <div className="streak-pill">
              <div className="streak-dot" />
              {streak} {streak === 1 ? 'dag i rad' : 'dagar i rad'}
            </div>
          </div>
        </div>

        {/* Grade goals per subject */}
        <p className="section-label">Betygsmål per ämne</p>
        <p className="subtitle" style={{ marginBottom: 12 }}>
          Ditt betygsmål styr svårighetsgraden på allt — quiz, flashcards, skrivuppgifter och provfrågor.
        </p>

        {SUBJECTS.map(subject => {
          const current = gradeGoals[subject] ?? 'A'
          return (
            <div key={subject} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text1)' }}>{subject}</span>
                <span className="goal-badge">Mål: {current}</span>
              </div>
              <div className="grade-picker">
                {(['E', 'C', 'A'] as GradeGoal[]).map(g => (
                  <button
                    key={g}
                    className={`grade-btn ${current === g ? 'active' : ''}`}
                    onClick={() => setGradeGoal(subject, g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {/* Sign out */}
        <div style={{ marginTop: 24 }}>
          <button
            className="btn-secondary"
            onClick={handleSignOut}
            style={{ width: '100%', marginBottom: 12 }}
          >
            Logga ut
          </button>
        </div>

        {/* GDPR — delete all data */}
        <div className="card" style={{ borderColor: 'var(--red-bg)', background: 'var(--bg0)' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)', marginBottom: 4 }}>
            Radera all min data
          </p>
          <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 12 }}>
            Tar permanent bort alla dina studiesessioner, chattar, quizresultat och profildata. Det går inte att ångra.
          </p>
          {!showDeleteConfirm ? (
            <button
              className="btn-ghost"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ color: 'var(--red-text)', fontSize: 13 }}
            >
              Radera all data →
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--red-text)', marginBottom: 10, fontWeight: 500 }}>
                Är du säker? Det går inte att återställa.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ flex: 1 }}
                >
                  Avbryt
                </button>
                <button
                  className="btn-primary"
                  onClick={handleDeleteData}
                  disabled={deletingData}
                  style={{ flex: 1, background: 'var(--red-text)' }}
                >
                  {deletingData ? 'Raderar…' : 'Ja, radera'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          SkolAI · MVP v1.0 · Data lagras på svenska servrar.
          <br />Ditt namn och e-post skickas aldrig till AI-modellen.
        </p>

      </main>
      <BottomNav />
    </div>
  )
}
