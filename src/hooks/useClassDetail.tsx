import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface StudentInClass {
  studentProfileId: string
  email: string
  joinedAt: string
}

interface UseClassDetailValue {
  className: string | null
  subject: string | null
  joinCode: string | null
  students: StudentInClass[]
  loading: boolean
  error: string | null
  rotating: boolean
  rotateCode: () => Promise<void>
}

export function useClassDetail(classId: string | undefined): UseClassDetailValue {
  const [className, setClassName] = useState<string | null>(null)
  const [subject, setSubject] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentInClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rotating, setRotating] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!classId) return

    setLoading(true)
    setError(null)

    const { data: classRow, error: classError } = await supabase
      .from('classes')
      .select('name, subject')
      .eq('id', classId)
      .single()

    if (classError || !classRow) {
      setError('Kunde inte hämta klassen.')
      setLoading(false)
      return
    }

    const { data: codeData, error: codeError } = await supabase.rpc('get_active_join_code', {
      _class_id: classId,
    })

    const { data: studentData, error: studentError } = await supabase.rpc('get_class_students', {
      _class_id: classId,
    })

    if (codeError || studentError) {
      setError('Kunde inte hämta join-kod eller elevlista.')
      setLoading(false)
      return
    }

    setClassName(classRow.name)
    setSubject(classRow.subject)
    setJoinCode(codeData ?? null)
    setStudents(
      (studentData ?? []).map((row: any) => ({
        studentProfileId: row.student_profile_id,
        email: row.email,
        joinedAt: row.joined_at,
      }))
    )
    setLoading(false)
  }, [classId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function rotateCode() {
    if (!classId) return
    setRotating(true)
    const { data, error } = await supabase.rpc('rotate_join_code', { _class_id: classId })
    setRotating(false)

    if (!error && data) {
      setJoinCode(data)
    }
  }

  return { className, subject, joinCode, students, loading, error, rotating, rotateCode }
}
