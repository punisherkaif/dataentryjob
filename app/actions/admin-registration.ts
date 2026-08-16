'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getRegistrationsAction(statusFilter: string = 'ALL') {
  const supabase = await createClient()

  // 1. Auto-heal: Check for any pending users in `public.users` missing a `registrations` record
  const { data: orphanedPendingUsers } = await supabase
    .from('users')
    .select('id, name, username')
    .eq('role', 'USER')
    .eq('status', 'PENDING') as { data: { id: string; name: string; username: string }[] | null }

  if (orphanedPendingUsers && orphanedPendingUsers.length > 0) {
    for (const user of orphanedPendingUsers) {
      const { data: existingReg } = await (supabase.from('registrations') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existingReg) {
        await (supabase.from('registrations') as any).insert({
          user_id: user.id,
          transaction_id: 'PENDING_VERIFICATION',
          payment_amount: 500.00,
          status: 'PENDING',
        })
      }
    }
  }

  // 2. Query all registrations
  let query = (supabase.from('registrations') as any)
    .select(`
      id,
      user_id,
      transaction_id,
      payment_amount,
      payment_screenshot_url,
      status,
      admin_note,
      created_at,
      reviewed_at,
      users!inner (
        name,
        email,
        phone,
        username,
        status
      )
    `)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching registrations:', error)
    return { error: error.message, registrations: [] }
  }

  return { registrations: data || [] }
}

export async function approveRegistrationAction(registrationId: string, userId: string) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { error: 'Unauthorized action.' }
  }

  // 1. Update user status to ACTIVE
  const { error: userError } = await (supabase.from('users') as any)
    .update({ status: 'ACTIVE' })
    .eq('id', userId)

  if (userError) {
    return { error: 'Failed to activate user account: ' + userError.message }
  }

  // 2. Update registration status to APPROVED
  const { error: regError } = await (supabase.from('registrations') as any)
    .update({
      status: 'APPROVED',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  if (regError) {
    return { error: 'Failed to update registration record: ' + regError.message }
  }

  // 3. Log to activity_logs
  await (supabase.from('activity_logs') as any).insert({
    user_id: authUser.id,
    action: 'REGISTRATION_APPROVED',
    description: `Admin approved user registration for user ID ${userId}.`,
  })

  revalidatePath('/admin/registrations')
  revalidatePath('/admin/dashboard')

  return { success: true }
}

export async function rejectRegistrationAction(
  registrationId: string,
  userId: string,
  adminNote?: string
) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { error: 'Unauthorized action.' }
  }

  // 1. Update user status to REJECTED
  const { error: userError } = await (supabase.from('users') as any)
    .update({ status: 'REJECTED' })
    .eq('id', userId)

  if (userError) {
    return { error: 'Failed to update user status: ' + userError.message }
  }

  // 2. Update registration status to REJECTED
  const { error: regError } = await (supabase.from('registrations') as any)
    .update({
      status: 'REJECTED',
      admin_note: adminNote || 'Registration rejected by admin.',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  if (regError) {
    return { error: 'Failed to update registration record: ' + regError.message }
  }

  // 3. Log to activity_logs
  await (supabase.from('activity_logs') as any).insert({
    user_id: authUser.id,
    action: 'REGISTRATION_REJECTED',
    description: `Admin rejected user registration for user ID ${userId}. Note: ${adminNote || 'None'}`,
  })

  revalidatePath('/admin/registrations')
  revalidatePath('/admin/dashboard')

  return { success: true }
}

export async function getAdminDashboardStatsAction() {
  const supabase = await createClient()

  // Auto-heal check for pending counts
  const { data: orphanedPendingUsers } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'USER')
    .eq('status', 'PENDING') as { data: { id: string }[] | null }

  if (orphanedPendingUsers && orphanedPendingUsers.length > 0) {
    for (const user of orphanedPendingUsers) {
      const { data: existingReg } = await (supabase.from('registrations') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existingReg) {
        await (supabase.from('registrations') as any).insert({
          user_id: user.id,
          transaction_id: 'PENDING_VERIFICATION',
          payment_amount: 500.00,
          status: 'PENDING',
        })
      }
    }
  }

  const [usersCountRes, pendingRegsCountRes, logsRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'USER').eq('status', 'ACTIVE'),
    supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('activity_logs').select('id, action, description, created_at').order('created_at', { ascending: false }).limit(6),
  ])

  return {
    activeWorkersCount: usersCountRes.count || 0,
    pendingRegistrationsCount: pendingRegsCountRes.count || 0,
    recentActivityLogs: logsRes.data || [],
  }
}
