import Shell from '@/components/layout/Shell'

export default function WorkerTasksPlaceholder() {
  return (
    <Shell role="USER">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-100">Assigned Tasks</h1>
        <p className="mt-2 text-sm text-slate-400">
          Assigned tasks with source image viewer will be populated in Phase 3.
        </p>
      </div>
    </Shell>
  )
}
