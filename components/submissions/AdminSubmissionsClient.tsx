'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileCheck,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Lock,
} from 'lucide-react'
import Shell from '@/components/layout/Shell'
import StatusBadge from '@/components/ui/StatusBadge'
import { getAdminSubmissionsAction, reviewSubmissionAction } from '@/app/actions/submissions'

interface SubmissionItem {
  id: string
  task_id: string
  user_id: string
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
    instructions: string | null
  } | null
  worker: {
    id: string
    name: string
    username: string
    email: string
  } | null
  reviewer: {
    id: string
    name: string
  } | null
}



const filterTabs = [
  { id: 'PENDING', label: 'Pending Review' },
  { id: 'PASSED', label: 'Passed' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'ALL', label: 'All Submissions' },
]

interface Props {
  adminName: string
  adminEmail: string
}

export default function AdminSubmissionsClient({ adminName, adminEmail }: Props) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null)

  // Review decision states
  const [reviewMode, setReviewMode] = useState<'IDLE' | 'FAIL_FORM'>('IDLE')
  const [failureReason, setFailureReason] = useState('')
  const [allowResubmission, setAllowResubmission] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadSubmissions = async (f: string) => {
    setLoading(true)
    const res = await getAdminSubmissionsAction(f)
    setSubmissions((res.submissions as unknown as SubmissionItem[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadSubmissions(filter)
  }, [filter])

  const openReviewModal = (sub: SubmissionItem) => {
    setSelectedSubmission(sub)
    setReviewMode('IDLE')
    setFailureReason(sub.failure_reason || '')
    setAllowResubmission(sub.allow_resubmission ?? true)
    setActionError(null)
  }

  const handlePass = async () => {
    if (!selectedSubmission) return
    setActionLoading(true)
    setActionError(null)

    const res = await reviewSubmissionAction({
      submissionId: selectedSubmission.id,
      taskId: selectedSubmission.task_id,
      decision: 'PASS',
    })

    setActionLoading(false)
    if (res.error) {
      setActionError(res.error)
    } else {
      setSelectedSubmission(null)
      loadSubmissions(filter)
    }
  }

  const handleFail = async () => {
    if (!selectedSubmission) return
    if (!failureReason.trim()) {
      setActionError('Please provide a reason explaining what needs to be fixed.')
      return
    }

    setActionLoading(true)
    setActionError(null)

    const res = await reviewSubmissionAction({
      submissionId: selectedSubmission.id,
      taskId: selectedSubmission.task_id,
      decision: 'FAIL',
      failureReason: failureReason.trim(),
      allowResubmission,
    })

    setActionLoading(false)
    if (res.error) {
      setActionError(res.error)
    } else {
      setSelectedSubmission(null)
      loadSubmissions(filter)
    }
  }

  return (
    <Shell role="ADMIN" userName={adminName} userEmail={adminEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <FileCheck className="h-7 w-7 text-emerald-400" />
              Review Queue &amp; Submissions
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Evaluate worker Google Drive document links, pass approved typing jobs, or fail with feedback.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
          {filterTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === t.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-400 mb-2" />
            <p>Loading submissions…</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <FileCheck className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Submissions Found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {filter === 'PENDING'
                ? 'All caught up! There are no worker submissions awaiting review.'
                : 'No submissions found under this filter.'}
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Worker</th>
                    <th className="px-6 py-4">Task Title</th>
                    <th className="px-6 py-4">Submitted Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-100">{sub.worker?.name || 'Unknown Worker'}</p>
                        <p className="text-xs text-indigo-400 font-mono">@{sub.worker?.username}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/tasks/${sub.task_id}`}
                          className="font-medium text-slate-200 hover:text-indigo-400 transition-colors line-clamp-1"
                        >
                          {sub.tasks?.title || 'Untitled Task'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-300">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openReviewModal(sub)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                          Review <ChevronRight className="h-3.5 w-3.5" />
                        </button>
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
                  onClick={() => openReviewModal(sub)}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 active:bg-slate-800/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-100">{sub.worker?.name}</p>
                      <p className="text-xs text-indigo-400 font-mono">@{sub.worker?.username}</p>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-1 font-medium">
                    Task: {sub.tasks?.title}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80">
                    <span>{new Date(sub.submitted_at).toLocaleDateString()}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      Review <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* REVIEW MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-emerald-400" />
                  Review Worker Submission
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Task: <span className="text-slate-200 font-semibold">{selectedSubmission.tasks?.title}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {actionError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Worker and Submission Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-950/70 border border-slate-800 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Worker</p>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">{selectedSubmission.worker?.name}</p>
                <p className="text-xs text-indigo-400 font-mono">@{selectedSubmission.worker?.username}</p>
                <p className="text-xs text-slate-500">{selectedSubmission.worker?.email}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Submission Timestamp</p>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">
                  {new Date(selectedSubmission.submitted_at).toLocaleString()}
                </p>
                <div className="mt-2">
                  <StatusBadge status={selectedSubmission.status} />
                </div>
              </div>
            </div>

            {/* Primary Document Link Action */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Google Drive Document</span>
                <span className="text-[11px] text-slate-400">External Document</span>
              </div>
              <p className="text-xs text-slate-300 font-mono truncate bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
                {selectedSubmission.google_drive_url}
              </p>
              <a
                href={selectedSubmission.google_drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/25"
              >
                <ExternalLink className="h-4 w-4" />
                Open Document in New Tab
              </a>
            </div>

            {/* Instructions reference (if available) */}
            {selectedSubmission.tasks?.instructions && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Instructions Reference</p>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-32 overflow-y-auto">
                  {selectedSubmission.tasks.instructions}
                </pre>
              </div>
            )}

            {/* Existing Failure Feedback (if already reviewed as FAILED) */}
            {selectedSubmission.status === 'FAILED' && selectedSubmission.failure_reason && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-400">Previous Failure Feedback</p>
                <p className="text-xs text-slate-200">{selectedSubmission.failure_reason}</p>
              </div>
            )}

            {/* FINALIZED DECISION NOTICE OR ACTIVE DECISION BUTTONS */}
            {selectedSubmission.status === 'PASSED' ||
            (selectedSubmission.status === 'FAILED' && !selectedSubmission.allow_resubmission) ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    This decision is finalized ({selectedSubmission.status}). The worker cannot edit or resubmit this task.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="w-full sm:w-auto rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            ) : reviewMode === 'FAIL_FORM' ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-rose-300">Explain Why Submission Failed</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Failure Reason / Instructions for Correction <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="e.g. Page 2 has several spelling errors in customer names. Rows 14 to 18 were skipped. Please correct and resubmit."
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    required
                  />
                </div>

                {/* Allow Resubmission Toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowResubmission}
                    onChange={(e) => setAllowResubmission(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Allow worker to fix and resubmit this task
                  </span>
                </label>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewMode('IDLE')}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFail}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 transition-all shadow-md shadow-rose-600/25 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Confirm Mark as Failed
                  </button>
                </div>
              </div>
            ) : (
              /* PRIMARY DECISION BUTTONS (PASS / FAIL) */
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => setReviewMode('FAIL_FORM')}
                  disabled={actionLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 px-5 py-2.5 text-xs font-semibold hover:bg-rose-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Mark as Failed
                </button>

                <button
                  type="button"
                  onClick={handlePass}
                  disabled={actionLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Pass Submission
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}
