'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTaskDocx, PageContent } from '@/lib/docx-generator'

/**
 * Autosaves the worker's typed text for a specific page of a task
 */
export async function savePageProgressAction(data: {
  taskId: string
  pageOrder: number
  taskImageId?: string | null
  typedText: string
}) {
  const supabase = await createClient()
  const dbClient = createAdminClient() || supabase

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { error: 'Unauthorized.' }

  const { taskId, pageOrder, taskImageId, typedText } = data

  // Verify task assignment
  const { data: task, error: taskFetchError } = await (supabase.from('tasks') as any)
    .select('id, status, assigned_to')
    .eq('id', taskId)
    .single()

  if (taskFetchError || !task) {
    return { error: 'Task not found.' }
  }

  if (task.assigned_to !== authUser.id) {
    return { error: 'You are not assigned to this task.' }
  }

  const now = new Date().toISOString()

  // Upsert progress row
  const { error: upsertError } = await (dbClient.from('task_page_progress') as any).upsert(
    {
      task_id: taskId,
      user_id: authUser.id,
      task_image_id: taskImageId || null,
      page_order: pageOrder,
      typed_text: typedText ?? '',
      updated_at: now,
    },
    {
      onConflict: 'task_id,user_id,page_order',
    }
  )

  if (upsertError) {
    return { error: 'Failed to autosave page progress: ' + upsertError.message }
  }

  return { success: true, updatedAt: now }
}

/**
 * Fetches all saved page progress for a worker on a task
 */
export async function getTaskPageProgressAction(taskId: string) {
  const supabase = await createClient()
  const dbClient = createAdminClient() || supabase

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { error: 'Unauthorized.', progress: [] }

  const { data, error } = await (dbClient.from('task_page_progress') as any)
    .select('id, page_order, typed_text, task_image_id, updated_at')
    .eq('task_id', taskId)
    .eq('user_id', authUser.id)
    .order('page_order', { ascending: true })

  if (error) {
    return { error: error.message, progress: [] }
  }

  return { progress: data || [] }
}

/**
 * Compiles all typed pages into a single .docx file, uploads to Supabase Storage, and submits task
 */
export async function compileAndSubmitDocxAction(taskId: string) {
  const supabase = await createClient()
  const dbClient = createAdminClient() || supabase

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { error: 'Unauthorized.' }

  // 1. Fetch user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', authUser.id)
    .single() as { data: { name: string; email: string } | null }

  const workerName = userProfile?.name || 'Worker'
  const workerEmail = userProfile?.email || ''

  // 2. Fetch task details & assigned images
  const { data: task, error: taskError } = await (supabase.from('tasks') as any)
    .select('id, title, status, assigned_to')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return { error: 'Task not found.' }
  }

  if (task.assigned_to !== authUser.id) {
    return { error: 'You are not assigned to this task.' }
  }

  // 3. Fetch images and saved typed text
  const { data: taskImages } = await (supabase.from('task_images') as any)
    .select('id, image_order')
    .eq('task_id', taskId)
    .order('image_order', { ascending: true })

  const { data: pageProgressList } = await (dbClient.from('task_page_progress') as any)
    .select('page_order, typed_text')
    .eq('task_id', taskId)
    .eq('user_id', authUser.id)
    .order('page_order', { ascending: true })

  const progressMap = new Map<number, string>()
  pageProgressList?.forEach((p: { page_order: number; typed_text: string }) => {
    progressMap.set(p.page_order, p.typed_text || '')
  })

  // Build page contents array
  const totalPages = Math.max(taskImages?.length || 1, pageProgressList?.length || 1)
  const pages: PageContent[] = []

  for (let i = 0; i < totalPages; i++) {
    pages.push({
      pageOrder: i,
      typedText: progressMap.get(i) || '',
    })
  }

  // 4. Generate the DOCX file
  let docxBuffer: Buffer
  try {
    docxBuffer = await generateTaskDocx({
      taskTitle: task.title,
      workerName,
      workerEmail,
      pages,
    })
  } catch (err: any) {
    return { error: 'Failed to compile Word document: ' + (err?.message || err) }
  }

  // 5. Upload DOCX to Supabase Storage
  const cleanTitle = task.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
  const fileName = `submissions/${taskId}/${Date.now()}_${cleanTitle}.docx`
  let compiledDocUrl: string | null = null

  // Try compiled-docs bucket first, fallback to task-images
  const bucketName = 'compiled-docs'
  const { data: uploadData, error: uploadError } = await dbClient.storage
    .from(bucketName)
    .upload(fileName, docxBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: true,
    })

  if (uploadError) {
    // Fallback to task-images bucket
    const { data: fallbackData, error: fallbackError } = await dbClient.storage
      .from('task-images')
      .upload(fileName, docxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      })

    if (fallbackError) {
      return { error: 'Failed to upload compiled document: ' + fallbackError.message }
    }
    const { data: urlData } = dbClient.storage.from('task-images').getPublicUrl(fallbackData.path)
    compiledDocUrl = urlData.publicUrl
  } else {
    const { data: urlData } = dbClient.storage.from(bucketName).getPublicUrl(uploadData.path)
    compiledDocUrl = urlData.publicUrl
  }

  const now = new Date().toISOString()

  // 6. Check for existing submission (for resubmissions)
  const { data: existingSub } = await (dbClient.from('submissions') as any)
    .select('id')
    .eq('task_id', taskId)
    .maybeSingle()

  let submissionId = ''

  if (existingSub) {
    const { data: updatedSub, error: updateError } = await (dbClient.from('submissions') as any)
      .update({
        submission_method: 'TYPED_DOCX',
        compiled_document_url: compiledDocUrl,
        google_drive_url: null,
        status: 'UNDER_REVIEW',
        submitted_at: now,
        reviewed_at: null,
        reviewed_by: null,
        failure_reason: null,
        allow_resubmission: true,
      })
      .eq('id', existingSub.id)
      .select('id')
      .single()

    if (updateError) return { error: 'Failed to update submission: ' + updateError.message }
    submissionId = updatedSub.id
  } else {
    const { data: newSub, error: insertError } = await (dbClient.from('submissions') as any)
      .insert({
        task_id: taskId,
        user_id: authUser.id,
        submission_method: 'TYPED_DOCX',
        compiled_document_url: compiledDocUrl,
        google_drive_url: null,
        status: 'UNDER_REVIEW',
        submitted_at: now,
        allow_resubmission: true,
      })
      .select('id')
      .single()

    if (insertError) return { error: 'Failed to create submission: ' + insertError.message }
    submissionId = newSub.id
  }

  // 7. Update parent task status to UNDER_REVIEW
  await (dbClient.from('tasks') as any)
    .update({ status: 'UNDER_REVIEW' })
    .eq('id', taskId)

  // 8. Log activity
  await (dbClient.from('activity_logs') as any).insert({
    user_id: authUser.id,
    action: 'SUBMISSION_CREATED',
    description: `Worker compiled and submitted in-platform Word document for task "${task.title}".`,
  })

  // 9. Revalidate all relevant pages
  revalidatePath(`/user/tasks/${taskId}`)
  revalidatePath('/user/tasks')
  revalidatePath('/user/dashboard')
  revalidatePath('/user/submissions')
  revalidatePath(`/admin/tasks/${taskId}`)
  revalidatePath('/admin/tasks')
  revalidatePath('/admin/submissions')
  revalidatePath('/admin/dashboard')

  return { success: true, submissionId, compiledDocUrl }
}
