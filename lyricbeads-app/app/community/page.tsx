import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CommunityFeed from '@/components/CommunityFeed'
import PageLayout from '@/components/PageLayout'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <PageLayout>
      <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg z-10 px-4 py-3 border-b border-gray-100 dark:border-gray-700 lg:hidden">
        <h1 className="text-lg font-bold text-center text-gray-900 dark:text-white">社区广场</h1>
      </header>

      <div className="lg:bg-white dark:lg:bg-gray-800 lg:rounded-2xl lg:shadow-sm lg:p-6 lg:min-h-full">
        <CommunityFeed userId={user.id} />
      </div>
    </PageLayout>
  )
}
