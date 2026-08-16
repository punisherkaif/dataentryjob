-- Supabase Migration: 20260816000002_fix_registration_rls.sql
-- Fix Row Level Security policies for public user registration submission

-- 1. Allow public INSERT on registrations during signup
CREATE POLICY "Allow public registration insert"
  ON public.registrations FOR INSERT
  WITH CHECK (true);

-- 2. Allow public UPDATE on registrations for re-submitting pending registration
CREATE POLICY "Allow public registration update"
  ON public.registrations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 3. Allow public INSERT on public.users during signup
CREATE POLICY "Allow public user record insert"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- 4. Allow public INSERT on activity_logs for registration logs
CREATE POLICY "Allow public activity_logs insert"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);
