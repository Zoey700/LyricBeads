import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileContent from '@/components/ProfileContent'
import PageLayout from '@/components/PageLayout'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <PageLayout>
      <ProfileContent userId={user.id} user={user} />
    </PageLayout>
  )
}
