import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, loading, error, gradeGoals } = useProfile()

  return (
    <div className="student-layout">
      <TopBar showSubjects={false} title="Min profil" />
      <main className="student-content">
        {loading && <p>Laddar profil…</p>}
        {error && <p className="auth-error">{error}</p>}

        {!loading && !error && (
          <div className="profile-page">
            <section>
              <h2>Grunduppgifter</h2>
              <p>E-post: {user?.email}</p>
            </section>

            <section>
              <h2>Skola</h2>
              <p>{profile?.schoolName ?? 'Okänd skola'}</p>
            </section>

            <section>
              <h2>Mina klasser</h2>
              {profile?.classes.length ? (
                <ul>
                  {profile.classes.map((c) => (
                    <li key={c.id}>
                      {c.name}
                      {c.subject ? ' — ' + c.subject : ''}
                      {c.subject && gradeGoals[c.subject] ? ` (mål: ${gradeGoals[c.subject]})` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Inga klasser än.</p>
              )}
            </section>

            <section>
              <h2>Streak</h2>
              <p>🔥 {profile?.streak ?? 0}</p>
            </section>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
