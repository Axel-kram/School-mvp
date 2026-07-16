import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface ClassInfo {
  id: string
  name: string
  subject: string | null
}

export interface StudentProfile {
  id: string
  schoolId: string
  schoolName: string | null
  streak: number
  streakLastActive: string | null
  classes: ClassInfo[]
}

interface JoinClassResult {
  error: string | null
  alreadyMember?: boolean
}

interface UseProfileValue {
  profile: StudentProfile | null
  loading: boolean
  error: string | null
  joinClass: (code: string) => Promise<JoinClassResult>
  refetch: () => Promise<void>
}

export function useProfile(): UseProfileValue {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: profileRow, error: profileError } = await supabase
      .from('student_profiles')
      .select('id, school_id, streak, streak_last_active')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileRow) {
      setError('Kunde inte hämta din profil. Kontakta support.')
      setLoading(false)
      return
    }

    const { data: schoolRow } = await supabase
      .from('schools')
      .select('name')
      .eq('id', profileRow.school_id)
      .single()

    const { data: membershipRows, error: membershipError } = await supabase
      .from('student_class_memberships')
      .select('classes ( id, name, subject )')
      .eq('student_id', profileRow.id)

    if (membershipError) {
      setError('Kunde inte hämta dina klasser.')
      setLoading(false)
      return
    }

    const classes: ClassInfo[] = (membershipRows ?? [])
      .map((row: any) => row.classes)
      .filter(Boolean)

    setProfile({
      id: profileRow.id,
      schoolId: profileRow.school_id,
      schoolName: schoolRow?.name ?? null,
      streak: profileRow.streak ?? 0,
      streakLastActive: profileRow.streak_last_active ?? null,
      classes,
    })
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  async function joinClass(code: string): Promise<JoinClassResult> {
    const trimmedCode = code.trim()
    if (!trimmedCode) {
      return { error: 'Fyll i en klasskod.' }
    }

    const { data, error } = await supabase.rpc('join_class_by_code', { _code: trimmedCode })

    if (error || !data || !data[0]) {
      return { error: 'Något gick fel: ' + (error?.message ?? 'okänt fel') }
    }

    const result = data[0].result

    if (result === 'invalid_code') {
      return { error: 'Ogiltig eller inaktiv kod. Kontrollera att du skrivit rätt.' }
    }
    if (result === 'wrong_school') {
      return { error: 'Den koden tillhör en klass på en annan skola.' }
    }
    if (result === 'no_profile') {
      return { error: 'Din profil kunde inte hittas. Kontakta support.' }
    }
    if (result === 'already_member') {
      await fetchProfile()
      return { error: null, alreadyMember: true }
    }

    await fetchProfile()
    return { error: null }
  }

  return { profile, loading, error, joinClass, refetch: fetchProfile }
}
