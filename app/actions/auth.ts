'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: { email?: string; username?: string; password?: string }) {
  const { email, password } = formData

  if (!email || !password) {
    return { error: 'Email/Username and Password are required.' }
  }

  const supabase = await createClient()

  // Support logging in via email or username
  let targetEmail = email.trim()

  if (!targetEmail.includes('@')) {
    // If input is username, look up the email
    const { data: userLookup } = await supabase
      .from('users')
      .select('email')
      .eq('username', targetEmail)
      .single() as { data: { email: string } | null }

    if (!userLookup?.email) {
      return { error: 'Invalid username or password.' }
    }
    targetEmail = userLookup.email
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data?.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', data.user.id)
      .single() as { data: { role: 'ADMIN' | 'USER'; status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' } | null }

    if (profile) {
      if (profile.status !== 'ACTIVE') {
        redirect('/account-status')
      }
      if (profile.role === 'ADMIN') {
        redirect('/admin/dashboard')
      } else {
        redirect('/user/dashboard')
      }
    }
  }

  redirect('/user/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPasswordRequestAction(email: string) {
  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password reset email sent! Check your inbox.' }
}
