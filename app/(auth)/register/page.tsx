'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Mail,
  Phone,
  AtSign,
  KeyRound,
  QrCode,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Clock,
  Sparkles,
} from 'lucide-react'
import { APP_CONFIG } from '@/config/app.config'
import { registerUserAction } from '@/app/actions/registration'

const registrationFormSchema = z
  .object({
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegistrationFormValues = z.infer<typeof registrationFormSchema>

export default function RegisterPage() {
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshotFileName(e.target.files[0].name)
    }
  }

  const onSubmit = async (data: RegistrationFormValues) => {
    setErrorMsg(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('email', data.email)
    formData.append('phone', data.phone)
    formData.append('username', data.username)
    formData.append('password', data.password)
    formData.append('confirmPassword', data.confirmPassword)
    formData.append('transaction_id', data.transaction_id)
    formData.append('payment_amount', APP_CONFIG.payment.feeAmount.toString())

    const fileInput = document.getElementById('screenshot-file-input') as HTMLInputElement
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append('screenshot', fileInput.files[0])
    }

    try {
      const res = await registerUserAction(formData)
      setLoading(false)
      if (res?.error) {
        setErrorMsg(res.error)
      } else if (res?.success) {
        setSubmittedSuccess(true)
      }
    } catch {
      setLoading(false)
      setErrorMsg('An unexpected error occurred during registration. Please try again.')
    }
  }

  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-2xl text-center relative z-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/10">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Registration Submitted!
          </h1>

          <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-2">
            <p className="text-xs text-slate-400">
              Thank you for registering. Your payment verification and account request have been submitted to our administrative team.
            </p>
            <div className="flex items-center gap-2 text-xs text-indigo-400 pt-2 border-t border-slate-800/80 font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Status: PENDING ADMIN APPROVAL</span>
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-400 leading-relaxed">
            Once an admin verifies your UPI transaction ID, your account will be activated and you will be able to log in with your credentials.
          </p>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25"
            >
              Go to Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 font-bold text-white shadow-xl shadow-indigo-500/20 mb-3">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Worker Registration
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Fill in your account details, complete the manual UPI payment, and submit for admin approval.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SECTION 1: Personal & Account Details (7 Cols on Desktop) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100">1. Account Information</h2>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Full Name
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="John Doe"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="mt-1.5 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="john@example.com"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Mobile Number
                </label>
                <div className="mt-1.5 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="9876543210"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-rose-400">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Choose Username
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <AtSign className="h-4 w-4" />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  placeholder="johndoe99"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-rose-400">{errors.username.message}</p>}
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <div className="mt-1.5 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                <div className="mt-1.5 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Payment & Verification (5 Cols on Desktop) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl space-y-5 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-bold text-slate-100">2. Manual UPI Payment</h2>
              </div>

              {/* QR Code Placeholder Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-center">
                <div className="mx-auto mb-2 flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-md">
                  {/* Decorative QR Code SVG */}
                  <svg className="h-full w-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="10" y="10" width="25" height="25" fill="black" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="18" y="18" width="9" height="9" fill="black" />
                    <rect x="65" y="10" width="25" height="25" fill="black" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="73" y="18" width="9" height="9" fill="black" />
                    <rect x="10" y="65" width="25" height="25" fill="black" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="18" y="73" width="9" height="9" fill="black" />
                    <rect x="45" y="45" width="10" height="10" fill="black" />
                    <rect x="60" y="60" width="20" height="20" fill="black" />
                    <rect x="40" y="70" width="10" height="20" fill="black" />
                    <rect x="70" y="40" width="20" height="10" fill="black" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Scan QR Code to Pay Registration Fee</p>
                  <p className="text-base font-extrabold text-emerald-400">
                    {APP_CONFIG.payment.currencySymbol}{APP_CONFIG.payment.feeAmount.toFixed(2)}
                  </p>
                  <div className="inline-block rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-slate-800">
                    UPI ID: <span className="text-indigo-400 font-semibold">{APP_CONFIG.payment.upiId}</span>
                  </div>
                </div>
              </div>

              {/* Transaction ID Input */}
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Transaction ID / UTR Number <span className="text-rose-400">*</span>
                </label>
                <input
                  {...register('transaction_id')}
                  type="text"
                  placeholder="e.g. 324109857201"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {errors.transaction_id && (
                  <p className="mt-1 text-xs text-rose-400">{errors.transaction_id.message}</p>
                )}
              </div>

              {/* Optional Payment Screenshot Upload */}
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Payment Screenshot (Optional)
                </label>
                <div className="mt-1.5 flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-950/50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                      <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs text-slate-400">
                        {screenshotFileName ? (
                          <span className="text-indigo-400 font-semibold">{screenshotFileName}</span>
                        ) : (
                          'Click to upload payment screenshot'
                        )}
                      </p>
                    </div>
                    <input
                      id="screenshot-file-input"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button & Links */}
            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50"
              >
                {loading ? (
                  <span>Submitting Registration...</span>
                ) : (
                  <>
                    <span>Submit & Request Approval</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Already registered?{' '}
                  <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
