import { useParams } from 'react-router-dom'
import { useClassDetail } from '../hooks/useClassDetail'

export function TeacherClassPage() {
  const { classId } = useParams<{ classId: string }>()
  const { className, subject, joinCode, students, loading, error, rotating, rotateCode } =
    useClassDetail(classId)

  if (loading) {
    return <p>Laddar klassen…</p>
  }

  if (error) {
    return <p className="auth-error">{error}</p>
  }

  return (
    <div className="teacher-page">
      <h1>
        {className}
        {subject ? ' — ' + subject : ''}
      </h1>

      <section>
        <h2>Join-kod</h2>
        <div className="join-code-display">{joinCode ?? '—'}</div>
        <button className="btn-secondary" onClick={rotateCode} disabled={rotating}>
          {rotating ? 'Skapar ny kod…' : 'Skapa ny kod'}
        </button>
      </section>

      <section>
        <h2>Elever ({students.length})</h2>
        {students.length ? (
          <ul>
            {students.map((s) => (
              <li key={s.studentProfileId}>{s.email}</li>
            ))}
          </ul>
        ) : (
          <p>Inga elever har gått med än.</p>
        )}
      </section>
    </div>
  )
}
