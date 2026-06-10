# SkolAI — Frontend

React + TypeScript + Vite · Supabase Auth · n8n AI-flöden

## Kom igång

### 1. Installera beroenden
```bash
npm install
```

### 2. Miljövariabler
Kopiera `.env.example` till `.env` och fyll i dina värden:
```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://ditt-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-nyckel
VITE_N8N_WEBHOOK_BASE=https://din-n8n-instans.se/webhook
```

### 3. Starta dev-server
```bash
npm run dev
```

### 4. Bygg för produktion
```bash
npm run build
```

---

## Projektstruktur

```
src/
├── lib/
│   ├── supabase.ts        # Supabase-klient + alla typer
│   └── api.ts             # Alla API-anrop (auth, sessions, AI, larm, prov)
├── hooks/
│   ├── useAuth.tsx        # AuthContext + AuthProvider
│   ├── useDarkMode.tsx    # DarkModeContext
│   └── useProfile.tsx     # ProfileContext (betygsmål, streak, ämne)
├── components/
│   ├── TopBar.tsx         # Topbar med streak, ämnesval, darkmode
│   └── BottomNav.tsx      # Navigeringsbar
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── QuizPage.tsx
│   ├── FlashcardsPage.tsx
│   ├── WritingPage.tsx
│   ├── ExamPage.tsx
│   ├── ChatPage.tsx
│   ├── TimerPage.tsx
│   ├── AlarmsPage.tsx
│   ├── AddAlarmPage.tsx
│   ├── ProfilePage.tsx
│   ├── ExamsPage.tsx
│   └── AddExamPage.tsx
├── App.tsx                # Routing + auth guard
├── main.tsx               # Entry point
└── index.css              # Global styles + CSS-variabler
```

---

## Supabase — tabeller som behövs

Skapa dessa tabeller i Supabase (SQL Editor):

```sql
-- Elevprofil
create table student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  grade_goals jsonb default '{}',
  strengths jsonb default '{}',
  weaknesses jsonb default '{}',
  preferred_style text,
  streak int default 0,
  streak_last_active date,
  updated_at timestamptz default now()
);

-- Studiesessioner
create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  subject text not null,
  session_type text not null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds int
);

-- Chattar
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid,
  user_id uuid references auth.users not null,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Skrivuppgifter
create table writing_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  subject text not null,
  prompt text not null,
  student_text text not null,
  feedback_content text,
  feedback_structure text,
  feedback_language text,
  created_at timestamptz default now()
);

-- Plugglarm
create table study_alarms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  subject text not null,
  days_of_week int[] not null,
  time_of_day time not null,
  duration_minutes int not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Prov
create table exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  subject text not null,
  exam_date date not null,
  grade_goal text not null,
  created_at timestamptz default now()
);

-- Flashcard-resultat
create table flashcard_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  subject text not null,
  card_front text not null,
  card_back text not null,
  knew boolean not null,
  created_at timestamptz default now()
);
```

Aktivera RLS på alla tabeller och lägg till policy:
```sql
-- Exempel för student_profiles (upprepa för alla tabeller)
alter table student_profiles enable row level security;
create policy "Users can only access own data"
  on student_profiles for all
  using (auth.uid() = user_id);
```

---

## Microsoft SSO

1. Registrera appen i Azure Portal som en ny App Registration
2. Lägg till redirect URI: `https://ditt-projekt.supabase.co/auth/v1/callback`
3. Aktivera Azure-providern i Supabase Dashboard → Authentication → Providers
4. Klistra in Client ID och Client Secret från Azure

---

## Deployment (Vercel)

```bash
# Koppla till Vercel
npx vercel

# Lägg till env-variabler i Vercel Dashboard
# Varje push till main deployar automatiskt
```
