import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostDetail from '@/components/PostDetail'
import PageLayout from '@/components/PageLayout'

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <PageLayout>
      <div className="lg:bg-white lg:rounded-2xl lg:shadow-sm lg:p-6 lg:min-h-full">
        <PostDetail postId={id} userId={user.id} />
      </div>
    </PageLayout>
  )
}
