# Phase 3: Tasks Workflow & Supabase Setup Guide

This step-by-step guide will walk you through applying the Phase 3 Supabase migrations (Storage bucket for task images and RLS policies), creating tasks with source images as an Admin, viewing assigned tasks as a Worker, starting work (`IN_PROGRESS`), and inspecting images.

---

## 1. Apply Phase 3 Supabase Migrations

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and click on **SQL Editor**.
2. Click **New Query**.
3. Copy and paste the contents of [`supabase/migrations/20260816000003_task_images_storage.sql`](file:///d:/Github/Testing%20projects/dataentryjob/supabase/migrations/20260816000003_task_images_storage.sql) into the SQL Editor and click **Run**.
4. Create another **New Query**.
5. Copy and paste the contents of [`supabase/migrations/20260816000004_worker_task_rls.sql`](file:///d:/Github/Testing%20projects/dataentryjob/supabase/migrations/20260816000004_worker_task_rls.sql) into the SQL Editor and click **Run**.

> **What these do:**
> - `20260816000003_task_images_storage.sql`: Creates the `task-images` bucket in Supabase Storage with Admin upload/management policies and authenticated user read policies.
> - `20260816000004_worker_task_rls.sql`: Permits assigned workers to update their own assigned tasks (for status transitions such as `PENDING` → `IN_PROGRESS`).

---

## 2. Admin Task Creation Walkthrough (`/admin/tasks/create`)

1. Start your local development server if not running:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/login` and sign in with Admin credentials (`admin@example.com` / `admin123456`).
3. In the Admin sidebar, click **Manage Tasks** (or visit `http://localhost:3000/admin/tasks`).
4. Click **Create New Task** (`/admin/tasks/create`).
5. Fill out the task form:
   - **Task Title**: `Transcribe Handwritten Records Batch #101`
   - **Description**: `Transcribe customer ledger entries from scanned images.`
   - **Worker Instructions**:
     ```
     1. Type names, dates, and amounts exactly as written.
     2. Keep all rows in chronological order.
     3. Do not include crossed-out line items.
     ```
   - **Assign To**: Select an active worker from the dropdown (e.g., `Jane Worker (@janeworker)`).
   - **Deadline**: Pick a future date/time.
   - **Source Images**: Click the upload area and attach 1 or more sample images (PNG, JPG, WEBP).
6. Click **Create & Assign Task**.
7. **Expected Result**:
   - The task is created with status `PENDING`.
   - Source images are uploaded to the `task-images` bucket in Supabase Storage and stored with order preserved in `task_images`.
   - An event `TASK_CREATED` is written to `activity_logs`.
   - You are redirected to `/admin/tasks` where the new task appears in the list.

---

## 3. Admin Task Management Walkthrough (`/admin/tasks`)

1. Go to `http://localhost:3000/admin/tasks`.
2. Test the status filter tabs: **All**, **Pending**, **In Progress**, **Submitted**, **Review**, **Passed**, **Failed**.
3. Click **View** on the newly created task (or visit `/admin/tasks/[id]`).
4. Review the task details:
   - Status badge (`Pending`)
   - Assigned worker name & username
   - Deadline & timestamp
   - Description & instructions
   - Grid of attached source images with full-size preview links.

---

## 4. Worker Dashboard & Task List Walkthrough (`/user/dashboard` & `/user/tasks`)

1. Open an incognito window or log out and log in as the assigned worker (`janeworker@example.com` / `janepass123`).
2. Observe the **Worker Dashboard** (`/user/dashboard`):
   - **Live Stat Cards**: Shows real count of tasks assigned to this worker (`Pending: 1`, `In Progress: 0`, etc.).
   - **My Tasks** preview section displaying the newly assigned task.
3. In the sidebar, click **My Assigned Tasks** (`/user/tasks`).
4. Notice the task table / cards displaying Title, Deadline, Status (`Pending`), and Last Updated.

---

## 5. Worker Task Detail & Starting Work (`/user/tasks/[id]`)

1. Click **Open Task** on the assigned task to view `/user/tasks/[id]`.
2. Notice the "Ready to start this task?" banner with the **Start Task** button.
3. Review the instructions and source images:
   - Images are rendered cleanly in sequential order (`Image 1 of N`, `Image 2 of N`).
   - Click on any image to open the lightbox / full-screen zoom.
4. Click **Start Task**.
5. **Expected Result**:
   - Status badge transitions dynamically to `In Progress`.
   - The task status in Supabase updates to `IN_PROGRESS`.
   - A `TASK_STARTED` event is logged to `activity_logs`.
   - If you switch back to the Admin window and refresh `/admin/tasks`, you will see the task status updated to `In Progress`.

---

## 6. Access Control & Security Verification

1. As a Worker, attempt to view an unassigned task or another worker's task URL `/user/tasks/<random-uuid>`.
   - **Expected Result**: Row Level Security (RLS) blocks access and returns a `404 Not Found`.
2. As a Worker, attempt to access `/admin/tasks` or `/admin/tasks/create`.
   - **Expected Result**: Protected proxy/middleware redirects you back to `/user/dashboard`.

---

## 7. Ready for Phase 4!

Phase 3 is complete. We are now ready to proceed to **Phase 4: Submissions + Admin Review Workflow**!
