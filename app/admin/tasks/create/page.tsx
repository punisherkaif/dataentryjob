import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkersAction } from '@/app/actions/tasks'
import CreateTaskForm from '@/components/tasks/CreateTaskForm'

export default async function CreateTaskPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', authUser.id)
    .single() as { data: { name: string; role: string } | null }

  if (profile?.role !== 'ADMIN') redirect('/user/dashboard')

  const { workers } = await getActiveWorkersAction()

  return (
    <CreateTaskForm
      workers={workers as any}
      adminName={profile?.name || 'Admin'}
      adminEmail={authUser.email || ''}
    />
  )
}
