# In-Platform Typing Workspace & Auto-DOCX Compilation Guide

This guide covers the database setup, feature architecture, and end-to-end testing steps for the newly added **In-Platform Typing Workspace** and **Automatic Word (.docx) Compiler**.

---

## 1. Required Supabase Migration

Run the following SQL in your [Supabase Dashboard SQL Editor](https://supabase.com/dashboard) to create the `task_page_progress` table, update the `submissions` table, and configure the `compiled-docs` storage bucket:

File: [`supabase/migrations/20260819000007_typing_workspace.sql`](file:///d:/Github/Testing%20projects/dataentryjob/supabase/migrations/20260819000007_typing_workspace.sql)

```sql
-- 1. Update Submissions table to support both Google Drive and Typed DOCX workflows
ALTER TABLE public.submissions 
    ALTER COLUMN google_drive_url DROP NOT NULL;

ALTER TABLE public.submissions 
    ADD COLUMN IF NOT EXISTS submission_method TEXT NOT NULL DEFAULT 'DRIVE_LINK' CHECK (submission_method IN ('DRIVE_LINK', 'TYPED_DOCX')),
    ADD COLUMN IF NOT EXISTS compiled_document_url TEXT;

-- 2. Create Task Page Progress table for autosaving worker text page-by-page
CREATE TABLE IF NOT EXISTS public.task_page_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_image_id UUID REFERENCES public.task_images(id) ON DELETE CASCADE,
    page_order INT NOT NULL DEFAULT 0,
    typed_text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_task_page UNIQUE (task_id, user_id, page_order)
);

CREATE TRIGGER update_task_page_progress_updated_at
BEFORE UPDATE ON public.task_page_progress
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.task_page_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workers can view own task page progress"
ON public.task_page_progress FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Workers can insert own task page progress"
ON public.task_page_progress FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_id AND tasks.assigned_to = auth.uid()
    )
);

CREATE POLICY "Workers can update own task page progress"
ON public.task_page_progress FOR UPDATE
USING (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_id AND tasks.assigned_to = auth.uid()
    )
)
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Workers can delete own task page progress"
ON public.task_page_progress FOR DELETE
USING (user_id = auth.uid() OR public.is_admin());

-- 3. Storage Bucket for Compiled Word Documents (.docx)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'compiled-docs',
    'compiled-docs',
    true,
    52428800,
    ARRAY[
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/octet-stream',
        'application/zip'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/octet-stream',
        'application/zip'
    ];

CREATE POLICY "Public can view compiled documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'compiled-docs');

CREATE POLICY "Authenticated users can upload compiled documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'compiled-docs' AND auth.role() = 'authenticated');
```

---

## 2. Overview of New Features

### A. Worker Choice on Task Page (`/user/tasks/[id]`)
When a worker opens an active task, they can choose between two submission methods:
1. **In-Platform Typing Workspace (Recommended)**:
   - Click **"Launch Typing Workspace"**.
   - Fullscreen split interface: Source Image on top/left with pan & zoom (50% to 300%), Large Text Editor on bottom/right.
   - Autosaves every page's text automatically in real-time (`task_page_progress`).
   - Page-by-page navigation with step pills (**Page 1 of N**, **Next Page**, **Previous Page**).
   - **Finish & Compile**: Generates a standard Microsoft Word (.docx) file with headings and page breaks for every page, uploads it to Supabase Storage, and submits the task.
2. **Alternate Google Drive Link**:
   - Paste an external Google Drive document link if typing offline in Word or Google Docs.

---

### B. Admin Review Interface (`/admin/submissions` & `/admin/tasks/[id]`)
- **Submission Method Badge**: Clearly indicates whether the submission is **"Typed in-platform (.docx)"** or a **"Google Drive Link"**.
- **1-Click DOCX Download**: For in-platform typed submissions, admins can click **"Download / Open Compiled Word Document (.docx)"** to inspect the generated file directly.
- **Pass / Fail Evaluation**: Evaluates as usual. On **Fail with Resubmission Allowed**, the worker can return to the typing workspace with all previous text preserved to correct mistakes and re-compile.

---

## 3. End-to-End Testing Procedure

### Step 1: Create a Task as Admin
1. Log in as an Admin and navigate to `/admin/tasks/create`.
2. Fill in:
   - **Title**: `Batch 101 - In-Platform Typing Test`
   - **Assign To**: Select an active worker.
   - **Source Attachments**: Upload 2 or 3 sample page images (PNG/JPG).
3. Click **Create & Assign Task**.

---

### Step 2: Test the Typing Workspace as Worker
1. Log in as the assigned Worker and navigate to `/user/tasks`.
2. Open the newly assigned task and click **Start Task** (sets status to `IN_PROGRESS`).
3. Under the submission section, click **"Launch Typing Workspace"**.
4. **Test Page 1**:
   - Verify Page 1 image is displayed with zoom controls (`Zoom In`, `Zoom Out`, `100%`, `Maximize`).
   - Type sample text in the textarea below.
   - Notice the green badge in the top right: `"Saved at HH:MM:SS"`.
5. **Test Page 2**:
   - Click **Next Page** &rarr; Notice image updates to Page 2 and the text area clears.
   - Type sample text for Page 2.
6. **Test Page 1 Review**:
   - Click **Previous Page** &rarr; Verify Page 1 image reloads and your previously typed text for Page 1 is intact!
7. **Test Finish & Compile**:
   - Click **Next Page** &rarr; On the last page, click **Finish & Compile**.
   - Review the confirmation modal and click **Compile & Submit**.
   - Verify workspace closes and the task detail page transitions to **Under Admin Review** showing **"Submitted Word Document"** with a **"Download Compiled .docx"** button.

---

### Step 3: Test Admin Review of Compiled Word Document
1. Switch back to the Admin account and navigate to `/admin/submissions`.
2. Find the submission in the queue &rarr; Notice the green badge: **"Typed in-platform (.docx)"**.
3. Click **Review** &rarr; In the review modal, click **"Download / Open Compiled Word Document (.docx)"**.
4. Open the downloaded `.docx` in Microsoft Word or Google Docs and confirm:
   - Document title header with task name & worker info.
   - Styled page headings (`--- Page 1 ---`, `--- Page 2 ---`).
   - Clean paragraph formatting with page breaks between pages.
5. Click **Pass Submission** to approve.

---

### Step 4: Test Backward Compatibility (Drive Link Flow)
1. Assign another task to a worker.
2. Log in as the worker, click **Start Task**, and scroll to **Option B: Alternate: Type Externally & Share Google Drive Link**.
3. Paste a sample Google Drive link (e.g. `https://docs.google.com/document/d/example/edit`) and submit.
4. Verify the task submits as `DRIVE_LINK` and displays the "Open Document in New Tab" button in Admin review.
