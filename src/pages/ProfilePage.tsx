import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, loading, error } = useProfile()

  if (loading) {
    return <p>Laddar profil…</p>
  }

  if (error) {
    return <p className="auth-error">{error}</p>
  }

  return (
    <div className="profile-page">
      <h1>Min profil</h1>

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
              </li>
            ))}
          </ul>
        ) : (
          <p>Inga klasser än.</p>
        )}
      </section>
    </div>
  )
}
