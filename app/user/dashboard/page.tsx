import Shell from '@/components/layout/Shell'
import { createClient } from '@/lib/supabase/server'
import { FolderPlus, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react'

export default async function WorkerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let userName = 'Worker'
  let userEmail = authUser?.email || ''

  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('name')
      .eq('id', authUser.id)
      .single() as { data: { name: string } | null }
    if (profile?.name) userName = profile.name
  }

  return (
    <Shell role="USER" userName={userName} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Page Banner */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-6 shadow-xl">
          <h1 className="text-2xl font-extrabold text-white">Worker Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">
            Welcome back, <span className="font-semibold text-emerald-400">{userName}</span>. Access your assigned tasks and submit your Google Drive work links.
          </p>
        </div>

        {/* Responsive Grid Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Assigned Tasks
              </span>
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <FolderPlus className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-100">0</p>
            <p className="mt-1 text-xs text-slate-500">Tasks awaiting completion</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Submitted Work
              </span>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <FileCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-100">0</p>
            <p className="mt-1 text-xs text-slate-500">Pending admin review</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Passed Tasks
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-100">0</p>
            <p className="mt-1 text-xs text-slate-500">Approved by admin</p>
          </div>
        </div>

        {/* Skeleton Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <h2 className="text-lg font-bold text-slate-200">Worker Interface Ready</h2>
          <p className="mt-2 text-xs text-slate-400 max-w-xl mx-auto">
            Your worker session is active and secure. Assigned tasks with source images and Google Drive link submission forms will appear here when created by admins in Phase 3 & 4.
          </p>
        </div>
      </div>
    </Shell>
  )
}
