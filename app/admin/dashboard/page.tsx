import Shell from '@/components/layout/Shell'
import { createClient } from '@/lib/supabase/server'
import { getAdminDashboardStatsAction } from '@/app/actions/admin-registration'
import { Users, FileCheck, FolderPlus, Clock, Activity, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let userName = 'Admin'
  let userEmail = authUser?.email || ''

  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('name')
      .eq('id', authUser.id)
      .single() as { data: { name: string } | null }
    if (profile?.name) userName = profile.name
  }

  // Fetch real counts & activity logs
  const stats = await getAdminDashboardStatsAction()

  return (
    <Shell role="ADMIN" userName={userName} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Page Banner */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Admin Control Center</h1>
            <p className="mt-1 text-sm text-slate-300">
              Welcome back, <span className="font-semibold text-indigo-400">{userName}</span>. Manage worker registrations, task assignments, and submission reviews.
            </p>
          </div>

          <Link
            href="/admin/registrations"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 self-start sm:self-auto"
          >
            Review Registrations ({stats.pendingRegistrationsCount})
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Live Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/registrations"
            className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg hover:border-indigo-500/50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200">
                Pending Registrations
              </span>
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-100">{stats.pendingRegistrationsCount}</p>
            <p className="mt-1 text-xs text-amber-400 font-medium">Awaiting manual approval</p>
          </Link>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Workers
              </span>
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-100">{stats.activeWorkersCount}</p>
            <p className="mt-1 text-xs text-slate-500">Approved platform users</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Tasks
              </span>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <FolderPlus className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-100">0</p>
            <p className="mt-1 text-xs text-slate-500">Phase 3 Task assignment</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Submissions to Review
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <FileCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-100">0</p>
            <p className="mt-1 text-xs text-slate-500">Phase 4 Drive link reviews</p>
          </div>
        </div>

        {/* Recent Activity Log Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Recent System Activity
            </h2>
            <span className="text-xs font-semibold text-slate-500">Audit Log</span>
          </div>

          {stats.recentActivityLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No recent activity logged yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivityLogs.map((log: { id: string; action: string; description: string | null; created_at: string }) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 gap-2"
                >
                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-400 uppercase">
                      {log.action}
                    </span>
                    <p className="text-xs text-slate-300">{log.description}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 self-start sm:self-auto">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}
