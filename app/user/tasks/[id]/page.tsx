import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWorkerTaskDetailAction } from '@/app/actions/tasks'
import WorkerTaskDetailClient from '@/components/tasks/WorkerTaskDetailClient'

export default async function WorkerTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, status')
    .eq('id', authUser.id)
    .single() as { data: { name: string; role: string; status: string } | null }

  if (profile?.role !== 'USER') redirect('/admin/dashboard')
  if (profile?.status !== 'ACTIVE') redirect('/account-status')

  const { task, images, submission, error } = await getWorkerTaskDetailAction(id)

  if (!task || error) notFound()

  return (
    <WorkerTaskDetailClient
      task={task as any}
      images={images as any}
      submission={submission as any}
      workerName={profile?.name || 'Worker'}
      workerEmail={authUser.email || ''}
    />
  )
}
