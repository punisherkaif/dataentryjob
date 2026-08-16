-- Supabase Migration: 20260816000003_task_images_storage.sql
-- Storage bucket for task source images

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-images',
  'task-images',
  true,
  10485760, -- 10MB per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Allow admins to upload/manage task images
CREATE POLICY "Admins can upload task images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-images' AND public.is_admin()
  );

CREATE POLICY "Admins can update task images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'task-images' AND public.is_admin());

CREATE POLICY "Admins can delete task images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'task-images' AND public.is_admin());

-- Allow authenticated users to view task images (workers can see their own task images via RLS on task_images table)
CREATE POLICY "Authenticated users can view task images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-images' AND auth.role() = 'authenticated');
