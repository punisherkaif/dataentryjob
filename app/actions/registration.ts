'use server'

import { createClient } from '@/lib/supabase/server'
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

  // 2. Uniqueness check for email and username
  const { data: existingEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single() as { data: { id: string } | null }

  if (existingEmail) {
    return { error: 'An account with this email already exists.' }
  }

  const { data: existingUsername } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single() as { data: { id: string } | null }

  if (existingUsername) {
    return { error: 'This username is already taken. Please choose another.' }
  }

  // 3. Upload Payment Screenshot to Supabase Storage if present
  let screenshotUrl: string | null = null
  if (screenshotFile && screenshotFile.size > 0) {
    const fileExt = screenshotFile.name.split('.').pop() || 'png'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, screenshotFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (!uploadError && uploadData) {
      const { data: publicUrlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(uploadData.path)
      screenshotUrl = publicUrlData.publicUrl
    }
  }

  // 4. Create User in Supabase Auth
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

  if (authError || !authData.user) {
    return { error: authError?.message || 'Failed to create registration account.' }
  }

  const userId = authData.user.id

  // 5. Ensure user profile exists in `public.users` table with status = 'PENDING'
  await (supabase.from('users') as any).upsert({
    id: userId,
    name,
    email,
    phone,
    username,
    role: 'USER',
    status: 'PENDING',
  })

  // 6. Create `public.registrations` record
  const { error: regError } = await (supabase.from('registrations') as any).insert({
    user_id: userId,
    transaction_id,
    payment_amount,
    payment_screenshot_url: screenshotUrl,
    status: 'PENDING',
  })

  if (regError) {
    return { error: 'Failed to record payment details. Please contact support.' }
  }

  // 7. Log to activity_logs
  await (supabase.from('activity_logs') as any).insert({
    user_id: userId,
    action: 'REGISTRATION_SUBMITTED',
    description: `New user registration submitted by ${name} (${username}) with TxID ${transaction_id}.`,
  })

  // 8. Sign out user to ensure they remain unauthenticated until Admin approves
  await supabase.auth.signOut()

  return { success: true }
}
