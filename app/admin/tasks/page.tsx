import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminTasksClient from '@/components/tasks/AdminTasksClient'

export default async function AdminTasksPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', authUser.id)
    .single() as { data: { name: string; role: string } | null }

  if (profile?.role !== 'ADMIN') redirect('/user/dashboard')

  return (
    <AdminTasksClient
      adminName={profile?.name || 'Admin'}
      adminEmail={authUser.email || ''}
    />
  )
}
