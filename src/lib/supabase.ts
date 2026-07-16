import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast och tydligt i utveckling istället för ett kryptiskt nätverksfel senare.
  throw new Error(
    'Saknar VITE_SUPABASE_URL eller VITE_SUPABASE_ANON_KEY. Kopiera .env.example till .env och fyll i värdena från Supabase-projektet.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Role = 'student' | 'teacher'

export interface School {
  id: string
  name: string
  municipality: string | null
}
