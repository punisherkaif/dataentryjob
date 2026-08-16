-- Migration: 20260816000004_worker_task_rls.sql
-- Allow workers to update their own assigned tasks (for status transitions like PENDING → IN_PROGRESS)
-- This uses the service role from app actions, but adding RLS policy is best practice.

CREATE POLICY "Users can update own assigned tasks status"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_to);
