-- Supabase Migration: 20260816000001_phase2_storage.sql
-- Storage bucket setup for registration payment screenshots

-- 1. Create Storage Bucket for Payment Screenshots if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage Security Policies
-- Allow anyone (public/anon) to upload payment screenshots during registration
CREATE POLICY "Public registration screenshot uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow public read access to payment screenshots so admins can view them
CREATE POLICY "Public view payment screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-screenshots');

-- Allow admins to delete/manage screenshots if needed
CREATE POLICY "Admins full management on payment screenshots"
  ON storage.objects FOR ALL
  USING (bucket_id = 'payment-screenshots' AND public.is_admin());
