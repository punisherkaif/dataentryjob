-- Supabase Migration: 20260816000000_initial_schema.sql
-- Work Management Platform Schema, RLS, and Triggers

-- 1. EXTENSIONS & ENUMS / CHECKS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER')) DEFAULT 'USER',
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED')) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    payment_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_screenshot_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    deadline TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'PASSED', 'FAILED')) DEFAULT 'PENDING',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TASK IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.task_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    google_drive_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'PASSED', 'FAILED')) DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    failure_reason TEXT,
    allow_resubmission BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. HELPER FUNCTIONS & TRIGGERS
-- Function to check if executing user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Automatic user creation trigger on auth.users insert (fallback for Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, phone, username, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::TEXT, 'USER'),
        COALESCE((NEW.raw_user_meta_data->>'status')::TEXT, 'PENDING')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES: users
CREATE POLICY "Admins full access on users"
    ON public.users FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own user record"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own user record"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- POLICIES: registrations
CREATE POLICY "Admins full access on registrations"
    ON public.registrations FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own registration"
    ON public.registrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registration"
    ON public.registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- POLICIES: tasks
CREATE POLICY "Admins full access on tasks"
    ON public.tasks FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can view assigned tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = assigned_to);

-- POLICIES: task_images
CREATE POLICY "Admins full access on task_images"
    ON public.task_images FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can view images for assigned tasks"
    ON public.task_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_images.task_id AND t.assigned_to = auth.uid()
        )
    );

-- POLICIES: submissions
CREATE POLICY "Admins full access on submissions"
    ON public.submissions FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own submissions"
    ON public.submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
    ON public.submissions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = submissions.task_id AND t.assigned_to = auth.uid()
        )
    );

CREATE POLICY "Users can update own submissions"
    ON public.submissions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- POLICIES: activity_logs
CREATE POLICY "Admins full access on activity_logs"
    ON public.activity_logs FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own activity logs"
    ON public.activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
