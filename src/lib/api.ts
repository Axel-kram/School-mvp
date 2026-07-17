import { supabase } from './supabase'
// Typ-import maste vara separat. GradeGoal, StudentProfile m.fl. ar interfaces
// som forsvinner vid kompilering — en vanlig import av dem far webblasaren att
// leta efter en export som inte finns vid korning:
//   "does not provide an export named 'StudyAlarm'"
import type { GradeGoal, StudentProfile, StudySession, Exam, StudyAlarm } from './supabase'

const N8N_BASE = import.meta.env.VITE_N8N_WEBHOOK_BASE as string

// ─── Helper ───────────────────────────────────────────────────────────────────

async function callEdgeFunction(name: string, body: object) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) throw new Error(error.message)
  return data
}

async function callN8N(webhook: string, body: object) {
  const res = await fetch(`${N8N_BASE}/${webhook}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`n8n error: ${res.status}`)
  return res.json()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  signInWithEmail: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUpWithEmail: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),

  resetPassword: (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profile = {
  get: async (): Promise<StudentProfile | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    return data
  },

  upsert: async (gradeGoals: Record<string, GradeGoal>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('student_profiles')
      .upsert({ user_id: user.id, grade_goals: gradeGoals, updated_at: new Date().toISOString() })
    if (error) throw error
  },

  updateStreakIfNeeded: async () => callEdgeFunction('update-streak', {}),

  // Uppdatera adaptiv profil efter en avslutad session
  updateAdaptiveProfile: async (subject: string, sessionType: 'quiz' | 'flashcards' | 'writing') =>
    callEdgeFunction('update-profile', { subject, session_type: sessionType }),

  // Hämta anonym AI-kontext (för n8n-flöden som inte redan anropar build-ai-context direkt)
  getAIContext: async (subject: string) =>
    callEdgeFunction('build-ai-context', { subject }),
}

// ─── Study Sessions ───────────────────────────────────────────────────────────

export const sessions = {
  start: async (subject: string, sessionType: StudySession['session_type']): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({ user_id: user.id, subject, session_type: sessionType, started_at: new Date().toISOString() })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  },

  end: async (sessionId: string, durationSeconds: number) => {
    const { error } = await supabase
      .from('study_sessions')
      .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
      .eq('id', sessionId)
    if (error) throw error
  },

  getThisWeek: async (): Promise<StudySession[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', weekAgo.toISOString())
      .order('started_at', { ascending: false })
    return data ?? []
  },

  getTodayDuration: async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('study_sessions')
      .select('duration_seconds')
      .eq('user_id', user.id)
      .gte('started_at', today.toISOString())
    return (data ?? []).reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
  },
}

// ─── AI — Quiz ────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string
  options: string[]
  correct_index: number
  explanation: string
  tip?: string
}

export const quiz = {
  generate: async (subject: string, gradeGoal: GradeGoal, weaknesses: string[]): Promise<QuizQuestion[]> => {
    return callN8N('generate-quiz', { subject, grade_goal: gradeGoal, weaknesses })
  },

  saveResult: async (subject: string, correct: boolean, questionText: string) => {
    const result = await callEdgeFunction('save-quiz-result', { subject, correct, question_text: questionText })
    // Uppdatera adaptiv profil asynkront — vänta inte på svar
    callEdgeFunction('update-profile', { subject, session_type: 'quiz' }).catch(() => {})
    return result
  },
}

// ─── AI — Flashcards ──────────────────────────────────────────────────────────

export interface Flashcard {
  front: string
  back: string
}

export const flashcards = {
  generate: async (subject: string, gradeGoal: GradeGoal): Promise<Flashcard[]> => {
    return callN8N('generate-flashcards', { subject, grade_goal: gradeGoal })
  },

  saveResult: async (subject: string, cardFront: string, cardBack: string, knew: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('flashcard_results').insert({
      user_id: user.id, subject, card_front: cardFront, card_back: cardBack, knew,
    })
    // Uppdatera adaptiv profil asynkront efter varje flashcard-svar
    callEdgeFunction('update-profile', { subject, session_type: 'flashcards' }).catch(() => {})
  },
}

// ─── AI — Writing ─────────────────────────────────────────────────────────────

export interface WritingPromptResult {
  prompt: string
  hint: string
}

export interface WritingFeedback {
  feedback_content: string
  feedback_structure: string
  feedback_language: string
  challenge?: string
}

export const writing = {
  getPrompt: async (subject: string, gradeGoal: GradeGoal): Promise<WritingPromptResult> => {
    return callN8N('generate-writing-prompt', { subject, grade_goal: gradeGoal })
  },

  getFeedback: async (subject: string, gradeGoal: GradeGoal, prompt: string, studentText: string): Promise<WritingFeedback> => {
    return callN8N('writing-feedback', { subject, grade_goal: gradeGoal, prompt, student_text: studentText })
  },

  save: async (subject: string, prompt: string, studentText: string, feedback: WritingFeedback) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('writing_tasks').insert({
      user_id: user.id, subject, prompt, student_text: studentText,
      feedback_content: feedback.feedback_content,
      feedback_structure: feedback.feedback_structure,
      feedback_language: feedback.feedback_language,
    })
    // Uppdatera adaptiv profil baserat på skrivfeedback
    callEdgeFunction('update-profile', { subject, session_type: 'writing' }).catch(() => {})
  },
}

// ─── AI — Exam Questions ──────────────────────────────────────────────────────

export interface ExamQuestion {
  question: string
  context?: string
  model_answer: string
  grade_criteria: { E: string; C: string; A: string }
}

export interface ExamAnswerFeedback {
  grade: GradeGoal
  feedback: string
  improvements: string[]
}

export const examQuestions = {
  generate: async (subject: string, gradeGoal: GradeGoal): Promise<ExamQuestion[]> => {
    return callN8N('generate-exam-questions', { subject, grade_goal: gradeGoal })
  },

  grade: async (subject: string, question: string, studentAnswer: string, gradeGoal: GradeGoal): Promise<ExamAnswerFeedback> => {
    return callN8N('grade-exam-answer', { subject, question, student_answer: studentAnswer, grade_goal: gradeGoal })
  },
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMsg { role: 'user' | 'assistant'; content: string }

export const chat = {
  send: async (
    sessionId: string,
    subject: string,
    gradeGoal: GradeGoal,
    messages: ChatMsg[],
    strengths: string[],
    weaknesses: string[],
  ): Promise<string> => {
    const data = await callN8N('chat', {
      session_id: sessionId,
      subject,
      grade_goal: gradeGoal,
      messages,
      strengths,
      weaknesses,
    })
    return data.reply as string
  },

  saveMessage: async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('chat_messages').insert({ session_id: sessionId, user_id: user.id, role, content })
  },
}

// ─── Exams (provplanering) ────────────────────────────────────────────────────

export const exams = {
  getAll: async (): Promise<Exam[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user.id)
      .order('exam_date', { ascending: true })
    return data ?? []
  },

  add: async (subject: string, examDate: string, gradeGoal: GradeGoal) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('exams')
      .insert({ user_id: user.id, subject, exam_date: examDate, grade_goal: gradeGoal })
    if (error) throw error
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── Alarms ───────────────────────────────────────────────────────────────────

export type { StudyAlarm }

export const alarms = {
  getAll: async (): Promise<StudyAlarm[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
      .from('study_alarms')
      .select('*')
      .eq('user_id', user.id)
      .order('time_of_day')
    return data ?? []
  },

  add: async (alarm: Omit<StudyAlarm, 'id' | 'user_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase.from('study_alarms').insert({ ...alarm, user_id: user.id })
    if (error) throw error
  },

  toggle: async (id: string, active: boolean) => {
    const { error } = await supabase.from('study_alarms').update({ active }).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('study_alarms').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── Dashboard intelligence ───────────────────────────────────────────────────

export const dashboard = {
  getSuggestions: async () => callEdgeFunction('dashboard-suggestions', {}),
  getStatusMessages: async () => callEdgeFunction('status-messages', {}),
}

// ─── Delete all user data (GDPR) ──────────────────────────────────────────────

export const gdpr = {
  deleteAllData: async () => callEdgeFunction('delete-user-data', {}),
}
