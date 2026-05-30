import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeFeed from '@/components/HomeFeed'
import PageLayout from '@/components/PageLayout'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <PageLayout>
      <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg z-10 px-4 py-3 border-b border-gray-100 dark:border-gray-700 lg:hidden">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          LyricBeads
        </h1>
      </header>

      <div className="lg:bg-white dark:lg:bg-gray-800 lg:rounded-2xl lg:shadow-sm lg:p-6 lg:min-h-full">
        <HomeFeed userId={user.id} />
      </div>
    </PageLayout>
  )
}
