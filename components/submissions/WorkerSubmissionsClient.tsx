'use client'

import Link from 'next/link'
import {
  FileCheck,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Calendar,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react'
import Shell from '@/components/layout/Shell'
import StatusBadge from '@/components/ui/StatusBadge'

export interface SubmissionItem {
  id: string
  task_id: string
  google_drive_url: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'PASSED' | 'FAILED'
  submitted_at: string
  reviewed_at: string | null
  failure_reason: string | null
  allow_resubmission: boolean
  created_at: string
  tasks: {
    id: string
    title: string
    status: string
    deadline: string | null
  } | null
  reviewer: {
    id: string
    name: string
  } | null
}

interface Props {
  submissions: SubmissionItem[]
  workerName: string
  workerEmail: string
}

export default function WorkerSubmissionsClient({ submissions, workerName, workerEmail }: Props) {
  return (
    <Shell role="USER" userName={workerName} userEmail={workerEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <FileCheck className="h-7 w-7 text-emerald-400" />
            My Submissions
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            History of all Google Drive documents you submitted for review.
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-16 text-center">
            <FileCheck className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Submissions Yet</h3>
            <p className="mt-1 text-xs text-slate-500">
              When you submit work on your assigned tasks, your submission history and review status will appear here.
            </p>
            <Link
              href="/user/tasks"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 px-4 py-2 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
            >
              <FolderPlus className="h-4 w-4" /> Go to My Tasks
            </Link>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Task</th>
                    <th className="px-6 py-4">Submitted Date</th>
                    <th className="px-6 py-4">Document</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/user/tasks/${sub.task_id}`}
                          className="font-semibold text-slate-100 hover:text-indigo-400 transition-colors line-clamp-1"
                        >
                          {sub.tasks?.title || 'Untitled Task'}
                        </Link>
                        {sub.status === 'FAILED' && sub.failure_reason && (
                          <p className="text-xs text-rose-400 mt-1 line-clamp-1 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            {sub.failure_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-300">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={sub.google_drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                        >
                          <ExternalLink className="h-3 w-3" /> View Doc
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/user/tasks/${sub.task_id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          View Task <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/user/tasks/${sub.task_id}`}
                      className="font-bold text-slate-100 line-clamp-2 hover:text-indigo-400"
                    >
                      {sub.tasks?.title}
                    </Link>
                    <StatusBadge status={sub.status} />
                  </div>

                  {sub.status === 'FAILED' && sub.failure_reason && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 space-y-1">
                      <p className="font-semibold flex items-center gap-1 text-rose-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> Reason for Failure:
                      </p>
                      <p>{sub.failure_reason}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/user/tasks/${sub.task_id}`}
                      className="text-emerald-400 font-semibold flex items-center gap-1"
                    >
                      Open Task <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Shell>
  )
}
