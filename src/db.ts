/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SKDatabase, User, Participant, Program, Expense, ProgramParticipant, Registration, Feedback, AppNotification } from './types';

const STORAGE_KEY = 'sk_sf_pmms_db_v1';

// Pre-seeded users
export const SEED_USERS: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@sanfrancisco.gov',
    role: 'admin',
    is_approved: true,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-skofficial-1',
    email: 'skofficial@sanfrancisco.gov',
    role: 'skofficial',
    is_approved: true,
    created_at: '2026-01-12T09:30:00Z',
    updated_at: '2026-01-12T09:30:00Z'
  },
  {
    id: 'user-regular-1',
    email: 'regular@sanfrancisco.gov',
    role: 'regular',
    is_approved: true,
    created_at: '2026-01-15T14:20:00Z',
    updated_at: '2026-01-15T14:20:00Z'
  },
  {
    id: 'user-regular-2',
    email: 'ma.cristina@gmail.com',
    role: 'regular',
    is_approved: true,
    created_at: '2026-02-01T10:15:00Z',
    updated_at: '2026-02-01T10:15:00Z'
  },
  {
    id: 'user-regular-3',
    email: 'joshua.villafuerte@outlook.com',
    role: 'regular',
    is_approved: false, // Pending Approval
    created_at: '2026-05-23T10:00:00Z',
    updated_at: '2026-05-23T10:00:00Z'
  },
  {
    id: 'user-viewer-1',
    email: 'viewer@sanfrancisco.gov',
    role: 'viewer',
    is_approved: true,
    created_at: '2026-01-20T16:45:00Z',
    updated_at: '2026-01-20T16:45:00Z'
  }
];

// Pre-seeded participants (youth residents aged 15-30)
export const SEED_PARTICIPANTS: Participant[] = [
  {
    id: 1,
    user_id: 'user-regular-1',
    first_name: 'John Mark',
    last_name: 'San Jose',
    age: 21,
    contact: '+63 917 123 4567',
    email: 'regular@sanfrancisco.gov',
    address: 'Zone 2, Barangay San Francisco, Naga City',
    created_at: '2026-01-15T14:22:00Z',
    updated_at: '2026-01-15T14:22:00Z'
  },
  {
    id: 2,
    user_id: 'user-regular-2',
    first_name: 'Maria Cristina',
    last_name: 'Almeda',
    age: 19,
    contact: '+63 920 987 6543',
    email: 'ma.cristina@gmail.com',
    address: 'Zone 4, Barangay San Francisco, Naga City',
    created_at: '2026-02-01T10:18:00Z',
    updated_at: '2026-02-01T10:18:00Z'
  },
  {
    id: 3,
    user_id: 'user-regular-3',
    first_name: 'Joshua',
    last_name: 'Villafuerte',
    age: 24,
    contact: '+63 908 555 1234',
    email: 'joshua.villafuerte@outlook.com',
    address: 'Zone 1, Barangay San Francisco, Naga City',
    created_at: '2026-05-23T10:05:00Z',
    updated_at: '2026-05-23T10:05:00Z'
  },
  {
    id: 4,
    user_id: 'user-admin-1', // Admin can register as a participant if desired, or let's say a local citizen with no active user_id
    first_name: 'Dianne Rose',
    last_name: 'Ignacio',
    age: 18,
    contact: '+63 915 222 3344',
    email: 'dianne.rose@gmail.com',
    address: 'Zone 3, Barangay San Francisco, Naga City',
    created_at: '2026-01-22T11:00:00Z',
    updated_at: '2026-01-22T11:00:00Z'
  },
  {
    id: 5,
    user_id: '', // Added manually by admin
    first_name: 'Christian Paul',
    last_name: 'Peña',
    age: 26,
    contact: '+63 945 888 7766',
    email: 'cp.pena@yahoo.com',
    address: 'Zone 5, Barangay San Francisco, Naga City',
    created_at: '2026-02-14T09:00:00Z',
    updated_at: '2026-02-14T09:00:00Z'
  }
];

