'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post, User } from '@/types'
import { Heart, Bookmark, Share2, MessageCircle, Check, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createShareCard } from '@/utils/shareImage'
import { isAdmin, canDeletePost } from '@/utils/admin'
import Masonry from 'react-responsive-masonry'
import useWindowSize from '@/hooks/useWindowSize'

interface CommunityFeedProps {
  userId: string
}

export default function CommunityFeed({ userId }: CommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'latest' | 'popular'>('latest')
  const [sharingPostId, setSharingPostId] = useState<string | null>(null)
  const [sharedPostId, setSharedPostId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { width } = useWindowSize()

  // 根据屏幕宽度计算列数
  const getColumnsCount = () => {
    if (width < 640) return 2      // 移动端 2列
    if (width < 1024) return 3     // 平板 3列
    if (width < 1280) return 4     // 小桌面 4列
    return 5                       // 大桌面 5列
  }

  useEffect(() => {
    fetchPosts()
    getCurrentUser()
  }, [filter])

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
    setError(null)
    try {
      // 先获取帖子
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50)

      if (postsError) throw postsError

      // 获取当前用户的点赞和收藏状态
      const { data: userLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)

      const { data: userFavorites } = await supabase
        .from('favorites')
        .select('post_id')
        .eq('user_id', userId)

      const likedPostIds = new Set(userLikes?.map(l => l.post_id) || [])
      const favoritedPostIds = new Set(userFavorites?.map(f => f.post_id) || [])

      // 获取所有点赞数
      const postIds = (postsData || []).map(p => p.id)
      const { data: allLikes } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)

      const likeCounts: Record<string, number> = {}
      allLikes?.forEach(like => {
        likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
      })

      let posts = (postsData || []).map((post: any) => ({
        ...post,
        user: { id: post.user_id, email: '', user_metadata: {} },
        likes_count: likeCounts[post.id] || 0,
        is_liked: likedPostIds.has(post.id),
        is_favorited: favoritedPostIds.has(post.id),
      }))

      if (filter === 'popular') {
        posts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
      }

      setPosts(posts)
    } catch (err: any) {
      console.error('获取社区帖子失败:', err)
      // 检查是否是网络错误
      if (err.message?.includes('Failed to fetch') || err.message?.includes('fetch failed')) {
        setError('网络连接失败，请检查网络后重试')
      } else {
        setError('加载失败，请重试')
      }
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
          ? {
              ...post,
              is_liked: !isLiked,
              likes_count: isLiked ? post.likes_count! - 1 : post.likes_count! + 1,
            }
          : post
      ))
    } catch (err) {
      console.error('点赞操作失败:', err)
    }
  }

  const handleFavorite = async (postId: string, isFavorited: boolean) => {
    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('post_id', postId).eq('user_id', userId)
      } else {
        await supabase.from('favorites').insert({ post_id: postId, user_id: userId })
      }
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, is_favorited: !isFavorited }
          : post
      ))
    } catch (err) {
      console.error('收藏操作失败:', err)
    }
  }

  const handleShare = async (post: Post) => {
    if (!post.image_url) {
      alert('没有可分享的图片')
      return
    }

    setSharingPostId(post.id)
    setSharedPostId(null)

    try {
      const username = post.user?.user_metadata?.name || post.user?.email?.split('@')[0] || '用户'
      const success = await createShareCard(post.image_url, post.content, username)

      if (success) {
        setSharedPostId(post.id)
        setTimeout(() => setSharedPostId(null), 2000)
      } else {
        alert('生成分享图片失败，请重试')
      }
    } catch (err) {
      console.error('分享失败:', err)
      alert('分享失败，请重试')
    } finally {
      setSharingPostId(null)
    }
  }

  const handleDelete = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 防止触发卡片点击

    if (!confirm('确定要删除这个作品吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))
        throw new Error(errorData.error || '删除失败')
      }

      // 从列表中移除已删除的帖子
      setPosts(posts.filter(post => post.id !== postId))
    } catch (err: any) {
      console.error('删除作品失败:', err)
      alert(err.message || '删除失败，请重试')
    }
  }

  const handlePostClick = (postId: string) => {
    // 异步插入浏览记录，不阻塞导航
    supabase.from('browsing_history').insert({
      post_id: postId,
      user_id: userId,
    }).then(({ error }) => {
      if (error) console.warn('插入浏览记录失败:', error)
    })
    router.push(`/post/${postId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">加载失败</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchPosts}
          className="px-6 py-2 bg-purple-600 text-white rounded-full hover:opacity-90 transition"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 筛选按钮 */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('latest')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              filter === 'latest'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            最新
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              filter === 'popular'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            热门
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无内容</h3>
          <p className="text-gray-500 dark:text-gray-400">快来发布第一条内容吧</p>
        </div>
      ) : (
        <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-900 min-h-screen">
          {/* 小红书式瀑布流布局 */}
          <Masonry columnsCount={getColumnsCount()} gutter="8px" className="sm:gap-3 lg:gap-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98] flex flex-col"
                onClick={() => handlePostClick(post.id)}
              >
                {/* 图片区域 - 小红书风格圆角 */}
                {post.image_url && (
                  <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    <img
                      src={post.image_url}
                      alt="生成的手链"
                      className="w-full h-auto object-cover"
                      loading="lazy"
                      style={{ minHeight: '150px', maxHeight: '300px', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* 内容区域 */}
                <div className="p-2.5 flex-1 flex flex-col">
                  {/* 文字内容 - 固定行数 */}
                  <p className="text-gray-800 dark:text-gray-200 text-sm mb-2 leading-relaxed line-clamp-3 min-h-[4.5em]">
                    {post.content}
                  </p>

                  {/* 情感标签 */}
                  {post.emotion_type && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300">
                        {getEmotionLabel(post.emotion_type)}
                      </span>
                    </div>
                  )}

                  {/* 底部信息栏 */}
                  <div className="flex items-center justify-between mt-auto">
                    {/* 用户头像和名称 */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 shadow-sm">
                        {(post.user?.user_metadata?.name || post.user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[60px]">
                        {post.user?.user_metadata?.name || post.user?.email?.split('@')[0] || '匿名用户'}
                      </span>
                    </div>

                    {/* 右侧操作区 */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* 点赞 */}
                      <button
                        className={`flex items-center gap-0.5 transition ${post.is_liked ? 'text-red-500' : 'text-gray-400 dark:text-gray-500 hover:text-red-400'}`}
                        onClick={() => handleLike(post.id, post.is_liked!)}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.is_liked ? 'fill-current' : ''}`} />
                        {post.likes_count! > 0 && (
                          <span className="text-xs">{post.likes_count}</span>
                        )}
                      </button>

                      {/* 删除 - 作者或管理员可见 */}
                      {canDeletePost(currentUser, post.user_id) && (
                        <button
                          className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition"
                          onClick={(e) => handleDelete(post.id, e)}
                          title={currentUser?.id === post.user_id ? '删除' : '管理员删除'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </Masonry>
        </div>
      )}
    </div>
  )
}

function getEmotionLabel(emotion: string): string {
  const labels: Record<string, string> = {
    happy: '快乐',
    sad: '伤感',
    romantic: '浪漫',
    peaceful: '宁静',
    energetic: '活力',
    melancholy: '忧郁',
    hopeful: '希望',
    nostalgic: '怀旧',
  }
  return labels[emotion] || emotion
}
