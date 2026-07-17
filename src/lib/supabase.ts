import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast och tydligt i utveckling istallet for ett kryptiskt natverksfel senare.
  throw new Error(
    'Saknar VITE_SUPABASE_URL eller VITE_SUPABASE_ANON_KEY. Kopiera .env.example till .env och fyll i vardena fran Supabase-projektet.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Role = 'student' | 'teacher'

export interface School {
  id: string
  name: string
  municipality: string | null
}

// ─── Typer som api.ts och juni-sidorna beror pa ──────────────────────────────
// Dessa fanns i juni-versionen och forsvann i juli-omskrivningen, vilket kraschade
// varje sida som importerar api.ts ("does not provide an export named 'GradeGoal'").

export type GradeGoal = 'E' | 'C' | 'A'

export type SessionType = 'chat' | 'quiz' | 'flash' | 'write' | 'exam' | 'timer'

export interface StudentProfile {
  id: string
  user_id: string
  school_id: string | null
  username: string | null
  grade_goals: Record<string, GradeGoal>
  strengths: Record<string, string[]>
  weaknesses: Record<string, string[]>
  preferred_style: string | null
  streak: number
  streak_last_active: string | null
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  subject: string
  session_type: SessionType
  duration_seconds: number | null
  started_at: string
}

export interface Exam {
  id: string
  user_id: string
  subject: string
  exam_date: string
  grade_goal: GradeGoal
  created_at?: string
}

export interface StudyAlarm {
  id: string
  user_id: string
  subject: string
  time_of_day: string
  days_of_week: number[]
  duration_minutes: number
  active: boolean
  created_at: string
}
