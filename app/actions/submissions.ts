'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const submitWorkSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  googleDriveUrl: z
    .string()
    .trim()
    .min(5, 'Please provide a valid document link')
    .refine((val) => {
      try {
        const url = new URL(val)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    }, 'Please provide a valid URL starting with https:// or http://'),
})

const reviewSubmissionSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  taskId: z.string().uuid('Invalid task ID'),
  decision: z.enum(['PASS', 'FAIL']),
  failureReason: z.string().optional(),
  allowResubmission: z.boolean().default(true),
})

/**
 * Worker submits or resubmits work for a task
 */
export async function submitWorkAction(formData: { taskId: string; googleDriveUrl: string }) {
  const supabase = await createClient()
  const dbClient = createAdminClient() || supabase

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { error: 'Unauthorized.' }

  const validation = submitWorkSchema.safeParse(formData)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { taskId, googleDriveUrl } = validation.data

  // Fetch the task and confirm it is assigned to this worker
  const { data: task, error: taskFetchError } = await (supabase.from('tasks') as any)
    .select('id, title, status, assigned_to')
    .eq('id', taskId)
    .eq('assigned_to', authUser.id)
    .single()

  if (taskFetchError || !task) {
    return { error: 'Task not found or you are not authorized to submit for this task.' }
  }

  // Fetch existing submission (if any)
  const { data: existingSubmission } = await (supabase.from('submissions') as any)
    .select('id, status, allow_resubmission')
    .eq('task_id', taskId)
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Verify status allows submission: IN_PROGRESS, or FAILED with allow_resubmission=true
  if (task.status === 'UNDER_REVIEW' || task.status === 'SUBMITTED') {
    return { error: 'Your previous submission is currently under review. Please wait for admin feedback.' }
  }

  if (task.status === 'PASSED') {
    return { error: 'This task has already been passed and completed.' }
  }

  if (task.status === 'FAILED' && existingSubmission && !existingSubmission.allow_resubmission) {
    return { error: 'Resubmission is not permitted for this task.' }
  }

  const now = new Date().toISOString()
  let submissionId: string

  if (existingSubmission) {
    // Update existing submission record
    const { data: updatedSub, error: subUpdateError } = await (dbClient.from('submissions') as any)
      .update({
        google_drive_url: googleDriveUrl,
        status: 'UNDER_REVIEW',
        submitted_at: now,
        reviewed_at: null,
        reviewed_by: null,
        failure_reason: null,
      })
      .eq('id', existingSubmission.id)
      .select('id')
      .single()

    if (subUpdateError) {
      return { error: 'Failed to update submission: ' + subUpdateError.message }
    }
    submissionId = updatedSub.id
  } else {
    // Create new submission record
    const { data: newSub, error: subInsertError } = await (dbClient.from('submissions') as any)
      .insert({
        task_id: taskId,
        user_id: authUser.id,
        google_drive_url: googleDriveUrl,
        status: 'UNDER_REVIEW',
        submitted_at: now,
        allow_resubmission: true,
      })
      .select('id')
      .single()

    if (subInsertError) {
      return { error: 'Failed to create submission: ' + subInsertError.message }
    }
    submissionId = newSub.id
  }

  // Update parent task status to UNDER_REVIEW
  const { error: taskUpdateError } = await (dbClient.from('tasks') as any)
    .update({ status: 'UNDER_REVIEW' })
    .eq('id', taskId)

  if (taskUpdateError) {
    return { error: 'Failed to update task status: ' + taskUpdateError.message }
  }

  // Log activity
  await (dbClient.from('activity_logs') as any).insert({
    user_id: authUser.id,
    action: 'SUBMISSION_CREATED',
    description: `Worker submitted Google Drive document for task "${task.title}".`,
  })

  revalidatePath(`/user/tasks/${taskId}`)
  revalidatePath('/user/tasks')
  revalidatePath('/user/dashboard')
  revalidatePath('/user/submissions')
  revalidatePath(`/admin/tasks/${taskId}`)
  revalidatePath('/admin/tasks')
  revalidatePath('/admin/submissions')
  revalidatePath('/admin/dashboard')

  return { success: true, submissionId }
}

/**
 * Admin reviews a submission: PASS or FAIL
 */
