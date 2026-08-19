'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  FileCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  X,
  FileText,
  HelpCircle,
} from 'lucide-react'
import { savePageProgressAction, compileAndSubmitDocxAction } from '@/app/actions/typing-workspace'

interface TaskImage {
  id: string
  image_url: string
  image_order: number
}

interface PageProgress {
  page_order: number
  typed_text: string
  task_image_id?: string | null
}

interface Props {
  task: {
    id: string
    title: string
    instructions: string | null
    deadline: string | null
  }
  images: TaskImage[]
  initialProgress?: PageProgress[]
  onComplete: (data: { submissionId: string; compiledDocUrl: string }) => void
  onCancel: () => void
}

export default function TypingWorkspace({
  task,
  images,
  initialProgress = [],
  onComplete,
  onCancel,
}: Props) {
  // Sort images by order
  const sortedImages = [...images].sort((a, b) => a.image_order - b.image_order)
  const totalPages = Math.max(sortedImages.length, 1)

  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  // Map to store text for all pages: pageIndex -> text
  const [pageTexts, setPageTexts] = useState<Record<number, string>>(() => {
    const initialMap: Record<number, string> = {}
    for (let i = 0; i < totalPages; i++) {
      initialMap[i] = ''
    }
    initialProgress.forEach((p) => {
      initialMap[p.page_order] = p.typed_text || ''
    })
    return initialMap
  })

  // Autosave states
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE')
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Image viewer zoom & pan state
  const [zoomLevel, setZoomLevel] = useState(100) // Percentage
  const [showInstructions, setShowInstructions] = useState(false)
  const [showConfirmFinish, setShowConfirmFinish] = useState(false)
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const currentImage = sortedImages[currentPageIndex] || null
  const currentText = pageTexts[currentPageIndex] || ''

  // Perform autosave for a specific page
  const performSave = useCallback(
    async (pageIdx: number, textToSave: string) => {
      const img = sortedImages[pageIdx] || null
      setSaveStatus('SAVING')
      setSaveError(null)

      try {
        const res = await savePageProgressAction({
          taskId: task.id,
          pageOrder: pageIdx,
          taskImageId: img?.id || null,
          typedText: textToSave,
        })

        if (res.error) {
          setSaveStatus('ERROR')
          setSaveError(res.error)
        } else {
          setSaveStatus('SAVED')
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        }
      } catch (err: any) {
        setSaveStatus('ERROR')
        setSaveError('Network error while saving.')
      }
    },
    [task.id, sortedImages]
  )

  // Handle typing with debounced autosave (1.2 seconds)
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setPageTexts((prev) => ({ ...prev, [currentPageIndex]: newText }))
    setSaveStatus('SAVING')

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      performSave(currentPageIndex, newText)
    }, 1200)
  }

  // Flush save on page change
  const navigateToPage = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= totalPages || targetIndex === currentPageIndex) return

    // Immediately save current page text before navigating
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    performSave(currentPageIndex, currentText)

    setCurrentPageIndex(targetIndex)
    setZoomLevel(100) // reset zoom
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      navigateToPage(currentPageIndex + 1)
    } else {
      checkAndPromptFinish()
    }
  }

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      navigateToPage(currentPageIndex - 1)
    }
  }

  // Check if any pages are empty before finish
  const checkAndPromptFinish = () => {
    // Flush current page save first
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    performSave(currentPageIndex, currentText)

    const emptyPages: number[] = []
    for (let i = 0; i < totalPages; i++) {
      if (!pageTexts[i] || pageTexts[i].trim().length === 0) {
        emptyPages.push(i + 1)
      }
    }

    setShowConfirmFinish(true)
  }

  // Final compile & submit
  const handleCompileAndSubmit = async () => {
    setShowConfirmFinish(false)
    setCompiling(true)
    setCompileError(null)

    // Ensure current page is saved
    await performSave(currentPageIndex, currentText)

    const res = await compileAndSubmitDocxAction(task.id)
    setCompiling(false)

    if (res.error) {
      setCompileError(res.error)
    } else if (res.success && res.compiledDocUrl) {
      onComplete({
        submissionId: res.submissionId || '',
        compiledDocUrl: res.compiledDocUrl,
      })
    }
  }

  // Calculate completed pages count
  const filledPagesCount = Object.values(pageTexts).filter((t) => t && t.trim().length > 0).length
  const progressPercent = Math.round((filledPagesCount / totalPages) * 100)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. TOP APP BAR */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0 z-20">
        {/* Left: Exit + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onCancel}
            title="Exit Workspace"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit Workspace</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-100 truncate">{task.title}</h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="text-cyan-400 font-medium">In-Platform Typing Workspace</span>
              {task.instructions && (
                <button
                  onClick={() => setShowInstructions(true)}
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 inline-flex items-center gap-0.5 ml-1"
                >
                  <Info className="h-3 w-3" /> Instructions
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Center: Page Progress Indicator & Dots */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const isCurrent = idx === currentPageIndex
              const isFilled = pageTexts[idx] && pageTexts[idx].trim().length > 0
              return (
                <button
                  key={idx}
                  onClick={() => navigateToPage(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                      : isFilled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title={`Page ${idx + 1}${isFilled ? ' (Completed)' : ''}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
          <span className="text-xs text-slate-400 ml-1">
            ({filledPagesCount}/{totalPages} filled)
          </span>
        </div>

        {/* Right: Autosave Status + Finish Button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Autosave badge */}
          <div className="text-right text-[11px] hidden sm:block">
            {saveStatus === 'SAVING' && (
              <span className="text-amber-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'SAVED' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
              </span>
            )}
            {saveStatus === 'ERROR' && (
              <span className="text-rose-400 flex items-center gap-1" title={saveError || ''}>
                <AlertTriangle className="h-3 w-3" /> Save failed
              </span>
            )}
          </div>

          <button
            onClick={checkAndPromptFinish}
            disabled={compiling}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
          >
            {compiling ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <FileCheck className="h-3.5 w-3.5" />
                <span>Finish &amp; Compile</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-800 h-1">
        <div
          className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-1 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {compileError && (
        <div className="bg-rose-500/20 border-b border-rose-500/30 p-2.5 px-4 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>{compileError}</span>
          </div>
          <button onClick={() => setCompileError(null)} className="text-rose-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN SPLIT WORKSPACE BODY */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* ============================================================ */}
        {/* TOP / LEFT: IMAGE VIEWER (Col 6 on desktop, Top half on mobile) */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/90 relative min-h-[220px] lg:min-h-0 overflow-hidden">
          {/* Image Toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">
                Page Image ({currentPageIndex + 1} of {totalPages})
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {zoomLevel}% Zoom
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(prev - 25, 50))}
                title="Zoom Out"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                title="Reset Zoom"
                className="px-1.5 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                100%
              </button>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(prev + 25, 300))}
                title="Zoom In"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              {currentImage && (
                <a
                  href={currentImage.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Full Image in New Tab"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 ml-1"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Image Canvas Container */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 select-none">
            {currentImage ? (
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage.image_url}
                  alt={`Source Page ${currentPageIndex + 1}`}
                  className="rounded-lg shadow-2xl border border-slate-800 max-h-[75vh] object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="text-center p-8 text-slate-600">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No image uploaded for this page position.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can still type the text content directly in the box below.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM / RIGHT: ERGONOMIC TYPING AREA (Col 6 on desktop) */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 flex flex-col bg-slate-900/60 relative min-h-0 overflow-hidden">
          {/* Editor Header Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Type Page {currentPageIndex + 1} Content
              </span>
              <span className="text-[10px] text-slate-500">
                ({currentText.length} characters • {currentText.split(/\s+/).filter(Boolean).length} words)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Page {currentPageIndex + 1} of {totalPages}
              </span>
            </div>
          </div>

          {/* Large Text Area */}
          <div className="flex-1 p-4 flex flex-col min-h-0">
            <textarea
              ref={textareaRef}
              value={currentText}
              onChange={handleTextChange}
              placeholder={`Transcribe text for Page ${currentPageIndex + 1} here...\n\n• Type text exactly as shown in the page image.\n• Progress is autosaved automatically as you type.\n• Click "Next Page" or press Next when this page is complete.`}
              className="w-full flex-1 p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
              spellCheck={false}
              autoFocus
            />
          </div>

          {/* Bottom Navigation Toolbar */}
          <div className="flex items-center justify-between p-3 px-4 bg-slate-900 border-t border-slate-800 shrink-0">
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous Page</span>
            </button>

            {/* Mobile Page indicator */}
            <div className="flex md:hidden items-center gap-1 text-xs text-slate-400 font-medium">
              <span>Pg {currentPageIndex + 1} / {totalPages}</span>
            </div>

            {currentPageIndex < totalPages - 1 ? (
              <button
                onClick={handleNextPage}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition-all"
              >
                <span>Next Page</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={checkAndPromptFinish}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition-all"
              >
                <FileCheck className="h-4 w-4" />
                <span>Finish &amp; Compile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. INSTRUCTIONS MODAL POPUP */}
      {showInstructions && task.instructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-400" />
                Task Instructions
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800">
              {task.instructions}
            </pre>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
              >
                Got it, Back to Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONFIRM FINISH & COMPILE MODAL */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Ready to Compile &amp; Submit?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  We will compile your typed text into a Word Document (.docx) and submit it for admin review.
                </p>
              </div>
            </div>

            {/* Page breakdown summary */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Pages:</span>
                <span className="font-bold text-slate-200">{totalPages}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Pages with Typed Text:</span>
                <span className="font-bold text-emerald-400">{filledPagesCount} of {totalPages}</span>
              </div>

              {filledPagesCount < totalPages && (
                <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    Warning: {totalPages - filledPagesCount} page(s) are currently empty. Make sure you haven&apos;t skipped any pages before submitting.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmFinish(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleCompileAndSubmit}
                disabled={compiling}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {compiling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Compiling .docx...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Compile &amp; Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
