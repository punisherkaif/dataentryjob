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

export default async function WorkerTasksPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', authUser.id)
    .single() as { data: { name: string; role: string } | null }

  if (profile?.role !== 'USER') redirect('/admin/dashboard')

  const { tasks } = await getWorkerTasksAction()

  const isOverdue = (deadline: string | null, status: string) => {
    if (!deadline || status === 'PASSED') return false
    return new Date(deadline) < new Date()
  }

  return (
    <Shell role="USER" userName={profile?.name || 'Worker'} userEmail={authUser.email || ''}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <FolderPlus className="h-7 w-7 text-indigo-400" />
            My Assigned Tasks
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            All tasks assigned to you. Click any task to view source images and get started.
          </p>
        </div>

        {!tasks || tasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-16 text-center">
            <FolderPlus className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Tasks Assigned Yet</h3>
            <p className="mt-1 text-xs text-slate-500">Your admin will assign tasks to you. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Task Title</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {(tasks as any[]).map((task) => (
                    <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-100 line-clamp-1">{task.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        {task.deadline ? (
                          <span className={`text-xs font-mono flex items-center gap-1 ${isOverdue(task.deadline, task.status) ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {isOverdue(task.deadline, task.status) && <AlertCircle className="h-3.5 w-3.5" />}
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        ) : <span className="text-slate-500 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {new Date(task.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/user/tasks/${task.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          Open Task <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {(tasks as any[]).map((task) => (
                <Link
                  key={task.id}
                  href={`/user/tasks/${task.id}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 active:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-100 leading-tight">{task.title}</h3>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {task.deadline && (
                      <span className={`flex items-center gap-1 ${isOverdue(task.deadline, task.status) ? 'text-rose-400 font-bold' : ''}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(task.deadline).toLocaleDateString()}
                        {isOverdue(task.deadline, task.status) && ' — OVERDUE'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                    Tap to open task <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Shell>
  )
}
