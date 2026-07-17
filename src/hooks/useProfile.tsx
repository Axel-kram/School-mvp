import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { GradeGoal, StudentProfile as StudentProfileRow } from '../lib/supabase'
import { useAuth } from './useAuth'

// Fast amneslista. Lararens fritextfalt for amne mot elevens fraga matchas
// pa strang i build-ai-context — "Matte 2b" mot "Matematik" ger ingen traff och
// da tappas lararmaterialet TYST. Darfor ska bada sidor valja ur samma lista.
export const SUBJECTS = [
  'Matematik',
  'Svenska',
  'Engelska',
  'Historia',
  'Samhällskunskap',
  'Religionskunskap',
  'Naturkunskap',
  'Fysik',
  'Kemi',
  'Biologi',
  'Psykologi',
  'Filosofi',
  'Företagsekonomi',
  'Idrott och hälsa',
  'Moderna språk',
] as const

export interface ClassInfo {
  id: string
  name: string
  subject: string | null
}

export interface StudentProfile {
  id: string
  username: string | null
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
  // Juli-formen: Dashboard, Profil, TopBar
  profile: StudentProfile | null
  loading: boolean
  error: string | null
  joinClass: (code: string) => Promise<JoinClassResult>
  refetch: () => Promise<void>

  // Juni-formen: Chat, Quiz, Flashcards, Writing, Exam, Timer
  studentProfile: StudentProfileRow | null
  gradeGoals: Record<string, GradeGoal>
  currentSubject: string
  setCurrentSubject: (subject: string) => void
  subjects: string[]
}

const ProfileContext = createContext<UseProfileValue | undefined>(undefined)

// Context, inte en vanlig hook. Tidigare gjorde varje komponent som anropade
// useProfile() sin EGEN hamtning och hade sin EGEN state — darfor kunde
// dashboarden aldrig tala om for chatten vilket amne eleven valt, och darfor
// sags samma anrop dubbelt i Network-fliken.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSubject, setCurrentSubject] = useState<string>('')

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setStudentProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: profileRow, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileRow) {
      setError('Kunde inte hämta din profil. Kontakta support.')
      setLoading(false)
      return
    }

    setStudentProfile(profileRow as StudentProfileRow)

    const { data: schoolRow } = profileRow.school_id
      ? await supabase.from('schools').select('name').eq('id', profileRow.school_id).single()
      : { data: null }

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
      username: profileRow.username ?? null,
      schoolId: profileRow.school_id,
      schoolName: schoolRow?.name ?? null,
      streak: profileRow.streak ?? 0,
      streakLastActive: profileRow.streak_last_active ?? null,
      classes,
    })

    // Valj forsta amnet automatiskt om inget valts an, sa att chatt/quiz
    // aldrig startar utan amne.
    setCurrentSubject((prev) => {
      if (prev) return prev
      const firstWithSubject = classes.find((c) => c.subject)
      return firstWithSubject?.subject ?? ''
    })

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const joinClass = useCallback(
    async (code: string): Promise<JoinClassResult> => {
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
    },
    [fetchProfile]
  )

  const subjects = useMemo(
    () =>
      Array.from(
        new Set((profile?.classes ?? []).map((c) => c.subject).filter((s): s is string => !!s))
      ),
    [profile]
  )

  const gradeGoals = (studentProfile?.grade_goals ?? {}) as Record<string, GradeGoal>

  const value: UseProfileValue = {
    profile,
    loading,
    error,
    joinClass,
    refetch: fetchProfile,
    studentProfile,
    gradeGoals,
    currentSubject,
    setCurrentSubject,
    subjects,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile(): UseProfileValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile måste användas inom en <ProfileProvider>')
  return ctx
}
