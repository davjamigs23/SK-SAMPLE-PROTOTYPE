-- ====================================================================
-- Sangguniang Kabataan - Barangay San Francisco, Naga City
-- Program and Participant Management System (PMMS)
-- Database Migration Script for Supabase / PostgreSQL
-- ====================================================================

-- Enable UUID functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: users (Linked with Supabase Auth id)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'skofficial', 'regular', 'viewer')) DEFAULT 'regular',
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: participants
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

-- 3. Table: programs
CREATE TABLE IF NOT EXISTS public.programs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TEXT,
    location TEXT,
    budget DECIMAL(12,2) DEFAULT 0.00 CHECK (budget >= 0),
    status TEXT NOT NULL CHECK (status IN ('planned', 'ongoing', 'completed')) DEFAULT 'planned',
    file_urls TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table: expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Food', 'Supplies', 'Transport', 'Honorarium', 'Other')),
    recorded_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table: program_participants (Junction)
CREATE TABLE IF NOT EXISTS public.program_participants (
    program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE,
    participant_id BIGINT REFERENCES public.participants(id) ON DELETE CASCADE,
    registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected')),
    attendance_status TEXT DEFAULT 'absent' CHECK (attendance_status IN ('present', 'absent', 'excused')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (program_id, participant_id)
);

-- 6. Table: registrations (Audit Approval Log)
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

-- 7. Table: feedback
CREATE TABLE IF NOT EXISTS public.feedback (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    participant_id BIGINT REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- Performance Optimization Indices
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);
CREATE INDEX IF NOT EXISTS idx_expenses_program_id ON public.expenses(program_id);
CREATE INDEX IF NOT EXISTS idx_program_participants_ids ON public.program_participants(program_id, participant_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);

-- ====================================================================
-- Row Level Security (RLS) Configuration
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- users Policies
CREATE POLICY "Enable read for self" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins & SK Officials full access on users" ON public.users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'skofficial'))
);

-- participants Policies
CREATE POLICY "Users can see their own profile" ON public.participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit their own profile" ON public.participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins & SK Officials can read/write all participants" ON public.participants FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'skofficial'))
);
CREATE POLICY "Viewers read-only participants" ON public.participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'viewer')
);

-- programs Policies
CREATE POLICY "Programs are readable by authenticated users" ON public.programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins & SK Officials manage programs" ON public.programs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'skofficial'))
);

-- expenses Policies
CREATE POLICY "Expenses readable by Admins, SK Officials, and Viewers" ON public.expenses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'skofficial', 'viewer'))
);
CREATE POLICY "Expenses writable only by Admins & SK Officials" ON public.expenses FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'skofficial'))
);

-- program_participants Policies
CREATE POLICY "Participants read self records" ON public.program_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.participants WHERE id = participant_id AND user_id = auth.uid())
);
CREATE POLICY "Participants join programs" ON public.program_participants FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.participants WHERE id = participant_id AND user_id = auth.uid())
);
CREATE POLICY "Officials full access on program registrations" ON public.program_participants FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'skofficial'))
);
CREATE POLICY "Viewers read registrations" ON public.program_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'viewer')
);

-- registrations Policies
CREATE POLICY "Participants view self registration audit logs" ON public.registrations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.participants WHERE id = participant_id AND user_id = auth.uid())
);
CREATE POLICY "Participants insert pending registration log" ON public.registrations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.participants WHERE id = participant_id AND user_id = auth.uid())
);
CREATE POLICY "Officials can view and edit registration log" ON public.registrations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'skofficial'))
);

-- feedback Policies
CREATE POLICY "Authenticated users view feedback" ON public.feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Participants insert feedback for programs they joined" ON public.feedback FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.participants p
        JOIN public.program_participants pp ON pp.participant_id = p.id
        WHERE p.id = participant_id AND p.user_id = auth.uid() AND pp.program_id = program_id
    )
);
CREATE POLICY "Officials full control on feedback" ON public.feedback FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'skofficial'))
);
