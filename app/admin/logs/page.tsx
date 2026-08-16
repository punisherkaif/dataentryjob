import Shell from '@/components/layout/Shell'

export default function AdminLogsPlaceholder() {
  return (
    <Shell role="ADMIN">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-100">Activity Logs</h1>
        <p className="mt-2 text-sm text-slate-400">
          System audit activity logs will be populated as actions take place.
        </p>
      </div>
    </Shell>
  )
}
