import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { School } from '../lib/supabase'

interface SchoolSelectProps {
  value: string | null
  onChange: (schoolId: string) => void
}

export function SchoolSelect({ value, onChange }: SchoolSelectProps) {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newMunicipality, setNewMunicipality] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [creatingLoading, setCreatingLoading] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('schools')
      .select('id, name, municipality')
      .order('name')
      .then(({ data }) => {
        if (active) {
          setSchools(data ?? [])
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return schools
    return schools.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.municipality ?? '').toLowerCase().includes(q)
    )
  }, [search, schools])

  async function handleCreateSchool() {
    setCreateError(null)
    if (newName.trim().length < 2) {
      setCreateError('Ange skolans fullständiga namn.')
      return
    }
    setCreatingLoading(true)
    const { data, error } = await supabase
      .from('schools')
      .insert({ name: newName.trim(), municipality: newMunicipality.trim() || null })
      .select('id, name, municipality')
      .single()
    setCreatingLoading(false)

    if (error || !data) {
      setCreateError('Kunde inte skapa skolan: ' + (error?.message ?? 'okänt fel'))
      return
    }

    setSchools((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    onChange(data.id)
    setCreating(false)
    setNewName('')
    setNewMunicipality('')
  }

  if (creating) {
    return (
      <div className="school-create">
        <label className="field-label" htmlFor="new-school-name">
          Skolans namn
        </label>
        <input
          id="new-school-name"
          type="text"
          placeholder="T.ex. Umeå Gymnasieskola"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <label className="field-label" htmlFor="new-school-municipality">
          Kommun (valfritt)
        </label>
        <input
          id="new-school-municipality"
          type="text"
          placeholder="T.ex. Umeå"
          value={newMunicipality}
          onChange={(e) => setNewMunicipality(e.target.value)}
        />
        {createError && <p className="field-error">{createError}</p>}
        <div className="school-create-actions">
          <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
            Avbryt
          </button>
          <button type="button" className="btn-primary" disabled={creatingLoading} onClick={handleCreateSchool}>
            {creatingLoading ? 'Skapar…' : 'Skapa skola'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="school-select">
      <label className="field-label" htmlFor="school-search">
        Skola
      </label>
      <input
        id="school-search"
        type="text"
        placeholder={loading ? 'Laddar skolor…' : 'Sök din skola…'}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={loading}
        autoComplete="off"
      />
      <div className="school-list" role="listbox">
        {!loading && filtered.length === 0 && (
          <p className="school-empty">Ingen skola matchar sökningen.</p>
        )}
        {filtered.map((school) => (
          <button
            type="button"
            key={school.id}
            role="option"
            aria-selected={value === school.id}
            className={'school-option' + (value === school.id ? ' school-option-selected' : '')}
            onClick={() => onChange(school.id)}
          >
            <span>{school.name}</span>
            {school.municipality && <span className="school-municipality">{school.municipality}</span>}
          </button>
        ))}
      </div>
      <button type="button" className="btn-link" onClick={() => setCreating(true)}>
        Min skola finns inte i listan
      </button>
    </div>
  )
}