export async function reviewSubmissionAction(data: {
  submissionId: string
  taskId: string
  decision: 'PASS' | 'FAIL'
  failureReason?: string
  allowResubmission?: boolean
}) {
  const supabase = await createClient()
  const dbClient = createAdminClient() || supabase

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { error: 'Unauthorized.' }

  // Verify Admin role
  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', authUser.id)
    .single() as { data: { role: string; name: string } | null }

  if (profile?.role !== 'ADMIN') {
    return { error: 'Only admins can review submissions.' }
  }

  const validation = reviewSubmissionSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { submissionId, taskId, decision, failureReason, allowResubmission } = validation.data

  if (decision === 'FAIL' && (!failureReason || failureReason.trim().length === 0)) {
    return { error: 'Please provide a failure reason explaining what needs correction.' }
  }

  // Fetch task title
  const { data: task } = await (supabase.from('tasks') as any)
    .select('id, title, assigned_to')
    .eq('id', taskId)
    .single()

  const now = new Date().toISOString()

  if (decision === 'PASS') {
    // 1. Update submission
    const { error: subError } = await (dbClient.from('submissions') as any)
      .update({
        status: 'PASSED',
        reviewed_at: now,
        reviewed_by: authUser.id,
        failure_reason: null,
      })
      .eq('id', submissionId)

    if (subError) return { error: 'Failed to update submission: ' + subError.message }

    // 2. Update task
    const { error: taskError } = await (dbClient.from('tasks') as any)
      .update({ status: 'PASSED' })
      .eq('id', taskId)

    if (taskError) return { error: 'Failed to update task: ' + taskError.message }

    // 3. Log to activity_logs
    await (dbClient.from('activity_logs') as any).insert({
      user_id: authUser.id,
      action: 'TASK_PASSED',
      description: `Admin passed submission for task "${task?.title || taskId}".`,
    })
  } else {
    // Decision is FAIL
    const reasonText = failureReason!.trim()
    const allowResub = allowResubmission !== false

    // 1. Update submission
    const { error: subError } = await (dbClient.from('submissions') as any)
      .update({
        status: 'FAILED',
        reviewed_at: now,
        reviewed_by: authUser.id,
        failure_reason: reasonText,
        allow_resubmission: allowResub,
      })
      .eq('id', submissionId)

    if (subError) return { error: 'Failed to update submission: ' + subError.message }

    // 2. Update task
    const { error: taskError } = await (dbClient.from('tasks') as any)
      .update({ status: 'FAILED' })
      .eq('id', taskId)

    if (taskError) return { error: 'Failed to update task: ' + taskError.message }

    // 3. Log to activity_logs
    await (dbClient.from('activity_logs') as any).insert({
      user_id: authUser.id,
      action: 'TASK_FAILED',
      description: `Admin marked task "${task?.title || taskId}" as FAILED. Reason: ${reasonText}. Resubmission allowed: ${allowResub ? 'Yes' : 'No'}.`,
    })
  }

  revalidatePath(`/admin/tasks/${taskId}`)
  revalidatePath('/admin/tasks')
  revalidatePath('/admin/submissions')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/user/tasks/${taskId}`)
  revalidatePath('/user/tasks')
  revalidatePath('/user/dashboard')
  revalidatePath('/user/submissions')

  return { success: true }
}

/**
 * Get submissions for Admin Review Queue
 */
export async function getAdminSubmissionsAction(statusFilter: string = 'ALL') {
  const supabase = await createClient()

  let query = (supabase.from('submissions') as any)
    .select(`
      id,
      task_id,
      user_id,
      google_drive_url,
      status,
      submitted_at,
      reviewed_at,
      failure_reason,
      allow_resubmission,
      created_at,
      tasks:tasks!submissions_task_id_fkey (
        id,
        title,
        status,
        deadline,
        instructions
      ),
      worker:users!submissions_user_id_fkey (
        id,
        name,
        username,
        email
      ),
      reviewer:users!submissions_reviewed_by_fkey (
        id,
        name
      )
    `)
    .order('submitted_at', { ascending: false })

  if (statusFilter === 'PENDING') {
    query = query.in('status', ['SUBMITTED', 'UNDER_REVIEW'])
  } else if (statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query
  return { submissions: data || [], error: error?.message }
}

/**
 * Get all submissions by the logged-in worker
 */
export async function getWorkerSubmissionsAction() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { submissions: [], error: 'Unauthorized' }

  const { data, error } = await (supabase.from('submissions') as any)
    .select(`
      id,
      task_id,
      google_drive_url,
      status,
      submitted_at,
      reviewed_at,
      failure_reason,
      allow_resubmission,
      created_at,
      tasks:tasks!submissions_task_id_fkey (
        id,
        title,
        status,
        deadline
      ),
      reviewer:users!submissions_reviewed_by_fkey (
        id,
        name
      )
    `)
    .eq('user_id', authUser.id)
    .order('submitted_at', { ascending: false })

  return { submissions: data || [], error: error?.message }
}
