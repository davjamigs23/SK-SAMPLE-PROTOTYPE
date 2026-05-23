/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SKDatabase, User, Participant, Program, Expense, ProgramParticipant, Registration, Feedback, AppNotification } from './types';

const STORAGE_KEY = 'sk_sf_pmms_db_v2';

// Pre-seeded users
export const SEED_USERS: User[] = [
  {
    id: 'user-admin-1',
    email: 'sksanfrancisconagacity@gmail.com',
    password: 'SKCHAIR',
    role: 'admin',
    is_approved: true,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z'
  }
];

// Pre-seeded participants (youth residents aged 15-30)
export const SEED_PARTICIPANTS: Participant[] = [];

// Pre-seeded SK programs in Brgy. San Francisco, Naga City
export const SEED_PROGRAMS: Program[] = [];

// Seeded Expenses corresponding to programs
export const SEED_EXPENSES: Expense[] = [];

// Pre-seeded program participants map (Junction)
export const SEED_PROGRAM_PARTICIPANTS: ProgramParticipant[] = [];

// Seeded audit-log registrations
export const SEED_REGISTRATIONS: Registration[] = [];

// Seeded program feedback submissions
export const SEED_FEEDBACKS: Feedback[] = [];

// Seeded notifications
export const SEED_NOTIFICATIONS: AppNotification[] = [];

// Initialize SKDatabase loaded state or default seed
export function getStoredDB(): SKDatabase {
  if (typeof window === 'undefined') {
    return {
      users: SEED_USERS,
      participants: SEED_PARTICIPANTS,
      programs: SEED_PROGRAMS,
      expenses: SEED_EXPENSES,
      program_participants: SEED_PROGRAM_PARTICIPANTS,
      registrations: SEED_REGISTRATIONS,
      feedbacks: SEED_FEEDBACKS,
      notifications: SEED_NOTIFICATIONS
    };
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load SK database, re-seeding...', e);
    }
  }

  const initialDB: SKDatabase = {
    users: SEED_USERS,
    participants: SEED_PARTICIPANTS,
    programs: SEED_PROGRAMS,
    expenses: SEED_EXPENSES,
    program_participants: SEED_PROGRAM_PARTICIPANTS,
    registrations: SEED_REGISTRATIONS,
    feedbacks: SEED_FEEDBACKS,
    notifications: SEED_NOTIFICATIONS
  };
  saveStoredDB(initialDB);
  return initialDB;
}

export function saveStoredDB(db: SKDatabase): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

// Support schemas exports SQL scripts helper
export const SCHEMAS_SQL_TEXT = `-- SQL Script for Supabase PostgreSQL
-- A Web-Based Program and Participant Management System
-- Barangay San Francisco, Naga City, Camarines Sur

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'regular' CHECK (role IN ('admin', 'skofficial', 'regular', 'viewer')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: participants
CREATE TABLE IF NOT EXISTS public.participants (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER CHECK (age >= 10 AND age <= 100),
    contact TEXT,
    email TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: programs
CREATE TABLE IF NOT EXISTS public.programs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TEXT,
    location TEXT,
    budget DECIMAL(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed')),
    file_urls TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Food', 'Supplies', 'Transport', 'Honorarium', 'Other')),
    recorded_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: program_participants (junction)
CREATE TABLE IF NOT EXISTS public.program_participants (
    program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE,
    participant_id BIGINT REFERENCES public.participants(id) ON DELETE CASCADE,
    registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected')),
    attendance_status TEXT DEFAULT 'absent' CHECK (attendance_status IN ('present', 'absent', 'excused')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (program_id, participant_id)
);

-- Table: registrations (workflow log)
CREATE TABLE IF NOT EXISTS public.registrations (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    participant_id BIGINT REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Table: feedback
CREATE TABLE IF NOT EXISTS public.feedback (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    participant_id BIGINT REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeces for performance
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_date ON public.programs(date);
CREATE INDEX IF NOT EXISTS idx_expenses_program ON public.expenses(program_id);
CREATE INDEX IF NOT EXISTS idx_registrations_program ON public.registrations(program_id);
CREATE INDEX IF NOT EXISTS idx_feedback_program ON public.feedback(program_id);

-- Enable RLS and define basic secure policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Simple Select Policies (Read access)
CREATE POLICY "Users can view their own profile/info" ON public.users 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins/Officials full access to users" ON public.users 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'skofficial')
        )
    );

CREATE POLICY "Public programs readable by all authenticated users" ON public.programs 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins/Officials full write programs" ON public.programs 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'skofficial')
        )
    );
`;
