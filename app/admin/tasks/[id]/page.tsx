import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminTaskDetailAction } from '@/app/actions/tasks'
import AdminTaskDetailClient from '@/components/tasks/AdminTaskDetailClient'

export default async function AdminTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', authUser.id)
    .single() as { data: { name: string; role: string } | null }

  if (profile?.role !== 'ADMIN') redirect('/user/dashboard')

  const { task, images, submission, error } = await getAdminTaskDetailAction(id)
  if (!task || error) notFound()

  return (
    <AdminTaskDetailClient
      task={task as any}
      images={images as any}
      submission={submission as any}
      adminName={profile?.name || 'Admin'}
      adminEmail={authUser.email || ''}
    />
  )
}
