import React, { createContext, useContext, useEffect, useState } from 'react'
import { GradeGoal, StudentProfile } from '../lib/supabase'
import { profile as profileApi } from '../lib/api'
import { useAuth } from './useAuth'

export const SUBJECTS = [
  'Matematik', 'Svenska', 'Historia', 'Engelska',
  'Kemi', 'Fysik', 'Biologi', 'Samhällskunskap',
]

interface ProfileContextType {
  studentProfile: StudentProfile | null
  gradeGoals: Record<string, GradeGoal>
  currentSubject: string
  setCurrentSubject: (s: string) => void
  setGradeGoal: (subject: string, goal: GradeGoal) => Promise<void>
  streak: number
  subjects: string[]
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType>({
  studentProfile: null, gradeGoals: {}, currentSubject: 'Matematik',
  setCurrentSubject: () => {}, setGradeGoal: async () => {},
  streak: 0, subjects: SUBJECTS, refreshProfile: async () => {},
})

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [currentSubject, setCurrentSubject] = useState('Matematik')

  const refreshProfile = async () => {
    if (!user) return
    const p = await profileApi.get()
    setStudentProfile(p)
  }

  useEffect(() => { if (user) refreshProfile() }, [user])

  const gradeGoals = studentProfile?.grade_goals ?? {}

  const setGradeGoal = async (subject: string, goal: GradeGoal) => {
    const updated = { ...gradeGoals, [subject]: goal }
    await profileApi.upsert(updated)
    await refreshProfile()
  }

  return (
    <ProfileContext.Provider value={{
      studentProfile, gradeGoals, currentSubject, setCurrentSubject,
      setGradeGoal, streak: studentProfile?.streak ?? 0,
      subjects: SUBJECTS, refreshProfile,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)