// Pre-seeded SK programs in Brgy. San Francisco, Naga City
export const SEED_PROGRAMS: Program[] = [
  {
    id: 1,
    name: 'San Francisco Summer Youth Games',
    description: 'Annual multi-sport sports tournament for barangay youth to promote camaraderie, wellness, and healthy competition.',
    date: '2026-04-12',
    time: '08:00 AM',
    location: 'Barangay San Francisco Covered Court',
    budget: 120000,
    status: 'completed',
    file_urls: ['/files/summer_games_guidelines.pdf', '/files/summer_games_sched.xlsx'],
    created_by: 'user-admin-1',
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-04-13T17:00:00Z'
  },
  {
    id: 2,
    name: 'Eco-Basura Swap: Trash-to-Rice Program',
    description: 'Youth-led ecological clean-up mobilization where residents swap recyclable waste and non-biodegradables for rice bags.',
    date: '2026-05-15',
    time: '07:00 AM - 04:00 PM',
    location: 'Barangay Hall Multi-Purpose Plaza',
    budget: 65000,
    status: 'ongoing',
    file_urls: ['/files/eco_swap_flyer.jpg'],
    created_by: 'user-admin-1',
    created_at: '2026-04-10T10:00:00Z',
    updated_at: '2026-05-15T08:00:00Z'
  },
  {
    id: 3,
    name: 'Sining Kabataan: Public Mural & Art Initiative',
    description: 'Transforming public street walls into youth-painted murals exploring local Bikol history and carbon-neutral visions.',
    date: '2026-06-10',
    time: '09:00 AM',
    location: 'Penafrancia Avenue Public Walkways',
    budget: 25000,
    status: 'planned',
    file_urls: [],
    created_by: 'user-skofficial-1',
    created_at: '2026-05-18T14:30:00Z',
    updated_at: '2026-05-18T14:30:00Z'
  },
  {
    id: 4,
    name: 'Technical Literacy & Frontend Development Workshop',
    description: 'An introductory coding bootcamp covering HTML, CSS, React, and Git basics for out-of-school youth in Naga City.',
    date: '2026-06-25',
    time: '01:00 PM - 05:00 PM',
    location: 'San Francisco Information Technology Hub',
    budget: 50000,
    status: 'planned',
    file_urls: ['/files/coding_curriculum.docx'],
    created_by: 'user-admin-1',
    created_at: '2026-05-20T11:00:00Z',
    updated_at: '2026-05-20T11:00:00Z'
  },
  {
    id: 5,
    name: 'Mental Health Awareness Seminars & Wellness Circle',
    description: 'Providing crucial spaces for youth to unpack anxiety, discuss life challenges, and consult certified Naga-based counselors.',
    date: '2026-05-02',
    time: '02:00 PM',
    location: 'Barangay Health Center Assembly Hall',
    budget: 15000,
    status: 'completed',
    file_urls: [],
    created_by: 'user-skofficial-1',
    created_at: '2026-04-05T09:00:00Z',
    updated_at: '2026-05-02T17:00:00Z'
  }
];

