-- Migration: In-Platform Typing Workspace & DOCX Submissions Support

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

-- Trigger for auto-updating updated_at timestamp
CREATE TRIGGER update_task_page_progress_updated_at
BEFORE UPDATE ON public.task_page_progress
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Enable RLS on task_page_progress
ALTER TABLE public.task_page_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Select - Workers can view their own progress, Admins can view all
CREATE POLICY "Workers can view own task page progress"
ON public.task_page_progress FOR SELECT
USING (
    user_id = auth.uid()
    OR public.is_admin()
);

-- Policy: Insert - Workers can insert progress for tasks assigned to them
CREATE POLICY "Workers can insert own task page progress"
ON public.task_page_progress FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_id AND tasks.assigned_to = auth.uid()
    )
);

-- Policy: Update - Workers can update their own progress
CREATE POLICY "Workers can update own task page progress"
ON public.task_page_progress FOR UPDATE
USING (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_id AND tasks.assigned_to = auth.uid()
    )
)
WITH CHECK (
    user_id = auth.uid()
);

-- Policy: Delete - Workers or Admins can delete
CREATE POLICY "Workers can delete own task page progress"
ON public.task_page_progress FOR DELETE
USING (
    user_id = auth.uid() OR public.is_admin()
);

-- 4. Setup compiled-docs storage bucket for generated Word documents (.docx)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'compiled-docs',
    'compiled-docs',
    true,
    52428800, -- 50MB
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

-- Storage RLS policies for compiled-docs bucket
CREATE POLICY "Public can view compiled documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'compiled-docs');

CREATE POLICY "Authenticated users can upload compiled documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'compiled-docs' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update own compiled documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'compiled-docs' 
    AND auth.role() = 'authenticated'
);
