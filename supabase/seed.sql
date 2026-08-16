-- Seed file: supabase/seed.sql
-- Run this SQL in your Supabase SQL Editor to quickly create test Admin and Worker accounts

-- Note: In Supabase, replace 'YOUR_ADMIN_AUTH_UUID' and 'YOUR_WORKER_AUTH_UUID' 
-- with actual UUIDs generated when signing up via Supabase Auth.

/*
-- Example 1: Set an existing Auth user to ACTIVE ADMIN
UPDATE public.users
SET role = 'ADMIN', status = 'ACTIVE'
WHERE email = 'admin@example.com';

-- Example 2: Set an existing Auth user to ACTIVE WORKER (USER role)
UPDATE public.users
SET role = 'USER', status = 'ACTIVE'
WHERE email = 'worker@example.com';
*/
