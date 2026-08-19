'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  assigned_to: z.string().uuid('Please select a valid worker'),
  deadline: z.string().optional(),
  zip_url_input: z.string().optional(),
})

export async function getActiveWorkersAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, name, username, email')
    .eq('role', 'USER')
    .eq('status', 'ACTIVE')
    .order('name')
  return { workers: data || [], error: error?.message }
}

export async function createTaskAction(formData: FormData) {
  const supabase = await createClient()
  const dbClient = createAdminClient() || supabase

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { error: 'Unauthorized.' }

  const title = (formData.get('title') as string)?.trim() || ''
  const description = (formData.get('description') as string)?.trim() || undefined
  const instructions = (formData.get('instructions') as string)?.trim() || undefined
  const assigned_to = (formData.get('assigned_to') as string)?.trim() || ''
  const rawDeadline = (formData.get('deadline') as string)?.trim()
  const deadline = rawDeadline || undefined
  const zipUrlInput = (formData.get('zip_url_input') as string)?.trim() || undefined

  // Server-side validation (all optional fields passed as undefined or string, never null)
  const validation = createTaskSchema.safeParse({
    title,
    description,
    instructions,
    assigned_to,
    deadline,
    zip_url_input: zipUrlInput,
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Verify assigned user is an ACTIVE USER (never trust client)
  const { data: assignedWorker } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', assigned_to)
    .eq('role', 'USER')
    .eq('status', 'ACTIVE')
    .single() as { data: { id: string; name: string } | null }

  if (!assignedWorker) {
    return { error: 'Selected worker is not an active user.' }
  }

  // Check if a direct ZIP file package was uploaded
  const zipFile = formData.get('zip_file') as File | null
  let finalZipUrl = zipUrlInput
  let finalZipName = zipUrlInput ? 'External ZIP Link' : undefined

  if (zipFile && zipFile.size > 0) {
    const fileExt = zipFile.name.split('.').pop() || 'zip'
    const fileName = `zips/${Date.now()}_${zipFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { data: uploadData, error: uploadError } = await dbClient.storage
      .from('task-images')
      .upload(fileName, zipFile, { cacheControl: '3600', upsert: false })

    if (!uploadError && uploadData) {
      const { data: urlData } = dbClient.storage.from('task-images').getPublicUrl(uploadData.path)
      finalZipUrl = urlData.publicUrl
      finalZipName = zipFile.name
    } else if (uploadError) {
      return { error: 'Failed to upload ZIP package: ' + uploadError.message }
    }
  }

  // Create the task
  const { data: newTask, error: taskError } = await (dbClient.from('tasks') as any).insert({
    title,
    description: description || null,
    instructions: instructions || null,
    assigned_to,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    status: 'PENDING',
    zip_file_url: finalZipUrl || null,
    zip_file_name: finalZipName || null,
    created_by: authUser.id,
  }).select('id').single()

  if (taskError || !newTask) {
    return { error: 'Failed to create task: ' + taskError?.message }
  }

  const taskId = newTask.id

  // Handle source image uploads if any
  const images = formData.getAll('images') as File[]
  const validImages = images.filter((f) => f && f.size > 0)

  let imageOrder = 0
  for (const imageFile of validImages) {
    const fileExt = imageFile.name.split('.').pop() || 'jpg'
    const fileName = `tasks/${taskId}/${Date.now()}_${imageOrder}.${fileExt}`

    const { data: uploadData, error: uploadError } = await dbClient.storage
      .from('task-images')
      .upload(fileName, imageFile, { cacheControl: '3600', upsert: false })

    if (!uploadError && uploadData) {
      const { data: urlData } = dbClient.storage.from('task-images').getPublicUrl(uploadData.path)
      await (dbClient.from('task_images') as any).insert({
        task_id: taskId,
        image_url: urlData.publicUrl,
        image_order: imageOrder,
      })
      imageOrder++
    }
  }

  // Log to activity_logs
  await (dbClient.from('activity_logs') as any).insert({
    user_id: authUser.id,
    action: 'TASK_CREATED',
    description: `Admin created task "${title}" and assigned it to ${assignedWorker.name}.`,
  })

  revalidatePath('/admin/tasks')
  revalidatePath('/admin/dashboard')

  return { success: true, taskId }
}

export async function getAdminTasksAction(statusFilter: string = 'ALL') {
  const supabase = await createClient()

  let query = (supabase.from('tasks') as any)
    .select(`
      id,
      title,
      description,
      status,
      deadline,
      created_at,
      updated_at,
      assigned_user:users!tasks_assigned_to_fkey ( id, name, username ),
      creator:users!tasks_created_by_fkey ( id, name )
    `)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query
  return { tasks: data || [], error: error?.message }
}

export async function getAdminTaskDetailAction(taskId: string) {
  const supabase = await createClient()

  const { data: task, error } = await (supabase.from('tasks') as any)
    .select(`
      id, title, description, instructions, status, deadline, zip_file_url, zip_file_name, created_at, updated_at,
      assigned_user:users!tasks_assigned_to_fkey ( id, name, username, email ),
      creator:users!tasks_created_by_fkey ( id, name )
    `)
    .eq('id', taskId)
    .single()

  if (error || !task) return { task: null, images: [], submission: null, error: error?.message || 'Task not found' }

  const [imagesRes, submissionRes] = await Promise.all([
    supabase
      .from('task_images')
      .select('id, image_url, image_order')
      .eq('task_id', taskId)
      .order('image_order'),
    (supabase.from('submissions') as any)
      .select(`
        id, task_id, user_id, google_drive_url, submission_method, compiled_document_url, status, submitted_at, reviewed_at,
        failure_reason, allow_resubmission, created_at,
        reviewer:users!submissions_reviewed_by_fkey ( id, name )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    task,
    images: imagesRes.data || [],
    submission: submissionRes.data || null,
    error: null,
  }
}

export async function getWorkerTasksAction() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return { tasks: [], stats: null }

  const { data: tasks } = await (supabase.from('tasks') as any)
    .select('id, title, status, deadline, created_at, updated_at')
    .eq('assigned_to', authUser.id)
    .order('created_at', { ascending: false })

  const tasksList = tasks || []

  const stats = {
    pending: tasksList.filter((t: any) => t.status === 'PENDING').length,
    inProgress: tasksList.filter((t: any) => t.status === 'IN_PROGRESS').length,
    submitted: tasksList.filter((t: any) => t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW').length,
    passed: tasksList.filter((t: any) => t.status === 'PASSED').length,
    failed: tasksList.filter((t: any) => t.status === 'FAILED').length,
    total: tasksList.length,
  }

  return { tasks: tasksList, stats }
}

export async function getWorkerTaskDetailAction(taskId: string) {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return { task: null, images: [], submission: null, error: 'Unauthorized' }

  // RLS on the DB will enforce worker can only see their own task.
  const { data: task, error } = await (supabase.from('tasks') as any)
    .select('id, title, description, instructions, status, deadline, zip_file_url, zip_file_name, created_at, updated_at, assigned_to')
    .eq('id', taskId)
    .eq('assigned_to', authUser.id) // Double-check — belt & suspenders on top of RLS
    .single()

  if (error || !task) return { task: null, images: [], submission: null, error: 'Task not found or access denied.' }

  const [imagesRes, submissionRes] = await Promise.all([
    supabase
      .from('task_images')
      .select('id, image_url, image_order')
      .eq('task_id', taskId)
      .order('image_order'),
    (supabase.from('submissions') as any)
      .select(`
        id, task_id, user_id, google_drive_url, submission_method, compiled_document_url, status, submitted_at, reviewed_at,
        failure_reason, allow_resubmission, created_at,
        reviewer:users!submissions_reviewed_by_fkey ( id, name )
      `)
      .eq('task_id', taskId)
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    task,
    images: imagesRes.data || [],
    submission: submissionRes.data || null,
    error: null,
  }
}

export async function markTaskInProgressAction(taskId: string) {
  const supabase = await createClient()
  const dbClient = createAdminClient() || supabase

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return { error: 'Unauthorized' }

  // Verify task belongs to this worker before updating
  const { data: task } = await (supabase.from('tasks') as any)
    .select('id, status, assigned_to')
    .eq('id', taskId)
    .eq('assigned_to', authUser.id)
    .single()

  if (!task) return { error: 'Task not found.' }
  if (task.status !== 'PENDING') return { success: true } // Already progressed, no-op

  await (dbClient.from('tasks') as any)
    .update({ status: 'IN_PROGRESS' })
    .eq('id', taskId)

  await (dbClient.from('activity_logs') as any).insert({
    user_id: authUser.id,
    action: 'TASK_STARTED',
    description: `Worker started task ${taskId}.`,
  })

  revalidatePath(`/user/tasks/${taskId}`)
  revalidatePath('/user/dashboard')

  return { success: true }
}
