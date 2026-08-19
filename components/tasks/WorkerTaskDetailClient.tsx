'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  ImageIcon,
  FileText,
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  Eye,
  Info,
  ZoomIn,
  Loader2,
  ExternalLink,
  Send,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  FileArchive,
  Download,
  Keyboard,
  Link2,
} from 'lucide-react'
import Shell from '@/components/layout/Shell'
import StatusBadge from '@/components/ui/StatusBadge'
import TypingWorkspace from '@/components/tasks/TypingWorkspace'
import { markTaskInProgressAction } from '@/app/actions/tasks'
import { submitWorkAction } from '@/app/actions/submissions'
import { getTaskPageProgressAction } from '@/app/actions/typing-workspace'

interface TaskImage {
  id: string
  image_url: string
  image_order: number
}

interface Submission {
  id: string
  google_drive_url: string | null
  submission_method?: 'DRIVE_LINK' | 'TYPED_DOCX'
  compiled_document_url?: string | null
  status: string
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
  assigned_to: string
}

interface Props {
  task: Task
  images: TaskImage[]
  submission: Submission | null
  workerName: string
  workerEmail: string
}

export default function WorkerTaskDetailClient({
  task,
  images,
  submission: initialSubmission,
  workerName,
  workerEmail,
}: Props) {
  const [starting, setStarting] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState(task.status)
  const [submission, setSubmission] = useState<Submission | null>(initialSubmission)

  // In-platform workspace state
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [pageProgress, setPageProgress] = useState<{ page_order: number; typed_text: string; task_image_id?: string | null }[]>([])
  const [loadingWorkspace, setLoadingWorkspace] = useState(false)

  // Form state for external Google Drive link
  const [driveUrl, setDriveUrl] = useState(initialSubmission?.google_drive_url || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Load progress when launching workspace
  const handleOpenWorkspace = async () => {
    setLoadingWorkspace(true)
    const res = await getTaskPageProgressAction(task.id)
    setLoadingWorkspace(false)
    if (res.progress) {
      setPageProgress(res.progress)
    }
    setIsWorkspaceOpen(true)
  }

  // Handle in-platform workspace compile completion
  const handleWorkspaceComplete = (data: { submissionId: string; compiledDocUrl: string }) => {
    setIsWorkspaceOpen(false)
    setCurrentStatus('UNDER_REVIEW')
    setSubmitSuccess(true)
    setSubmission((prev) => ({
      id: data.submissionId || prev?.id || '',
      google_drive_url: null,
      submission_method: 'TYPED_DOCX',
      compiled_document_url: data.compiledDocUrl,
      status: 'UNDER_REVIEW',
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      failure_reason: null,
      allow_resubmission: true,
      reviewer: null,
    }))
  }

  const handleStartTask = async () => {
    setStarting(true)
    const res = await markTaskInProgressAction(task.id)
    setStarting(false)
    if (!res.error) {
      setCurrentStatus('IN_PROGRESS')
    }
  }

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    const trimmedUrl = driveUrl.trim()
    if (!trimmedUrl) {
      setSubmitError('Please enter your Google Drive document link.')
      return
    }

    try {
      const parsed = new URL(trimmedUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setSubmitError('Please enter a valid URL starting with https://')
        return
      }
    } catch {
      setSubmitError('Please enter a valid URL (e.g. https://docs.google.com/document/d/...)')
      return
    }

    setSubmitting(true)
    const res = await submitWorkAction({
      taskId: task.id,
      googleDriveUrl: trimmedUrl,
    })
    setSubmitting(false)

    if (res.error) {
      setSubmitError(res.error)
    } else {
      setCurrentStatus('UNDER_REVIEW')
      setSubmitSuccess(true)
      setSubmission((prev) => ({
        id: res.submissionId || prev?.id || '',
        google_drive_url: trimmedUrl,
        submission_method: 'DRIVE_LINK',
        compiled_document_url: null,
        status: 'UNDER_REVIEW',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        failure_reason: null,
        allow_resubmission: true,
        reviewer: null,
      }))
    }
  }

  const isOverdue = task.deadline && currentStatus !== 'PASSED' && new Date(task.deadline) < new Date()
  const canStart = currentStatus === 'PENDING'
  const isUnderReview = currentStatus === 'UNDER_REVIEW' || currentStatus === 'SUBMITTED'
  const isPassed = currentStatus === 'PASSED'
  const isFailed = currentStatus === 'FAILED'
  const canSubmit =
    currentStatus === 'IN_PROGRESS' || (isFailed && (submission?.allow_resubmission ?? true))

  return (
    <Shell role="USER" userName={workerName} userEmail={workerEmail}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back + Header */}
        <div className="flex items-start gap-4">
          <Link
            href="/user/tasks"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-xl font-extrabold text-slate-100 leading-tight">{task.title}</h1>
              <StatusBadge status={currentStatus} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Assigned to you · Last updated {new Date(task.updated_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Overdue Warning */}
        {isOverdue && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>This task is past its deadline: {new Date(task.deadline!).toLocaleString()}</span>
          </div>
        )}

        {/* Start Task Banner (for PENDING status) */}
        {canStart && (
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-slate-900 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-xl">
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-100">Ready to start this task?</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Click &quot;Start Task&quot; to mark it as In Progress. You can then review instructions, transcribe the source images, and submit your Google Drive link.
              </p>
            </div>
            <button
              onClick={handleStartTask}
              disabled={starting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 shrink-0"
            >
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              {starting ? 'Starting…' : 'Start Task'}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUBMISSION STATUS & ACTIONS SECTION */}
        {/* ============================================================ */}

        {/* 1. PASSED View */}
        {isPassed && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-emerald-300">Task Completed &amp; Passed!</h2>
                <p className="text-xs text-slate-400">
                  {submission?.reviewed_at
                    ? `Reviewed and approved on ${new Date(submission.reviewed_at).toLocaleString()}${submission.reviewer?.name ? ` by ${submission.reviewer.name}` : ' by Admin'}`
                    : 'Reviewed and approved by Admin.'}
                </p>
              </div>
            </div>

            {submission?.compiled_document_url ? (
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Compiled Word Document</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">Typed in-platform</span>
                  </div>
                  <p className="text-xs text-slate-300 truncate font-mono mt-0.5">{submission.compiled_document_url}</p>
                </div>
                <a
                  href={submission.compiled_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`${task.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_compiled.docx`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/25 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  Download Compiled .docx
                </a>
              </div>
            ) : submission?.google_drive_url ? (
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Submitted Document</p>
                  <p className="text-xs text-slate-300 truncate font-mono mt-0.5">{submission.google_drive_url}</p>
                </div>
                <a
                  href={submission.google_drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 px-3.5 py-1.5 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Document
                </a>
              </div>
            ) : null}
          </div>
        )}

        {/* 2. UNDER REVIEW / SUBMITTED View */}
        {isUnderReview && (
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-300">Work Submitted — Under Admin Review</h2>
                <p className="text-xs text-slate-400">
                  {submission?.submitted_at
                    ? `Submitted on ${new Date(submission.submitted_at).toLocaleString()}`
                    : 'Awaiting admin evaluation.'}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 flex items-start gap-2">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Your submission is currently locked for review. You cannot edit while the admin is evaluating your work.
              </span>
            </div>

            {submission?.compiled_document_url ? (
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Submitted Word Document</span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">Typed in-platform</span>
                  </div>
                  <p className="text-xs text-slate-300 truncate font-mono mt-0.5">{submission.compiled_document_url}</p>
                </div>
                <a
                  href={submission.compiled_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`${task.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_compiled.docx`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/25 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  Download Compiled .docx
                </a>
              </div>
            ) : submission?.google_drive_url ? (
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Submitted Google Drive Link</p>
                  <p className="text-xs text-slate-300 truncate font-mono mt-0.5">{submission.google_drive_url}</p>
                </div>
                <a
                  href={submission.google_drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 px-3.5 py-1.5 text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Document
                </a>
              </div>
            ) : null}
          </div>
        )}

        {/* 3. FAILED View (Prominent Reason) */}
        {isFailed && (
          <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/20 p-2.5 text-rose-400">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-rose-300">Submission Marked as Failed</h2>
                <p className="text-xs text-slate-400">
                  {submission?.reviewed_at
                    ? `Reviewed on ${new Date(submission.reviewed_at).toLocaleString()}${submission.reviewer?.name ? ` by ${submission.reviewer.name}` : ''}`
                    : 'Please review the admin feedback below.'}
                </p>
              </div>
            </div>

            {/* Admin Failure Reason Box */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Admin Feedback / Correction Required
              </p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {submission?.failure_reason || 'No specific reason provided.'}
              </p>
            </div>

            {submission?.allow_resubmission ? (
              <div className="space-y-3 pt-2">
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <RotateCcw className="h-4 w-4 text-amber-400" />
                      Resubmission Allowed
                    </p>
                    <p className="text-xs text-slate-400">
                      Your previously typed text for all pages has been saved. Launch the workspace to edit your text and re-compile.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenWorkspace}
                    disabled={loadingWorkspace}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-amber-600/20 transition-all shrink-0 disabled:opacity-50"
                  >
                    {loadingWorkspace ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Keyboard className="h-4 w-4" />
                    )}
                    <span>Open Workspace &amp; Fix Text</span>
                  </button>
                </div>

                {submission?.compiled_document_url && (
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>Previous compilation:</span>
                    <a
                      href={submission.compiled_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`${task.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_previous.docx`}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Previous .docx
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-400">
                Resubmission is closed for this task.
              </div>
            )}
          </div>
        )}

        {/* 4. SUBMIT / RESUBMIT WORK SELECTION & FORMS */}
        {canSubmit && (
          <div className="space-y-6">
            {/* OPTION A: IN-PLATFORM TYPING WORKSPACE CARD (PRIMARY) */}
            <div className="rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" /> Recommended Method
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2 mt-1">
                    <Keyboard className="h-5 w-5 text-indigo-400" />
                    Type Inside Platform Workspace
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    Transcribe page-by-page directly on the platform with automatic saving. When finished, your work is auto-compiled into a formatted Microsoft Word (.docx) document and submitted.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenWorkspace}
                  disabled={loadingWorkspace}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 transition-all shrink-0 disabled:opacity-50"
                >
                  {loadingWorkspace ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Keyboard className="h-4 w-4" />
                  )}
                  <span>{isFailed ? 'Open Workspace & Fix Text' : 'Launch Typing Workspace'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Auto-saves every page
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Auto-compiles to Word (.docx)
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Resume anytime on any device
                </span>
              </div>
            </div>

            {/* OPTION B: ALTERNATE GOOGLE DRIVE LINK SUBMISSION */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Link2 className="h-5 w-5 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  Alternate: Type Externally &amp; Share Google Drive Link
                </h3>
              </div>

              <p className="text-xs text-slate-400">
                If you prefer typing in Microsoft Word or Google Docs offline, upload the finished file to your personal Google Drive and paste the shareable link below.
              </p>

              {/* Warning requirement */}
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Make sure the Google Drive link access is set to <strong>&quot;Anyone with the link can view&quot;</strong> before submitting.
                </span>
              </div>

              {submitError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Submission received successfully! Task is now under review.</span>
                </div>
              )}

              <form onSubmit={handleSubmitWork} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Google Drive Document Link <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://docs.google.com/document/d/1a2b3c.../edit"
                    className="block w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-semibold text-white transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Link…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Drive Link
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 5. TYPING WORKSPACE MODAL OVERLAY */}
        {isWorkspaceOpen && (
          <TypingWorkspace
            task={task}
            images={images}
            initialProgress={pageProgress}
            failureReason={submission?.status === 'FAILED' ? submission.failure_reason : null}
            onComplete={handleWorkspaceComplete}
            onCancel={() => setIsWorkspaceOpen(false)}
          />
        )}

        {/* Deadline info card */}
        {task.deadline && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Deadline</p>
              <p className={`text-sm font-semibold ${isOverdue ? 'text-rose-400' : 'text-slate-200'}`}>
                {new Date(task.deadline).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {task.instructions && (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-900/10 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-3">
              <Info className="h-4 w-4" />
              Task Instructions
            </h2>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{task.instructions}</pre>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <FileText className="h-4 w-4" /> Description
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Source Archive Package */}
        {task.zip_file_url && (
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <FileArchive className="h-5 w-5 text-indigo-400" />
                <span>Source Archive Package Available</span>
              </div>
              <span className="text-[11px] text-indigo-300/80 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-mono">
                ZIP / RAR / 7Z
              </span>
            </div>
            <p className="text-xs text-slate-300">
              This task contains an archive package (ZIP, RAR, 7Z, or TAR) with source images and files. Click below to download and extract it onto your computer.
            </p>
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
                Download Archive Package
              </a>
            </div>
          </div>
        )}

        {/* Source Images */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100">Source Images</h2>
            <span className="ml-auto text-xs text-slate-500 bg-slate-800 rounded-md px-2 py-0.5">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </span>
          </div>

          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600 rounded-xl border border-dashed border-slate-800">
              <ImageIcon className="h-10 w-10 mb-2" />
              <p className="text-xs">No source images attached to this task.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/60 rounded-lg px-3 py-2 border border-slate-800">
                <ZoomIn className="h-3.5 w-3.5 text-slate-500" />
                Tap any image to view it full-size. Images are displayed in order — type everything exactly as shown.
              </p>

              {/* Single-column full-width images for maximum readability */}
              <div className="space-y-4">
                {images.map((img) => (
                  <div key={img.id} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    {/* Image label */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80">
                      <span className="text-xs font-semibold text-slate-400">
                        Image {img.image_order + 1} of {images.length}
                      </span>
                      <a
                        href={img.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <ZoomIn className="h-3.5 w-3.5" /> Open full size
                      </a>
                    </div>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={`Source image ${img.image_order + 1}`}
                      onClick={() => setLightboxImg(img.image_url)}
                      className="w-full h-auto object-contain cursor-zoom-in"
                      style={{ touchAction: 'pan-y pinch-zoom', maxWidth: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Full size source image"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
          />
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 rounded-full bg-slate-900 p-2 text-white hover:bg-slate-800"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
      )}
    </Shell>
  )
}
