import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWorkerTasksAction } from '@/app/actions/tasks'
import Shell from '@/components/layout/Shell'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  FolderPlus,
  FileCheck,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Clock,
  ChevronRight,
  Calendar,
  AlertCircle,
} from 'lucide-react'

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'PASSED' | 'FAILED'

export default async function WorkerDashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, status')
    .eq('id', authUser.id)
    .single() as { data: { name: string; role: string; status: string } | null }

  if (profile?.role !== 'USER') redirect('/admin/dashboard')
  if (profile?.status !== 'ACTIVE') redirect('/account-status')

  const { tasks, stats } = await getWorkerTasksAction()

  const isOverdue = (deadline: string | null, status: string) => {
    if (!deadline || status === 'PASSED') return false
    return new Date(deadline) < new Date()
  }

  return (
    <Shell role="USER" userName={profile?.name || 'Worker'} userEmail={authUser.email || ''}>
      <div className="space-y-6">
        {/* Page Banner */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-6 shadow-xl">
          <h1 className="text-2xl font-extrabold text-white">Worker Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">
            Welcome back, <span className="font-semibold text-emerald-400">{profile?.name || 'Worker'}</span>.
            {stats && stats.total > 0
              ? ` You have ${stats.pending + stats.inProgress} task${stats.pending + stats.inProgress !== 1 ? 's' : ''} to work on.`
              : ' No tasks assigned yet — check back soon.'}
          </p>
        </div>

        {/* Live Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' },
              { label: 'In Progress', value: stats.inProgress, icon: PlayCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Submitted', value: stats.submitted, icon: FileCheck, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { label: 'Passed', value: stats.passed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
                  <div className={`rounded-lg ${bg} p-1.5`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-indigo-400" /> My Tasks
            </h2>
            <Link href="/user/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              View all →
            </Link>
          </div>

          {!tasks || tasks.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <FolderPlus className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No Tasks Yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                Your admin will assign tasks to you shortly. Check back soon!
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Task Title</th>
                      <th className="px-5 py-4">Deadline</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {(tasks as any[]).slice(0, 10).map((task) => (
                      <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-100 line-clamp-1">{task.title}</p>
                        </td>
                        <td className="px-5 py-4">
                          {task.deadline ? (
                            <span className={`text-xs font-mono flex items-center gap-1 ${isOverdue(task.deadline, task.status) ? 'text-rose-400' : 'text-slate-300'}`}>
                              {isOverdue(task.deadline, task.status) && <AlertCircle className="h-3.5 w-3.5" />}
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/user/tasks/${task.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            Open <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {(tasks as any[]).slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    href={`/user/tasks/${task.id}`}
                    className="block rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 active:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-slate-100 line-clamp-2">{task.title}</h3>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {task.deadline && (
                        <span className={`flex items-center gap-1 ${isOverdue(task.deadline, task.status) ? 'text-rose-400' : ''}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Shell>
  )
}
