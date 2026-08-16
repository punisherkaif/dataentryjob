'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  FolderPlus,
  User,
  Calendar,
  FileText,
  ImagePlus,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Upload,
  Loader2,
  Info,
  Archive,
  Link2,
  FileArchive,
} from 'lucide-react'
import Shell from '@/components/layout/Shell'
import { createTaskAction } from '@/app/actions/tasks'

interface Worker {
  id: string
  name: string
  username: string
  email: string
}

interface Props {
  workers: Worker[]
  adminName: string
  adminEmail: string
}

const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  assigned_to: z.string().min(1, 'Please select a worker'),
  deadline: z.string().optional(),
  zip_url_input: z.string().optional(),
})

type FormValues = z.infer<typeof createTaskSchema>

export default function CreateTaskForm({ workers, adminName, adminEmail }: Props) {
  const router = useRouter()

  // Attachments state
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [zipUrlInput, setZipUrlInput] = useState('')
  const [previewImages, setPreviewImages] = useState<{ url: string; file: File; name: string }[]>([])

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(createTaskSchema) })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPreviews = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
    }))
    setPreviewImages((prev) => [...prev, ...newPreviews])
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setZipFile(file)
    }
  }

  const removeImage = (idx: number) => {
    setPreviewImages((prev) => {
      URL.revokeObjectURL(prev[idx].url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const onSubmit = async (data: FormValues) => {
    setErrorMsg(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('title', data.title.trim())
    if (data.description?.trim()) formData.append('description', data.description.trim())
    if (data.instructions?.trim()) formData.append('instructions', data.instructions.trim())
    formData.append('assigned_to', data.assigned_to)
    if (data.deadline?.trim()) formData.append('deadline', data.deadline.trim())

    if (zipUrlInput.trim()) {
      formData.append('zip_url_input', zipUrlInput.trim())
    }

    if (zipFile) {
      formData.append('zip_file', zipFile)
    }

    previewImages.forEach(({ file }) => formData.append('images', file))

    try {
      const res = await createTaskAction(formData)
      setLoading(false)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        router.push('/admin/tasks')
      }
    } catch {
      setLoading(false)
      setErrorMsg('An unexpected error occurred while creating the task.')
    }
  }

  return (
    <Shell role="ADMIN" userName={adminName} userEmail={adminEmail}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tasks"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <FolderPlus className="h-7 w-7 text-cyan-400" />
              Create New Task
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Assign a data-entry task with source ZIP package or images to a worker.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Task Info & Assignment */}
          <div className="lg:col-span-7 space-y-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100">Task Details</h2>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Task Title <span className="text-rose-400">*</span>
              </label>
              <input
                {...register('title')}
                placeholder="e.g. Transcribe Invoice Batch #42"
                className="block w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {errors.title && <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Description (optional)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Brief overview of the task..."
                className="block w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>

            {/* Worker Instructions */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Worker Instructions (optional)
              </label>
              <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-3 text-xs text-indigo-300 flex items-start gap-2 mb-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Tell the worker exactly what to type, what format to use, what to skip, etc.
                </span>
              </div>
              <textarea
                {...register('instructions')}
                rows={4}
                placeholder="1. Type all names and dates exactly as shown.&#10;2. Skip any crossed-out text.&#10;3. Submit your Google Doc link when finished."
                className="block w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>

            {/* Assign Worker & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Assign To <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    {...register('assigned_to')}
                    defaultValue=""
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                  >
                    <option value="" disabled>
                      Select active worker…
                    </option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (@{w.username})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.assigned_to && (
                  <p className="mt-1 text-xs text-rose-400">{errors.assigned_to.message}</p>
                )}
                {workers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-400">
                    No active workers found. Approve a registration first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Deadline (optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...register('deadline')}
                    type="datetime-local"
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Source Package & Attachments */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Archive className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-100">Source Files &amp; Packages</h2>
            </div>

            {/* OPTION A: UPLOAD ARCHIVE FILE */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Option 1: Upload Archive (ZIP / RAR / 7Z / TAR)
              </label>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-3">
                <label className="flex flex-col items-center justify-center w-full py-4 px-3 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-900/40 transition-all">
                  <FileArchive className="w-6 h-6 text-indigo-400 mb-1" />
                  <p className="text-xs font-medium text-slate-300">
                    {zipFile ? zipFile.name : 'Click to attach ZIP, RAR, 7Z or TAR package'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Recommended for 50+ images or bulk packages (.zip, .rar, .7z up to 100MB)
                  </p>
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip,.rar,.7z,.tar,.gz,.tgz,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/vnd.rar,application/x-rar,application/x-7z-compressed"
                    onChange={handleZipChange}
                    className="hidden"
                  />
                </label>

                {zipFile && (
                  <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-2.5 text-xs text-indigo-200">
                    <span className="truncate font-mono">{zipFile.name} ({(zipFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <button
                      type="button"
                      onClick={() => setZipFile(null)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* OPTION B: EXTERNAL ZIP LINK */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Option 2: Google Drive / Dropbox ZIP Link
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="url"
                  value={zipUrlInput}
                  onChange={(e) => setZipUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or Dropbox link"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* OPTION C: INDIVIDUAL SOURCE IMAGES */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Option 3: Individual Images
                </label>
                <span className="text-[11px] text-slate-500">{previewImages.length} added</span>
              </div>

              <label className="flex flex-col items-center justify-center w-full py-3 px-3 border border-dashed border-slate-700 hover:border-cyan-500 rounded-xl cursor-pointer bg-slate-950/50 transition-all">
                <Upload className="w-5 h-5 text-slate-500 mb-1" />
                <p className="text-xs font-medium text-slate-400">Add individual images</p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 pt-1">
                  {previewImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.name} className="w-full h-20 object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="rounded-lg bg-rose-600 p-1 text-white shadow-lg"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 px-1.5 py-0.5">
                        <p className="text-[10px] text-slate-300 truncate">#{idx + 1} {img.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-auto pt-4 border-t border-slate-800 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating &amp; Assigning Task…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Create &amp; Assign Task
                  </>
                )}
              </button>
              <Link
                href="/admin/tasks"
                className="w-full flex justify-center items-center py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </Shell>
  )
}
