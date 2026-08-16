'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Shell from '@/components/layout/Shell'
import StatusBadge from '@/components/ui/StatusBadge'
import { getAdminTasksAction } from '@/app/actions/tasks'
import {
  FolderPlus,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  PlayCircle,
  UploadCloud,
  Eye,
  Plus,
  ChevronRight,
  Calendar,
  User,
} from 'lucide-react'

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'PASSED' | 'FAILED'

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  deadline: string | null
  created_at: string
  assigned_user: { id: string; name: string; username: string } | null
  creator: { id: string; name: string } | null
}



const filterTabs = ['ALL', 'PENDING', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'PASSED', 'FAILED']
const filterLabels: Record<string, string> = {
  ALL: 'All',
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Review',
  PASSED: 'Passed',
  FAILED: 'Failed',
}

interface Props {
  adminName: string
  adminEmail: string
}

export default function AdminTasksClient({ adminName, adminEmail }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const loadTasks = async (f: string) => {
    setLoading(true)
    const res = await getAdminTasksAction(f)
    setTasks(res.tasks as unknown as Task[])
    setLoading(false)
  }

  useEffect(() => { loadTasks(filter) }, [filter])

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <Shell role="ADMIN" userName={adminName} userEmail={adminEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <FolderPlus className="h-7 w-7 text-cyan-400" />
              Task Management
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Create and manage data-entry tasks assigned to workers.
            </p>
          </div>
          <Link
            href="/admin/tasks/create"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Create New Task
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
          {filterTabs.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-400 mb-2" />
            <p>Loading tasks…</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <FolderPlus className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Tasks Found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {filter === 'ALL' ? 'Create your first task to get started.' : `No tasks with status "${filterLabels[filter]}".`}
            </p>
            <Link
              href="/admin/tasks/create"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600/20 text-cyan-400 px-4 py-2 text-xs font-semibold hover:bg-cyan-600/30 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Task
            </Link>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Task Title</th>
                    <th className="px-6 py-4">Assigned To</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-100 line-clamp-1">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {task.assigned_user ? (
                          <div>
                            <p className="text-sm font-medium text-slate-200">{task.assigned_user.name}</p>
                            <p className="text-xs text-indigo-400 font-mono">@{task.assigned_user.username}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {task.deadline ? (
                          <span className={`text-xs font-mono ${isOverdue(task.deadline) && task.status !== 'PASSED' ? 'text-rose-400' : 'text-slate-300'}`}>
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">No deadline</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/tasks/${task.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                          View <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/admin/tasks/${task.id}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 hover:border-indigo-500/50 transition-colors active:bg-slate-800/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-100 line-clamp-2">{task.title}</h3>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {task.assigned_user && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {task.assigned_user.name}
                      </span>
                    )}
                    {task.deadline && (
                      <span className={`flex items-center gap-1 ${isOverdue(task.deadline) && task.status !== 'PASSED' ? 'text-rose-400' : ''}`}>
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
    </Shell>
  )
}
