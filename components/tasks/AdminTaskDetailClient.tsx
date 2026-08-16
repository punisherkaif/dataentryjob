'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  ImageIcon,
  Clock,
  PlayCircle,
  UploadCloud,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  FileArchive,
  Download,
  Lock,
} from 'lucide-react'
import Shell from '@/components/layout/Shell'
import StatusBadge from '@/components/ui/StatusBadge'
import { reviewSubmissionAction } from '@/app/actions/submissions'

interface TaskImage {
  id: string
  image_url: string
  image_order: number
}

interface Submission {
  id: string
  task_id: string
  user_id: string
  google_drive_url: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'PASSED' | 'FAILED'
  submitted_at: string
  reviewed_at: string | null
  failure_reason: string | null
  allow_resubmission: boolean
  reviewer: { id: string; name: string } | null
}

interface Task {
  id: string
  title: string
  description: string | null
  instructions: string | null
  status: string
  deadline: string | null
  zip_file_url: string | null
  zip_file_name: string | null
  created_at: string
  updated_at: string
  assigned_user: { id: string; name: string; username: string; email: string } | null
  creator: { id: string; name: string } | null
}



interface Props {
  task: Task
  images: TaskImage[]
  submission: Submission | null
  adminName: string
  adminEmail: string
}

export default function AdminTaskDetailClient({
  task,
  images,
  submission: initialSubmission,
  adminName,
  adminEmail,
}: Props) {
  const [submission, setSubmission] = useState<Submission | null>(initialSubmission)
  const [currentStatus, setCurrentStatus] = useState(task.status)

  // Review states
  const [reviewMode, setReviewMode] = useState<'IDLE' | 'FAIL_FORM'>('IDLE')
  const [failureReason, setFailureReason] = useState(submission?.failure_reason || '')
  const [allowResubmission, setAllowResubmission] = useState(submission?.allow_resubmission ?? true)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)



  const handlePass = async () => {
    if (!submission) return
    setActionLoading(true)
    setActionError(null)

    const res = await reviewSubmissionAction({
      submissionId: submission.id,
      taskId: task.id,
      decision: 'PASS',
    })

    setActionLoading(false)
    if (res.error) {
      setActionError(res.error)
    } else {
      setCurrentStatus('PASSED')
      setSubmission((prev) =>
        prev
          ? {
              ...prev,
              status: 'PASSED',
              reviewed_at: new Date().toISOString(),
              reviewer: { id: '', name: adminName },
            }
          : null
      )
    }
  }

  const handleFail = async () => {
    if (!submission) return
    if (!failureReason.trim()) {
      setActionError('Please provide a failure reason explaining what needs to be corrected.')
      return
    }

    setActionLoading(true)
    setActionError(null)

    const res = await reviewSubmissionAction({
      submissionId: submission.id,
      taskId: task.id,
      decision: 'FAIL',
      failureReason: failureReason.trim(),
      allowResubmission,
    })

    setActionLoading(false)
    if (res.error) {
      setActionError(res.error)
    } else {
      setCurrentStatus('FAILED')
      setReviewMode('IDLE')
      setSubmission((prev) =>
        prev
          ? {
              ...prev,
              status: 'FAILED',
              failure_reason: failureReason.trim(),
              allow_resubmission: allowResubmission,
              reviewed_at: new Date().toISOString(),
              reviewer: { id: '', name: adminName },
            }
          : null
      )
    }
  }

  return (
    <Shell role="ADMIN" userName={adminName} userEmail={adminEmail}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button + Header */}
        <div className="flex items-start gap-4">
          <Link
            href="/admin/tasks"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-100">{task.title}</h1>
              <StatusBadge status={currentStatus} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Created {new Date(task.created_at).toLocaleString()} by {task.creator?.name || 'Admin'}
            </p>
          </div>
        </div>

        {/* Meta Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assigned To</p>
              <p className="text-sm font-semibold text-slate-200">{task.assigned_user?.name || 'Unassigned'}</p>
              {task.assigned_user?.username && (
                <p className="text-xs text-indigo-400 font-mono">@{task.assigned_user.username}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Deadline</p>
              <p className="text-sm font-semibold text-slate-200">
                {task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Source Images</p>
              <p className="text-sm font-semibold text-slate-200">{images.length} image{images.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SUBMISSION REVIEW PANEL (IF SUBMISSION EXISTS) */}
        {/* ============================================================ */}
        {submission && (
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-bold text-slate-100">Worker Submission</h2>
              </div>
              <StatusBadge status={submission.status} />
            </div>

            {actionError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Submitted Timestamp</p>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">
                  {new Date(submission.submitted_at).toLocaleString()}
                </p>
                {submission.reviewed_at && (
                  <p className="text-xs text-slate-400 mt-1">
                    Reviewed on {new Date(submission.reviewed_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 flex flex-col justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Google Drive Document</p>
                  <p className="text-xs text-slate-300 font-mono truncate mt-0.5">{submission.google_drive_url}</p>
                </div>
                <a
                  href={submission.google_drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Document in New Tab
                </a>
              </div>
            </div>

            {/* Failure Reason box if already failed */}
            {submission.status === 'FAILED' && submission.failure_reason && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-400">Failure Reason Recorded</p>
                <p className="text-xs text-slate-200">{submission.failure_reason}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Resubmission allowed: {submission.allow_resubmission ? 'Yes' : 'No'}
                </p>
              </div>
            )}

            {/* FINALIZED DECISION NOTICE OR ACTIVE DECISION BUTTONS */}
            {submission.status === 'PASSED' || (submission.status === 'FAILED' && !submission.allow_resubmission) ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-xs text-slate-400">
                <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  This submission decision is finalized ({submission.status}). The worker cannot edit or resubmit this task.
                </span>
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
                    placeholder="e.g. Please fix typos in names on page 1 and complete the last table."
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    required
                  />
                </div>

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
              /* PASS / FAIL BUTTONS */
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
        )}

        {/* Archive Package Card if attached */}
        {task.zip_file_url && (
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <FileArchive className="h-5 w-5" />
                <span>Source Archive Package Attached</span>
              </div>
              <span className="text-[11px] text-indigo-300/80 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-mono">
                ZIP / RAR / 7Z
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {task.zip_file_name || 'Source_Package.zip'}
                </p>
                <p className="text-[11px] text-slate-500 truncate font-mono">{task.zip_file_url}</p>
              </div>
              <a
                href={task.zip_file_url}
                target="_blank"
                rel="noopener noreferrer"
                download={task.zip_file_name || 'source_package.zip'}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 shrink-0"
              >
                <Download className="h-4 w-4" />
                Download Archive File
              </a>
            </div>
          </div>
        )}

        {/* Task Details and Source Images Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Description & Instructions */}
          <div className="lg:col-span-5 space-y-4">
            {task.description && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                  <FileText className="h-4 w-4" /> Description
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>
              </div>
            )}

            {task.instructions && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-900/10 p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-3">
                  <FileText className="h-4 w-4" /> Worker Instructions
                </h2>
                <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{task.instructions}</pre>
              </div>
            )}
          </div>

          {/* Source Images Grid */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-4">
              <ImageIcon className="h-4 w-4" /> Source Images
              <span className="ml-auto text-slate-600">{images.length} total</span>
            </h2>

            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-600 rounded-xl border border-dashed border-slate-800">
                <ImageIcon className="h-8 w-8 mb-2" />
                <p className="text-xs">No images uploaded</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                {images.map((img: { id: string; image_url: string; image_order: number }) => (
                  <div key={img.id} className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <div className="absolute top-2 left-2 rounded-lg bg-slate-900/80 px-2 py-0.5 text-[11px] font-bold text-slate-300 z-10">
                      #{img.image_order + 1}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <a href={img.image_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={img.image_url}
                        alt={`Source image ${img.image_order + 1}`}
                        className="w-full object-contain max-h-64 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
