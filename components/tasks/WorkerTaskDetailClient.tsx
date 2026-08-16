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
} from 'lucide-react'
import Shell from '@/components/layout/Shell'
import StatusBadge from '@/components/ui/StatusBadge'
import { markTaskInProgressAction } from '@/app/actions/tasks'
import { submitWorkAction } from '@/app/actions/submissions'

interface TaskImage {
  id: string
  image_url: string
  image_order: number
}

interface Submission {
  id: string
  google_drive_url: string
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

  // Form state
  const [driveUrl, setDriveUrl] = useState(initialSubmission?.google_drive_url || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)



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

            {submission?.google_drive_url && (
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
            )}
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
                Your submission is currently locked for review. You cannot edit the document link while the admin is evaluating your work.
              </span>
            </div>

            {submission?.google_drive_url && (
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
            )}
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
                <AlertTriangle className="h-4 w-4" /> Admin Feedback / Failure Reason
              </p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {submission?.failure_reason || 'No specific reason provided.'}
              </p>
            </div>

            {submission?.allow_resubmission ? (
              <p className="text-xs text-slate-400">
                The admin has permitted resubmission. Fix the errors in your document and paste the updated link below.
              </p>
            ) : (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-400">
                Resubmission is closed for this task.
              </div>
            )}
          </div>
        )}

        {/* 4. SUBMIT / RESUBMIT WORK FORM */}
        {canSubmit && (
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              {isFailed ? (
                <RotateCcw className="h-5 w-5 text-amber-400" />
              ) : (
                <Send className="h-5 w-5 text-indigo-400" />
              )}
              <h2 className="text-base font-bold text-slate-100">
                {isFailed ? 'Resubmit Corrected Work' : 'Submit Completed Work'}
              </h2>
            </div>

            {/* Warning requirement */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-300 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-200">
                  Make sure the Google Drive document is accessible to the admin before submitting.
                </p>
                <p className="text-amber-300/80">
                  In Google Drive: Click <strong>Share</strong> &rarr; set General access to{' '}
                  <strong>&quot;Anyone with the link can view/comment&quot;</strong> &rarr; Copy Link and paste below.
                </p>
              </div>
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

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Google Drive / Document Link <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/1a2b3c.../edit"
                  className="block w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : isFailed ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Submit Corrected Work
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit for Review
                  </>
                )}
              </button>
            </form>
          </div>
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
