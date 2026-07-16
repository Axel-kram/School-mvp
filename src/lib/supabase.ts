import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ────────────────────────────────────────────────────────────────────

export type GradeGoal = 'E' | 'C' | 'A'

export interface StudentProfile {
  id: string
  user_id: string
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
  session_type: 'chat' | 'quiz' | 'write' | 'flash' | 'exam'
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface WritingTask {
  id: string
  user_id: string
  subject: string
  prompt: string
  student_text: string
  feedback_content: string | null
  feedback_structure: string | null
  feedback_language: string | null
  created_at: string
}

export interface StudyAlarm {
  id: string
  user_id: string
  subject: string
  days_of_week: number[]
  time_of_day: string
  duration_minutes: number
  active: boolean
  created_at: string
}

export interface Exam {
  id: string
  user_id: string
  subject: string
  exam_date: string
  grade_goal: GradeGoal
  created_at: string
}

export interface FlashcardResult {
  id: string
  user_id: string
  subject: string
  card_front: string
  card_back: string
  knew: boolean
  created_at: string
}

export interface StudyAlarm {
  id: string
  user_id: string
  time_of_day: string
  days_of_week: number[]
  subject: string
  active: boolean
  created_at: string
}
