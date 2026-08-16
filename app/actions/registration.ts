'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const registrationSchema = z.object({
  name: z.string().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Mobile number must be at least 10 digits'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  transaction_id: z.string().min(4, 'Transaction ID is required'),
  payment_amount: z.number().default(500),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegistrationInput = z.infer<typeof registrationSchema>

export async function registerUserAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const phone = (formData.get('phone') as string)?.trim()
  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const transaction_id = (formData.get('transaction_id') as string)?.trim()
  const payment_amount = parseFloat((formData.get('payment_amount') as string) || '500')
  const screenshotFile = formData.get('screenshot') as File | null

  // 1. Server-side Zod validation
  const validation = registrationSchema.safeParse({
    name,
    email,
    phone,
    username,
    password,
    confirmPassword,
    transaction_id,
    payment_amount,
  })

  if (!validation.success) {
    const issue = validation.error.issues[0]
    return { error: issue.message }
  }

  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  // Use admin client if available to bypass RLS during registration, otherwise fallback to server client
  const dbClient = adminSupabase || supabase

  // 2. Uniqueness & Status Check for existing user records
  const { data: existingUser } = await (dbClient.from('users') as any)
    .select('id, status, email, username')
    .or(`email.eq.${email},username.eq.${username}`)
    .maybeSingle()

  let userId: string | null = null

  if (existingUser) {
    if (existingUser.status === 'ACTIVE') {
      return { error: 'An active account with this email or username already exists. Please log in.' }
    } else if (existingUser.status === 'PENDING') {
      // User created previously. Reuse user ID to complete registration!
      userId = existingUser.id
    } else {
      return { error: `An account with this email exists and is currently ${existingUser.status}.` }
    }
  }

  // 3. Upload Payment Screenshot to Supabase Storage if present
  let screenshotUrl: string | null = null
  if (screenshotFile && screenshotFile.size > 0) {
    const fileExt = screenshotFile.name.split('.').pop() || 'png'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await dbClient.storage
      .from('payment-screenshots')
      .upload(fileName, screenshotFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (!uploadError && uploadData) {
      const { data: publicUrlData } = dbClient.storage
        .from('payment-screenshots')
        .getPublicUrl(uploadData.path)
      screenshotUrl = publicUrlData.publicUrl
    }
  }

  // 4. Create User in Supabase Auth if not already existing
  if (!userId) {
    if (adminSupabase) {
      // Use Admin API to create user without sending confirmation email -> avoids email rate limit completely!
      const { data: adminAuthData, error: adminAuthError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          phone,
          username,
          role: 'USER',
          status: 'PENDING',
        },
      })

      if (adminAuthError || !adminAuthData.user) {
        return { error: adminAuthError?.message || 'Failed to create user account.' }
      }
      userId = adminAuthData.user.id
    } else {
      // Standard Client fallback
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            username,
            role: 'USER',
            status: 'PENDING',
          },
        },
      })

      if (authData?.user) {
        userId = authData.user.id
      } else if (authError) {
        // If auth error occurred (like email rate limit), try to retrieve user if created
        const { data: createdProfile } = await (dbClient.from('users') as any)
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (createdProfile) {
          userId = createdProfile.id
        } else {
          return { error: authError.message }
        }
      }
    }
  }

  if (!userId) {
    return { error: 'Could not resolve user ID for registration.' }
  }

  // 5. Upsert profile in `public.users` table
  await (dbClient.from('users') as any).upsert({
    id: userId,
    name,
    email,
    phone,
    username,
    role: 'USER',
    status: 'PENDING',
  })

  // 6. Create or update `public.registrations` record
  const { data: existingReg } = await (dbClient.from('registrations') as any)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingReg) {
    const { error: updateError } = await (dbClient.from('registrations') as any)
      .update({
        transaction_id,
        payment_amount,
        payment_screenshot_url: screenshotUrl || undefined,
        status: 'PENDING',
      })
      .eq('id', existingReg.id)

    if (updateError) {
      console.error('Registration Update Error:', updateError)
      return { error: 'Failed to update payment details: ' + updateError.message }
    }
  } else {
    const { error: regError } = await (dbClient.from('registrations') as any).insert({
      user_id: userId,
      transaction_id,
      payment_amount,
      payment_screenshot_url: screenshotUrl,
      status: 'PENDING',
    })

    if (regError) {
      console.error('Registration Insert Error:', regError)
      return { error: 'Failed to record payment details: ' + regError.message }
    }
  }

  // 7. Log to activity_logs
  await (dbClient.from('activity_logs') as any).insert({
    user_id: userId,
    action: 'REGISTRATION_SUBMITTED',
    description: `User registration submitted by ${name} (${username}) with TxID ${transaction_id}.`,
  })

  // 8. Sign out user to ensure they remain unauthenticated until Admin approves
  await supabase.auth.signOut()

  return { success: true }
}
