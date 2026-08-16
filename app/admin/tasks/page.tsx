import Shell from '@/components/layout/Shell'

export default function AdminTasksPlaceholder() {
  return (
    <Shell role="ADMIN">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-100">Task Management</h1>
        <p className="mt-2 text-sm text-slate-400">
          Admin task creation and source image upload interface will be populated in Phase 3.
        </p>
      </div>
    </Shell>
  )
}
