'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Post, User } from '@/types'
import { ArrowLeft, Heart, Bookmark, Trash2, User as UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import UserProfile from '@/components/UserProfile'
import { isAdmin, canDeletePost } from '@/utils/admin'

type TabType = 'history' | 'likes' | 'myPosts' | 'favorites'

export default function ProfileContent({ userId, user }: { userId: string; user: any }) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') as TabType | null
  const router = useRouter()

  // 如果没有指定 tab，显示默认的用户资料页面
  if (!tab) {
    return <UserProfile userId={userId} user={user} />
  }

  // 显示对应的标签页内容
  return <ProfileTabContent userId={userId} user={user} activeTab={tab} />
}

function ProfileTabContent({ userId, user, activeTab }: { userId: string; user: any; activeTab: TabType }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
    getCurrentUser()
  }, [activeTab])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser({
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      })
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      let postsData: any[] = []
      let postIds: string[] = []

      if (activeTab === 'history') {
        const { data } = await supabase
          .from('browsing_history')
          .select('post_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
        postIds = data?.map((h: any) => h.post_id) || []
      } else if (activeTab === 'likes') {
        const { data } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        postIds = data?.map((l: any) => l.post_id) || []
      } else if (activeTab === 'myPosts') {
        const { data } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        postsData = data || []
      } else if (activeTab === 'favorites') {
        const { data } = await supabase
          .from('favorites')
          .select('post_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        postIds = data?.map((f: any) => f.post_id) || []
      }

      // 如果需要通过 ID 获取帖子
      if (postIds.length > 0 && activeTab !== 'myPosts') {
        const { data } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
        postsData = data || []
      }

      // 获取点赞数
      const allPostIds = postsData.map(p => p.id)
      const { data: allLikes } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', allPostIds)

      const likeCounts: Record<string, number> = {}
      allLikes?.forEach((like: any) => {
        likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
      })

      const posts = postsData.map((post: any) => ({
        ...post,
        user: { id: post.user_id, email: '', user_metadata: {} },
        likes_count: likeCounts[post.id] || 0,
        is_liked: activeTab === 'likes',
        is_favorited: activeTab === 'favorites',
      }))

      setPosts(posts)
    } catch (err) {
      console.error('获取数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: userId })
      }
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, is_liked: !isLiked, likes_count: isLiked ? post.likes_count! - 1 : post.likes_count! + 1 }
          : post
      ))
    } catch (err) {
      console.error('点赞操作失败:', err)
    }
  }

  const handleUnfavorite = async (postId: string) => {
    try {
      await supabase.from('favorites').delete().eq('post_id', postId).eq('user_id', userId)
      setPosts(posts.filter(post => post.id !== postId))
    } catch (err) {
      console.error('取消收藏失败:', err)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('确定要删除这个作品吗？')) return

    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('删除失败')
      setPosts(posts.filter(post => post.id !== postId))
    } catch (err) {
      alert('删除失败，请重试')
    }
  }

  const tabTitles: Record<TabType, string> = {
    history: '浏览历史',
    likes: '点赞',
    myPosts: '我的创作',
    favorites: '收藏',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
        <button onClick={() => router.push('/profile')} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{tabTitles[activeTab]}</h1>
      </header>

      {/* 内容区域 */}
      <div className="p-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'myPosts' && <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
              {activeTab === 'likes' && <Heart className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
              {activeTab === 'favorites' && <Bookmark className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
              {activeTab === 'history' && <Heart className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
            </div>
            <h3 className="text-gray-900 dark:text-white font-medium mb-1">暂无内容</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {activeTab === 'history' && '去社区浏览更多内容'}
              {activeTab === 'likes' && '给喜欢的作品点赞吧'}
              {activeTab === 'favorites' && '收藏你感兴趣的作品'}
              {activeTab === 'myPosts' && '开始创作你的第一条手链'}
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-2 lg:columns-3 lg:gap-3 space-y-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="break-inside-avoid bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col"
                onClick={() => router.push(`/post/${post.id}`)}
              >
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="手链"
                    className="w-full object-cover flex-shrink-0"
                    loading="lazy"
                    style={{ minHeight: '120px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                )}
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3 mb-2 min-h-[4.5em]">{post.content}</p>
                  <div className="flex items-center justify-between text-xs mt-auto">
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(post.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(post.id, post.is_liked!) }}
                        className={`p-1 ${post.is_liked ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                      </button>
                      {/* 删除 - 作者本人或管理员可见 */}
                      {canDeletePost(currentUser, post.user_id) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(post.id) }}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500"
                          title={currentUser?.id === post.user_id ? '删除' : '管理员删除'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {activeTab === 'favorites' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUnfavorite(post.id) }}
                          className="p-1 text-yellow-500"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