// Seeded Expenses corresponding to programs
export const SEED_EXPENSES: Expense[] = [
  // Summer Games (Program ID 1, Budget 120,000)
  {
    id: 1,
    program_id: 1,
    description: 'Professional Sports Equipment, Volleyballs & Basketballs',
    amount: 32000,
    date: '2026-04-10',
    category: 'Supplies',
    recorded_by: 'user-skofficial-1',
    created_at: '2026-04-10T11:00:00Z'
  },
  {
    id: 2,
    program_id: 1,
    description: 'Custom Silk-Screen Printed Uniform Jersey Outfits for Zone Teams',
    amount: 45000,
    date: '2026-04-11',
    category: 'Supplies',
    recorded_by: 'user-skofficial-1',
    created_at: '2026-04-11T14:20:00Z'
  },
  {
    id: 3,
    program_id: 1,
    description: 'LGU Commended Referees and Game Marshalls Subsistence Honorarium',
    amount: 22000,
    date: '2026-04-12',
    category: 'Honorarium',
    recorded_by: 'user-skofficial-1',
    created_at: '2026-04-12T17:00:00Z'
  },
  {
    id: 4,
    program_id: 1,
    description: 'Opening Parade Sound System Rental and Transportation delivery charge',
    amount: 12000,
    date: '2026-04-12',
    category: 'Transport',
    recorded_by: 'user-skofficial-1',
    created_at: '2026-04-12T07:30:00Z'
  },
  {
    id: 5,
    program_id: 1,
    description: 'Bottled Mineral Waters and Pack Lunch meals for team marshalls',
    amount: 8500,
    date: '2026-04-12',
    category: 'Food',
    recorded_by: 'user-skofficial-1',
    created_at: '2026-04-12T08:00:00Z'
  },

  // Eco-Basura Swap (Program ID 2, Budget 65,000)
  {
    id: 6,
    program_id: 2,
    description: 'Purchase of 30 sacks of Local CamSur Premium White Rice',
    amount: 38000,
    date: '2026-05-14',
    category: 'Other',
    recorded_by: 'user-admin-1',
    created_at: '2026-05-14T09:00:00Z'
  },
  {
    id: 7,
    program_id: 2,
    description: 'Youth volunteer heavy lunch meals and morning snacks',
    amount: 11200,
    date: '2026-05-15',
    category: 'Food',
    recorded_by: 'user-admin-1',
    created_at: '2026-05-15T12:00:00Z'
  },
  {
    id: 8,
    program_id: 2,
    description: 'Heavy duty trash container bins and heavy scale equipment',
    amount: 6500,
    date: '2026-05-15',
    category: 'Supplies',
    recorded_by: 'user-admin-1',
    created_at: '2026-05-15T08:00:00Z'
  },

  // Mental Health Program (Program ID 5, Budget 15,000)
  {
    id: 9,
    program_id: 5,
    description: 'Naga General Hospital Counselor Honorarium Fee',
    amount: 8000,
    date: '2026-05-02',
    category: 'Honorarium',
    recorded_by: 'user-skofficial-1',
    created_at: '2026-05-02T10:00:00Z'
  },
  {
    id: 10,
    program_id: 5,
    description: 'Healthy snacks and mental wellness booklets printing',
    amount: 6500,
    date: '2026-05-02',
    category: 'Food',
    recorded_by: 'user-skofficial-1',
    created_at: '2026-05-02T11:00:00Z'
  }
];

// Pre-seeded program participants map (Junction)
export const SEED_PROGRAM_PARTICIPANTS: ProgramParticipant[] = [
  // For Program 1 (Summer Games - completed)
  {
    program_id: 1,
    participant_id: 1, // John Mark
    registration_status: 'approved',
    attendance_status: 'present',
    registered_at: '2026-03-12T14:00:00Z'
  },
  {
    program_id: 1,
    participant_id: 2, // Maria Cristina
    registration_status: 'approved',
    attendance_status: 'present',
    registered_at: '2026-03-15T09:00:00Z'
  },
  {
    program_id: 1,
    participant_id: 4, // Dianne Rose
    registration_status: 'approved',
    attendance_status: 'present',
    registered_at: '2026-03-18T16:30:00Z'
  },
  {
    program_id: 1,
    participant_id: 5, // Christian Paul
    registration_status: 'approved',
    attendance_status: 'absent',
    registered_at: '2026-03-20T10:00:00Z'
  },

  // For Program 2 (Eco Basura Swap - ongoing)
  {
    program_id: 2,
    participant_id: 1, // John Mark
    registration_status: 'approved',
    attendance_status: 'present',
    registered_at: '2026-04-15T08:30:00Z'
  },
  {
    program_id: 2,
    participant_id: 2, // Maria Cristina
    registration_status: 'approved',
    attendance_status: 'present',
    registered_at: '2026-04-18T11:00:00Z'
  },
  {
    program_id: 2,
    participant_id: 4, // Dianne Rose
    registration_status: 'pending', // Registration still pending approval!
    attendance_status: 'absent',
    registered_at: '2026-05-01T15:00:00Z'
  },

  // For Program 5 (Mental Health Seminar)
  {
    program_id: 5,
    participant_id: 1,
    registration_status: 'approved',
    attendance_status: 'present',
    registered_at: '2026-04-10T10:20:00Z'
  },
  {
    program_id: 5,
    participant_id: 2,
    registration_status: 'approved',
    attendance_status: 'excused',
    registered_at: '2026-04-11T13:40:00Z'
  }
];

