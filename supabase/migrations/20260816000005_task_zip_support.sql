-- Migration: 20260816000005_task_zip_support.sql
-- Add support for ZIP file packages and external ZIP links in tasks

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS zip_file_url TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS zip_file_name TEXT;

-- Update task-images storage bucket to allow ZIP archives as well as images
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/octet-stream'
],
file_size_limit = 104857600 -- 100MB size limit for ZIP packages
WHERE id = 'task-images';
