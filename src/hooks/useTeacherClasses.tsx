import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface TeacherClassInfo {
  id: string
  name: string
  subject: string | null
}

interface CreateClassResult {
  error: string | null
  classId?: string
}

interface UseTeacherClassesValue {
  classes: TeacherClassInfo[]
  loading: boolean
  error: string | null
  createClass: (name: string, subject: string) => Promise<CreateClassResult>
  refetch: () => Promise<void>
}

export function useTeacherClasses(): UseTeacherClassesValue {
  const { user } = useAuth()
  const [classes, setClasses] = useState<TeacherClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = useCallback(async () => {
    if (!user) {
      setClasses([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: teacherRow, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacherRow) {
      setError('Kunde inte hämta din lärarprofil.')
      setLoading(false)
      return
    }

    const { data: classRows, error: classError } = await supabase
      .from('classes')
      .select('id, name, subject')
      .eq('teacher_id', teacherRow.id)
      .order('created_at', { ascending: false })

    if (classError) {
      setError('Kunde inte hämta dina klasser.')
      setLoading(false)
      return
    }

    setClasses(classRows ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  async function createClass(name: string, subject: string): Promise<CreateClassResult> {
    if (!name.trim()) {
      return { error: 'Fyll i ett klassnamn.' }
    }
    if (!subject.trim()) {
      return { error: 'Fyll i ett ämne.' }
    }

    const { data, error } = await supabase.rpc('create_class', {
      _name: name.trim(),
      _subject: subject.trim(),
    })

    if (error || !data || !data[0]) {
      return { error: 'Kunde inte skapa klassen: ' + (error?.message ?? 'okänt fel') }
    }

    await fetchClasses()
    return { error: null, classId: data[0].class_id }
  }

  return { classes, loading, error, createClass, refetch: fetchClasses }
}