// Seeded audit-log registrations
export const SEED_REGISTRATIONS: Registration[] = [
  {
    id: 1,
    program_id: 1,
    participant_id: 1,
    registration_date: '2026-03-12T14:00:00Z',
    status: 'approved',
    notes: 'Approved standard resident participant for Summer Games Basketball tournament.',
    approved_by: 'user-admin-1',
    approved_at: '2026-03-13T09:00:00Z'
  },
  {
    id: 2,
    program_id: 1,
    participant_id: 2,
    registration_date: '2026-03-15T09:00:00Z',
    status: 'approved',
    notes: 'Approved team captain setup.',
    approved_by: 'user-admin-1',
    approved_at: '2026-03-15T10:30:00Z'
  },
  {
    id: 3,
    program_id: 2,
    participant_id: 1,
    registration_date: '2026-04-15T08:30:00Z',
    status: 'approved',
    notes: 'Eco Swap volunteer. Encouraging plastic separation.',
    approved_by: 'user-skofficial-1',
    approved_at: '2026-04-16T14:00:00Z'
  },
  {
    id: 4,
    program_id: 2,
    participant_id: 4,
    registration_date: '2026-05-01T15:00:00Z',
    status: 'pending',
    notes: 'Needs to confirm shift availability.',
    approved_by: undefined,
    approved_at: undefined
  }
];

// Seeded program feedback submissions
export const SEED_FEEDBACKS: Feedback[] = [
  {
    id: 1,
    program_id: 1,
    participant_id: 1,
    rating: 5,
    comment: 'The summer games were super awesome! Smooth registration and clean rules. The jerseys are very high quality.',
    created_at: '2026-04-14T08:00:00Z'
  },
  {
    id: 2,
    program_id: 1,
    participant_id: 2,
    rating: 4,
    comment: 'Great scheduling, but please allocate more trash bins around the covers court next time.',
    created_at: '2026-04-14T09:30:00Z'
  },
  {
    id: 3,
    program_id: 5,
    participant_id: 1,
    rating: 5,
    comment: 'The counselor was so friendly and direct. It felt like a safe space where we could express problems.',
    created_at: '2026-05-02T18:00:00Z'
  }
];

// Seeded notifications
export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'New Account Registration',
    message: 'Joshua Villafuerte requested a "regular" user account. Needs Admin approval.',
    is_read: false,
    created_at: '2026-05-23T10:01:00Z'
  },
  {
    id: 'notif-2',
    title: 'Program Creation Notification',
    message: 'New program "Sining Kabataan Art mural" has been published by SK Official S. Reyes.',
    is_read: true,
    created_at: '2026-05-18T14:32:00Z'
  },
  {
    id: 'notif-3',
    title: 'Program Completed',
    message: 'Summer Youth Games budget records has been cross-compiled and closed.',
    is_read: true,
    created_at: '2026-04-13T17:05:00Z'
  }
];

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
