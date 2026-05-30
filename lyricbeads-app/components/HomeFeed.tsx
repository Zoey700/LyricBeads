'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types'
import { Heart, Bookmark, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DailyPosts {
  date: string
  dateLabel: string
  posts: Post[]
}

interface HomeFeedProps {
  userId: string
}

export default function HomeFeed({ userId }: HomeFeedProps) {
  const [dailyGroups, setDailyGroups] = useState<DailyPosts[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchInitialPosts()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore])

  const fetchInitialPosts = async () => {
    setLoading(true)
    try {
      const groups = await fetchPostsByDate()
      setDailyGroups(groups)
      setHasMore(groups.length > 0)
    } catch (err) {
      console.error('获取帖子失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const lastDate = dailyGroups[dailyGroups.length - 1]?.date
      const newGroups = await fetchPostsByDate(lastDate)

      if (newGroups.length === 0) {
        setHasMore(false)
      } else {
        setDailyGroups(prev => [...prev, ...newGroups])
      }
    } catch (err) {
      console.error('加载更多失败:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const fetchPostsByDate = async (beforeDate?: string): Promise<DailyPosts[]> => {
    try {
      // 获取所有公开帖子
      let query = supabase
        .from('posts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(100)

      // 如果有日期限制，添加过滤
      if (beforeDate) {
        query = query.lt('created_at', beforeDate)
      }

      const { data: postsData, error } = await query

      if (error) throw error

      if (!postsData || postsData.length === 0) return []

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

      // 获取浏览量统计（使用浏览历史作为点击量指标）
      const postIds = postsData.map(p => p.id)
      const { data: browsingData } = await supabase
        .from('browsing_history')
        .select('post_id')
        .in('post_id', postIds)

      const viewCounts: Record<string, number> = {}
      browsingData?.forEach(view => {
        viewCounts[view.post_id] = (viewCounts[view.post_id] || 0) + 1
      })

      // 获取点赞数
      const { data: allLikes } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)

      const likeCounts: Record<string, number> = {}
      allLikes?.forEach(like => {
        likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
      })

      // 组装数据
      const postsWithStats = postsData.map((post: any) => ({
        ...post,
        user: { id: post.user_id, email: '', user_metadata: {} },
        likes_count: likeCounts[post.id] || 0,
        views_count: viewCounts[post.id] || 0,
        is_liked: likedPostIds.has(post.id),
        is_favorited: favoritedPostIds.has(post.id),
      }))

      // 按日期分组
      const groupedByDate = new Map<string, Post[]>()

      postsWithStats.forEach(post => {
        const date = new Date(post.created_at)
        const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

        if (!groupedByDate.has(dateKey)) {
          groupedByDate.set(dateKey, [])
        }
        groupedByDate.get(dateKey)!.push(post)
      })

      // 每天取浏览量最高的3个，并转换为数组
      const groups: DailyPosts[] = []
      const sortedDates = Array.from(groupedByDate.keys()).sort((a, b) => b.localeCompare(a))

      for (const dateKey of sortedDates) {
        const posts = groupedByDate.get(dateKey)!
        // 按浏览量排序，取前3
        const topPosts = posts
          .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
          .slice(0, 3)

        groups.push({
          date: dateKey,
          dateLabel: formatDateLabel(dateKey),
          posts: topPosts,
        })
      }

      return groups
    } catch (err) {
      console.error('获取帖子失败:', err)
      return []
    }
  }

  const handleLike = async (postId: string, isLiked: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: userId })
      }

      setDailyGroups(prev =>
        prev.map(group => ({
          ...group,
          posts: group.posts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  is_liked: !isLiked,
                  likes_count: isLiked ? post.likes_count! - 1 : post.likes_count! + 1,
                }
              : post
          ),
        }))
      )
    } catch (err) {
      console.error('点赞操作失败:', err)
    }
  }

  const handleFavorite = async (postId: string, isFavorited: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('post_id', postId).eq('user_id', userId)
      } else {
        await supabase.from('favorites').insert({ post_id: postId, user_id: userId })
      }

      setDailyGroups(prev =>
        prev.map(group => ({
          ...group,
          posts: group.posts.map(post =>
            post.id === postId ? { ...post, is_favorited: !isFavorited } : post
          ),
        }))
      )
    } catch (err) {
      console.error('收藏操作失败:', err)
    }
  }

  const handlePostClick = (postId: string) => {
    supabase.from('browsing_history').insert({
      post_id: postId,
      user_id: userId,
    }).then(({ error }) => {
      if (error) console.warn('插入浏览记录失败:', error)
    })
    router.push(`/post/${postId}`)
  }

  const goToPreviousDay = () => {
    if (currentIndex < dailyGroups.length - 1) {
      setCurrentIndex(prev => prev + 1)
      // 滚动到对应位置
      setTimeout(() => {
        const element = document.getElementById(`day-${currentIndex + 1}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  const goToNextDay = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setTimeout(() => {
        const element = document.getElementById(`day-${currentIndex - 1}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600"></div>
      </div>
    )
  }

  if (dailyGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无内容</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">来创作你的第一条手链吧</p>
        <button
          onClick={() => router.push('/create')}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium"
        >
          开始创作
        </button>
      </div>
    )
  }

  return (
    <div className="pb-20">
      {/* 日期导航栏 */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 backdrop-blur-sm px-4 py-3 flex items-center justify-center">
        {dailyGroups.length > 1 ? (
          <div className="flex items-center justify-between w-full max-w-md">
            <button
              onClick={goToPreviousDay}
              disabled={currentIndex >= dailyGroups.length - 1}
              className={`p-2 rounded-full transition ${
                currentIndex >= dailyGroups.length - 1
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center flex-1">
              <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{dailyGroups[currentIndex]?.dateLabel || ''}</p>
            </div>
            <button
              onClick={goToNextDay}
              disabled={currentIndex <= 0}
              className={`p-2 rounded-full transition ${
                currentIndex <= 0
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{dailyGroups[0]?.dateLabel || ''}</p>
          </div>
        )}
      </div>

      {/* 每日精选 */}
      {dailyGroups.map((group, groupIndex) => (
        <section
          key={group.date}
          id={`day-${groupIndex}`}
          className="scroll-mt-20"
        >
          {/* 每日3个精选帖子 */}
          <div className="p-4 space-y-6">
            {group.posts.map((post, postIndex) => (
              <article
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.98]"
                onClick={() => handlePostClick(post.id)}
              >
                {/* 图片区域 */}
                {post.image_url && (
                  <div className="relative">
                    <img
                      src={post.image_url}
                      alt="生成的手链"
                      className="w-full h-auto max-h-96 object-cover"
                      loading="lazy"
                    />
                    {/* 浏览量标签 */}
                    <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
                      <span className="text-white text-xs font-medium">
                        🔥 {post.views_count || 0} 浏览
                      </span>
                    </div>
                  </div>
                )}

                {/* 内容区域 */}
                <div className="p-6 relative">
                  {/* 艺术引号 */}
                  <div className="absolute top-2 left-4 text-6xl text-purple-100 dark:text-purple-900/30 font-serif leading-none">
                    "
                  </div>

                  {/* 文字内容 */}
                  <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed pl-6 pr-4 pt-4 pb-2 relative">
                    {post.content}
                  </p>

                  {/* 底部操作栏 */}
                  <div className="flex items-center justify-between mt-4 pl-6" onClick={(e) => e.stopPropagation()}>
                    {/* 用户信息 */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-medium shadow-md">
                        {(post.user?.user_metadata?.name || post.user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {post.user?.user_metadata?.name || post.user?.email?.split('@')[0] || '匿名用户'}
                      </span>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1">
                      <button
                        className={`p-2 rounded-full transition ${
                          post.is_liked
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        onClick={(e) => handleLike(post.id, post.is_liked!, e)}
                      >
                        <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        className={`p-2 rounded-full transition ${
                          post.is_favorited
                            ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        onClick={(e) => handleFavorite(post.id, post.is_favorited!, e)}
                      >
                        <Bookmark className={`w-5 h-5 ${post.is_favorited ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* 点赞数显示 */}
                  <div className="flex items-center gap-1 pl-6 mt-2">
                    <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{post.likes_count || 0} 人喜欢</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* 加载更多触发器 */}
      <div ref={observerTarget} className="py-8">
        {loadingMore && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-200 border-t-purple-600"></div>
          </div>
        )}
        {!hasMore && dailyGroups.length > 0 && (
          <div className="text-center text-gray-400 text-sm">
            已经到底啦 ~
          </div>
        )}
      </div>
    </div>
  )
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // 重置时间部分以便比较
  const resetTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const resetDate = resetTime(date)
  const resetToday = resetTime(today)
  const resetYesterday = resetTime(yesterday)

  if (resetDate.getTime() === resetToday.getTime()) {
    return '今日精选'
  } else if (resetDate.getTime() === resetYesterday.getTime()) {
    return '昨日热门'
  } else {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[date.getDay()]
    return `${month}月${day}日 · ${weekday}`
  }
}
