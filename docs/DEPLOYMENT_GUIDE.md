# Production Deployment Guide (Vercel + Supabase)

This guide provides step-by-step instructions for setting up environment variables, running database migrations, and deploying the **Data Entry Work Management Platform** to Vercel.

---

## 1. Required Environment Variables

When deploying to Vercel, navigate to **Project Settings &rarr; Environment Variables** and configure the following:

| Variable Name | Required? | Example / Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | `eyJhbGciOiJIUzI1NiIsIn...` (Supabase Anon Key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | `eyJhbGciOiJIUzI1NiIsIn...` (Supabase Service Role Key — bypasses rate limits) |
| `NEXT_PUBLIC_UPI_ID` | Optional | `dataentrywork@upi` (Default: `dataentrywork@upi`) |
| `NEXT_PUBLIC_REGISTRATION_FEE` | Optional | `500.00` (Default: `500.00`) |
| `NEXT_PUBLIC_QR_CODE_URL` | Optional | `/qr-placeholder.png` or hosted image URL |

> [!IMPORTANT]
> Ensure `SUPABASE_SERVICE_ROLE_KEY` is added to production environment variables. This allows registration, approval, and task status updates to function seamlessly without Supabase email confirmation limits.

---

## 2. Execute Supabase Database Migrations

Before launching on Vercel, apply all migrations in order using your [Supabase Dashboard SQL Editor](https://supabase.com/dashboard):

1. **`supabase/migrations/20260816000000_initial_schema.sql`**
   - Creates core tables (`users`, `registrations`, `tasks`, `task_images`, `submissions`, `activity_logs`), RLS policies, and triggers.
2. **`supabase/migrations/20260816000001_phase2_storage.sql`**
   - Sets up `payment-screenshots` bucket in Supabase Storage.
3. **`supabase/migrations/20260816000002_fix_registration_rls.sql`**
   - Permits unauthenticated public user registration submissions.
4. **`supabase/migrations/20260816000003_task_images_storage.sql`**
   - Sets up `task-images` bucket in Supabase Storage.
5. **`supabase/migrations/20260816000004_worker_task_rls.sql`**
   - Permits workers to update their assigned tasks.
6. **`supabase/migrations/20260816000005_task_zip_support.sql`**
   - Adds `zip_file_url` and `zip_file_name` to `tasks` table and updates `task-images` storage bucket to support ZIP packages up to 100MB.
7. **`supabase/migrations/20260816000006_expanded_archive_support.sql`**
   - Adds RAR, 7Z, TAR, and GZ mime-type support to Supabase Storage.

---

## 3. Vercel Deployment Steps

1. Push your codebase to GitHub:
   ```bash
   git add .
   git commit -m "Complete Work Management Platform - Phase 1 to 5"
   git push -u origin master
   ```
2. Log in to [Vercel](https://vercel.com) and click **Add New &rarr; Project**.
3. Import your GitHub repository.
4. Framework Preset: **Next.js** (Root Directory: `./`).
5. Open **Environment Variables** and add all values listed in Section 1 above.
6. Click **Deploy**.

---

## 4. Post-Deployment Initial Setup

1. Once Vercel finishes building, open your production URL (e.g. `https://dataentryjob.vercel.app`).
2. Register your Admin user or run the Admin SQL script in Supabase to promote your initial account role to `ADMIN` and status to `ACTIVE`:
   ```sql
   UPDATE public.users SET role = 'ADMIN', status = 'ACTIVE' WHERE email = 'admin@example.com';
   ```
3. Test public registration at `/register`, log in as Admin to approve at `/admin/registrations`, assign tasks at `/admin/tasks/create`, and test worker submission at `/user/tasks`.
