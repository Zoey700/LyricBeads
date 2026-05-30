'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types'
import { Heart, Bookmark, Share2, Check, Link, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createShareCard } from '@/utils/shareImage'

interface FavoritesListProps {
  userId: string
}

export default function FavoritesList({ userId }: FavoritesListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sharingPostId, setSharingPostId] = useState<string | null>(null)
  const [sharedPostId, setSharedPostId] = useState<string | null>(null)
  const [copyingLinkPostId, setCopyingLinkPostId] = useState<string | null>(null)
  const [copiedLinkPostId, setCopiedLinkPostId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const { data: favoritesData, error } = await supabase
        .from('favorites')
        .select('post_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const postIds = (favoritesData || []).map((f: any) => f.post_id)

      if (postIds.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // 获取帖子
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)

      // 获取点赞数
      const { data: allLikes } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)

      const likeCounts: Record<string, number> = {}
      allLikes?.forEach((like: any) => {
        likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
      })

      const posts = (postsData || []).map((post: any) => ({
        ...post,
        user: { id: post.user_id, email: '', user_metadata: {} },
        likes_count: likeCounts[post.id] || 0,
        is_liked: false,
        is_favorited: true,
      }))

      setPosts(posts)
    } catch (err) {
      console.error('获取收藏失败:', err)
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

  const handleUnfavorite = async (postId: string) => {
    try {
      await supabase.from('favorites').delete().eq('post_id', postId).eq('user_id', userId)
      setPosts(posts.filter(post => post.id !== postId))
    } catch (err) {
      console.error('取消收藏失败:', err)
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

  const handleCopyLink = async (postId: string) => {
    setCopyingLinkPostId(postId)
    setCopiedLinkPostId(null)

    try {
      const shareUrl = `${window.location.protocol}//${window.location.host}/post/${postId}`
      await navigator.clipboard.writeText(shareUrl)
      setCopiedLinkPostId(postId)
      setTimeout(() => setCopiedLinkPostId(null), 2000)
    } catch (err) {
      console.error('复制链接失败:', err)
      alert('复制链接失败，请重试')
    } finally {
      setCopyingLinkPostId(null)
    }
  }

  const handlePostClick = (postId: string) => {
    // 异步插入浏览记录，不阻塞导航
    supabase.from('browsing_history').insert({
      post_id: postId,
      user_id: userId,
    }).then(({ error }: any) => {
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

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <Bookmark className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无收藏</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">去社区发现更多精彩内容吧</p>
        <button
          onClick={() => router.push('/community')}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium"
        >
          探索社区
        </button>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {posts.map((post) => (
        <article
          key={post.id}
          className="p-4 active:bg-gray-50 dark:active:bg-gray-700 transition cursor-pointer"
          onClick={() => handlePostClick(post.id)}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium flex-shrink-0">
              {(post.user?.user_metadata?.name || post.user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {post.user?.user_metadata?.name || post.user?.email?.split('@')[0] || '匿名用户'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.created_at).toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <p className="text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>

          {post.image_url && (
            <div className="mb-3 -mx-4">
              <img
                src={post.image_url}
                alt="生成的手链"
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {post.emotion_type && (
            <div className="mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                {getEmotionLabel(post.emotion_type)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-around pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              className={`flex items-center gap-1.5 text-sm ${post.is_liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => handleLike(post.id, post.is_liked!)}
            >
              <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
              <span>{post.likes_count || 0}</span>
            </button>

            <button
              className="flex items-center gap-1.5 text-sm text-yellow-500 dark:text-yellow-400"
              onClick={() => handleUnfavorite(post.id)}
            >
              <Bookmark className="w-5 h-5 fill-current" />
              <span>已收藏</span>
            </button>

            {/* 图片分享 */}
            <button
              className={`flex items-center gap-1.5 text-sm ${
                sharingPostId === post.id
                  ? 'text-gray-400'
                  : sharedPostId === post.id
                  ? 'text-green-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => handleShare(post)}
              disabled={sharingPostId === post.id}
            >
              {sharingPostId === post.id ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  <span>生成中</span>
                </>
              ) : sharedPostId === post.id ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  <span>图片</span>
                </>
              )}
            </button>

            {/* 链接分享 */}
            <button
              className={`flex items-center gap-1.5 text-sm ${
                copyingLinkPostId === post.id
                  ? 'text-gray-400'
                  : copiedLinkPostId === post.id
                  ? 'text-green-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => handleCopyLink(post.id)}
              disabled={copyingLinkPostId === post.id}
            >
              {copyingLinkPostId === post.id ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  <span>复制中</span>
                </>
              ) : copiedLinkPostId === post.id ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Link className="w-5 h-5" />
                  <span>链接</span>
                </>
              )}
            </button>
          </div>
        </article>
      ))}
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
