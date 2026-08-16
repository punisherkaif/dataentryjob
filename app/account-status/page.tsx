import Link from 'next/link'
import { Clock, XCircle, ShieldAlert, CheckCircle2 } from 'lucide-react'
import LogoutButton from '@/components/ui/LogoutButton'
import { createClient } from '@/lib/supabase/server'

export default async function AccountStatusPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let status: 'PENDING' | 'REJECTED' | 'SUSPENDED' | 'ACTIVE' = 'PENDING'
  let userName = authUser?.email || 'User'

  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('status, name')
      .eq('id', authUser.id)
      .single() as { data: { status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'; name: string } | null }

    if (profile) {
      status = profile.status
      if (profile.name) userName = profile.name
    }
  }

  const statusConfig = {
    PENDING: {
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      title: 'Registration Pending Approval',
      description:
        'Your registration payment is currently under review by our administrative team. Once approved, you will gain full access to your worker dashboard.',
    },
    REJECTED: {
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      title: 'Account Registration Rejected',
      description:
        'Your payment transaction or registration details could not be verified by the admin team. Please contact support if you believe this is an error.',
    },
    SUSPENDED: {
      icon: ShieldAlert,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      title: 'Account Suspended',
      description:
        'Your account has been suspended by an administrator. Please reach out to administrative support for further details.',
    },
    ACTIVE: {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      title: 'Account Active',
      description: 'Your account is active and verified.',
    },
  }

  const currentStatus = statusConfig[status] || statusConfig.PENDING
  const Icon = currentStatus.icon

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-2xl text-center">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${currentStatus.bgColor} ${currentStatus.color} border ${currentStatus.borderColor}`}>
          <Icon className="h-8 w-8" />
        </div>

        <h1 className="text-xl font-bold text-slate-100">{currentStatus.title}</h1>
        <p className="mt-1 text-xs text-slate-400">Account: {userName}</p>

        <p className="mt-4 text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          {currentStatus.description}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {status === 'ACTIVE' && (
            <Link
              href="/user/dashboard"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors"
            >
              Go to Dashboard
            </Link>
          )}

          <LogoutButton className="w-full justify-center bg-slate-800 hover:bg-slate-700 text-slate-200" variant="full" />
        </div>
      </div>
    </div>
  )
}
