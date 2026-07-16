import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTeacherClasses } from '../hooks/useTeacherClasses'

export function TeacherDashboardPage() {
  const { classes, loading, error, createClass } = useTeacherClasses()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    const result = await createClass(name, subject)
    setSubmitting(false)

    if (result.error) {
      setFormError(result.error)
      return
    }

    setName('')
    setSubject('')
    setShowForm(false)
  }

  if (loading) {
    return <p>Laddar dina klasser…</p>
  }

  return (
    <div className="teacher-page">
      <h1>Dina klasser</h1>

      {error && <p className="auth-error">{error}</p>}

      <section>
        {classes.length ? (
          <ul>
            {classes.map((c) => (
              <li key={c.id}>
                <Link to={'/class/' + c.id} className="class-link">
                  {c.name}
                  {c.subject ? ' — ' + c.subject : ''}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Du har inte skapat några klasser än.</p>
        )}
      </section>

      <section>
        {!showForm ? (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Skapa ny klass
          </button>
        ) : (
          <form onSubmit={handleCreate} className="create-class-form">
            <div className="field">
              <label className="field-label" htmlFor="class-name">Klassnamn</label>
              <input
                id="class-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="T.ex. NA22b"
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="class-subject">Ämne</label>
              <input
                id="class-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="T.ex. Matematik 2b"
              />
            </div>
            {formError && <p className="auth-error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Skapar…' : 'Skapa klass'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Avbryt
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
