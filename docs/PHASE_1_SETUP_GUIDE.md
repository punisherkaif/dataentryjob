# Phase 1: Supabase & Manual Setup Walkthrough Guide

This step-by-step guide will walk you through setting up Supabase, executing database migrations, configuring environment variables, creating test accounts (Admin & Worker), and verifying Phase 1 features locally.

---

## 1. Supabase Project Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project (or select an existing project).
2. Once your project is created, navigate to **Project Settings** -> **API**.
3. Copy your project credentials:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Anon / Public Key** (starts with `ey...`)

---

## 2. Environment Variables Configuration

In the root of your project directory (`dataentryjob/`), create a file named `.env.local`:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*(Replace the values with your actual Supabase URL and Anon Key).*

---

## 3. Database Migration & RLS Setup

1. Open your Supabase Dashboard and click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open the file [`supabase/migrations/20260816000000_initial_schema.sql`](file:///d:/Github/Testing%20projects/dataentryjob/supabase/migrations/20260816000000_initial_schema.sql) from your local project.
4. Copy the entire SQL content and paste it into the Supabase SQL Editor.
5. Click **Run** (or `Ctrl + Enter`).
6. You should see `Success. No rows returned.`

> **What this does:**
> - Creates tables: `users`, `registrations`, `tasks`, `task_images`, `submissions`, `activity_logs`.
> - Enables Row Level Security (RLS) on all tables.
> - Creates `is_admin()` SQL security helper function.
> - Creates auto-sync trigger from `auth.users` to `public.users`.

---

## 4. Creating Test Accounts (Admin & Worker)

### Step A: Sign Up Test Accounts in Supabase Auth
1. Go to **Authentication** -> **Users** in your Supabase Dashboard.
2. Click **Add User** -> **Create User**.
3. Create an **Admin User**:
   - **Email**: `admin@example.com`
   - **Password**: `admin123456`
   - Click **Create User**.
4. Create a **Worker User**:
   - **Email**: `worker@example.com`
   - **Password**: `worker123456`
   - Click **Create User**.

---

### Step B: Promote Accounts in Database (`public.users`)
1. Go back to the **SQL Editor** in Supabase.
2. Run the following SQL query:

```sql
-- 1. Promote Admin User to ACTIVE ADMIN
UPDATE public.users
SET 
  name = 'System Administrator',
  username = 'admin',
  role = 'ADMIN',
  status = 'ACTIVE'
WHERE email = 'admin@example.com';

-- 2. Promote Worker User to ACTIVE WORKER
UPDATE public.users
SET 
  name = 'John Worker',
  username = 'worker1',
  role = 'USER',
  status = 'ACTIVE'
WHERE email = 'worker@example.com';
```

3. Confirm that both users now have `status = 'ACTIVE'` and their respective roles (`ADMIN` vs `USER`).

---

## 5. Running & Verifying Local Application

1. Open your terminal in the project directory and start the local development server:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000`.

### Manual Testing Checklist:

- [ ] **Test Admin Login**:
  1. Go to `http://localhost:3000/login`.
  2. Enter Email `admin@example.com` (or Username `admin`) and Password `admin123456`.
  3. Click **Sign In**.
  4. **Expected Result**: Successfully lands on `/admin/dashboard` with "ADMIN" badge and Admin navigation sidebar.

- [ ] **Test Worker Access Blocked for Admin Routes**:
  1. Log out or open an Incognito window.
  2. Log in as Worker: `worker@example.com` / `worker123456`.
  3. **Expected Result**: Lands on `/user/dashboard`.
  4. Manually type `http://localhost:3000/admin/dashboard` in the browser address bar and press Enter.
  5. **Expected Result**: Middleware blocks access and immediately redirects back to `/user/dashboard`.

- [ ] **Test Unauthenticated Guard**:
  1. Click **Sign Out**.
  2. Manually try to visit `http://localhost:3000/admin/dashboard` or `http://localhost:3000/user/dashboard`.
  3. **Expected Result**: Redirects immediately to `/login`.

- [ ] **Test Pending Status Account**:
  1. Create a third user in Supabase Auth (e.g. `pending@example.com`).
  2. Log in with this account.
  3. **Expected Result**: Immediately lands on `/account-status` showing "Registration Pending Approval".

---

## 6. Ready for Phase 2!

Once you have verified the above steps, you are ready to proceed with Phase 2 (Manual UPI Payment & User Registration Approval Workflow).
