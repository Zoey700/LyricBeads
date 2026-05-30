'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post, User } from '@/types'
import { Heart, Bookmark, Share2, ArrowLeft, Download, Check, Link as LinkIcon, Image as ImageIcon, MessageCircle, Send, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createShareCard } from '@/utils/shareImage'
import { isAdmin, canDeletePost } from '@/utils/admin'
import type { Comment } from '@/types'

interface PostDetailProps {
  postId: string
  userId: string
}

export default function PostDetail({ postId, userId }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [copyingLink, setCopyingLink] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentInput, setCommentInput] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [deletingPost, setDeletingPost] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchPost()
    fetchComments()
    getCurrentUser()
  }, [postId])

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

  const fetchComments = async () => {
    setCommentsLoading(true)
    try {
      const response = await fetch(`/api/comments?postId=${postId}`, {
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('获取评论失败')
      const data = await response.json()
      setComments(data.comments || [])
    } catch (err) {
      console.error('获取评论失败:', err)
      setComments([]) // 确保错误时也有空数组，避免渲染问题
    } finally {
      setCommentsLoading(false)
    }
  }

  const fetchPost = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (error) throw error

      // 获取点赞状态
      const { data: likeData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('post_id', postId)

      // 获取收藏状态
      const { data: favoriteData } = await supabase
        .from('favorites')
        .select('user_id')
        .eq('post_id', postId)
        .eq('user_id', userId)

      const postData = {
        ...data,
        user: { id: data.user_id, email: '', user_metadata: {} },
        likes_count: likeData?.length || 0,
        is_liked: likeData?.some((l: any) => l.user_id === userId) || false,
        is_favorited: !!favoriteData?.length,
      }

      setPost(postData as Post)

      // 异步插入浏览记录，不影响主流程
      supabase.from('browsing_history').insert({
        post_id: postId,
        user_id: userId,
      }).then(({ error }) => {
        if (error) console.warn('插入浏览记录失败:', error)
      })
    } catch (err) {
      console.error('获取帖子详情失败:', err)
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!post) return

    try {
      if (post.is_liked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: userId })
      }
      setPost({
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.is_liked ? post.likes_count! - 1 : post.likes_count! + 1,
      })
    } catch (err) {
      console.error('点赞操作失败:', err)
    }
  }

  const handleFavorite = async () => {
    if (!post) return

    try {
      if (post.is_favorited) {
        await supabase.from('favorites').delete().eq('post_id', postId).eq('user_id', userId)
      } else {
        await supabase.from('favorites').insert({ post_id: postId, user_id: userId })
      }
      setPost({
        ...post,
        is_favorited: !post.is_favorited,
      })
    } catch (err) {
      console.error('收藏操作失败:', err)
    }
  }

  const handleShare = async () => {
    if (!post?.image_url) {
      alert('没有可分享的图片')
      return
    }

    setSharing(true)
    setShared(false)

    try {
      const username = post.user?.user_metadata?.name || post.user?.email?.split('@')[0] || '用户'
      const success = await createShareCard(post.image_url, post.content, username)

      if (success) {
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } else {
        alert('生成分享图片失败，请重试')
      }
    } catch (err) {
      console.error('分享失败:', err)
      alert('分享失败，请重试')
    } finally {
      setSharing(false)
    }
  }

  const handleCopyLink = async () => {
    setCopyingLink(true)
    setCopiedLink(false)

    try {
      const shareUrl = window.location.href
      await navigator.clipboard.writeText(shareUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('复制链接失败:', err)
      alert('复制链接失败，请重试')
    } finally {
      setCopyingLink(false)
    }
  }

  const handleDownload = async () => {
    if (!post?.image_url) return

    setSaving(true)
    try {
      const response = await fetch(post.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lyricbeads-${postId}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('下载失败:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentInput.trim() || submittingComment) return

    setSubmittingComment(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          postId,
          content: commentInput.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))
        throw new Error(errorData.error || '发送评论失败')
      }

      setCommentInput('')
      // 重新获取评论列表以获取完整数据
      await fetchComments()
    } catch (err) {
      console.error('发送评论失败:', err)
      alert(err instanceof Error ? err.message : '发送评论失败，请重试')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))
        throw new Error(errorData.error || '删除评论失败')
      }

      setComments(comments.filter(c => c.id !== commentId))
    } catch (err) {
      console.error('删除评论失败:', err)
      alert(err instanceof Error ? err.message : '删除评论失败，请重试')
    }
  }

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        credentials: 'same-origin',
      })

      if (!response.ok) throw new Error('点赞操作失败')

      const data = await response.json()
      setComments(comments.map(c =>
        c.id === commentId
          ? { ...c, likes_count: data.likes_count, is_liked: data.is_liked }
          : c
      ))
    } catch (err) {
      console.error('点赞操作失败:', err)
    }
  }

  const handleDeletePost = async () => {
    if (!post || !confirm('确定要删除这个作品吗？')) return

    setDeletingPost(true)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))
        throw new Error(errorData.error || '删除失败')
      }

      alert('删除成功')
      router.push('/community')
    } catch (err: any) {
      console.error('删除作品失败:', err)
      alert(err.message || '删除失败，请重试')
    } finally {
      setDeletingPost(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">帖子不存在</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-full"
        >
          返回
        </button>
      </div>
    )
  }

  return (
    <div className="pb-6 lg:pb-0">
      <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg z-10 px-4 py-3 border-b border-gray-100 dark:border-gray-700 lg:bg-white dark:lg:bg-gray-800 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          {canDeletePost(currentUser, post?.user_id || '') && (
            <button
              onClick={handleDeletePost}
              disabled={deletingPost}
              className="flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
              title={currentUser?.id === post?.user_id ? '删除我的作品' : '管理员删除'}
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-sm font-medium">删除</span>
            </button>
          )}
        </div>
      </header>

      <article className="bg-white dark:bg-gray-800 lg:rounded-2xl lg:shadow-sm lg:overflow-hidden">
        {post.image_url && (
          <div className="relative">
            <img
              src={post.image_url}
              alt="生成的手链"
              className="w-full h-96 lg:h-[500px] object-cover"
            />
          </div>
        )}

        <div className="p-4 lg:p-8">
          <div className="flex items-start gap-3 mb-4 lg:mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {(post.user?.user_metadata?.name || post.user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white lg:text-lg">
                {post.user?.user_metadata?.name || post.user?.email?.split('@')[0] || '匿名用户'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(post.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <p className="text-lg text-gray-800 dark:text-gray-200 mb-6 whitespace-pre-wrap leading-relaxed lg:text-xl">
            {post.content}
          </p>

          {post.emotion_type && (
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                {getEmotionLabel(post.emotion_type)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-around py-4 border-t border-b border-gray-100 dark:border-gray-700 lg:py-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition lg:px-6 lg:py-3 ${
                post.is_liked
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.likes_count || 0}</span>
            </button>

            <button
              onClick={handleFavorite}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition lg:px-6 lg:py-3 ${
                post.is_favorited
                  ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${post.is_favorited ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.is_favorited ? '已收藏' : '收藏'}</span>
            </button>

            {/* 图片分享 */}
            <button
              onClick={handleShare}
              disabled={sharing}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-full transition lg:px-4 lg:py-2 ${
                shared
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              {sharing ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  <span className="text-xs font-medium">生成中</span>
                </>
              ) : shared ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="text-xs font-medium">已复制</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-xs font-medium">图片</span>
                </>
              )}
            </button>

            {/* 链接分享 */}
            <button
              onClick={handleCopyLink}
              disabled={copyingLink}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-full transition lg:px-4 lg:py-2 ${
                copiedLink
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              {copyingLink ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  <span className="text-xs font-medium">复制中</span>
                </>
              ) : copiedLink ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="text-xs font-medium">已复制</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5" />
                  <span className="text-xs font-medium">链接</span>
                </>
              )}
            </button>
          </div>

          {post.image_url && (
            <button
              onClick={handleDownload}
              disabled={saving}
              className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 lg:py-4 lg:text-lg"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  下载中...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  保存图片
                </>
              )}
            </button>
          )}
        </div>
      </article>

      {/* 评论区域 */}
      <div className="mt-4 bg-white dark:bg-gray-800 lg:rounded-2xl lg:shadow-sm lg:overflow-hidden lg:mt-6">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            评论 ({comments.length})
          </h2>
        </div>

        {/* 评论输入框 */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium flex-shrink-0">
              {(post.user?.user_metadata?.name || post.user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="写下你的评论..."
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={2}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{commentInput.length}/500</span>
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentInput.trim() || submittingComment}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submittingComment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      发送
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {commentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-gray-900 dark:text-white font-medium mb-1">暂无评论</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">来发表第一条评论吧</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {(comment.user?.user_metadata?.name || comment.user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {comment.user?.user_metadata?.name || comment.user?.email?.split('@')[0] || '匿名用户'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleLikeComment(comment.id, comment.is_liked!)}
                        className={`flex items-center gap-1 text-sm ${
                          comment.is_liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${comment.is_liked ? 'fill-current' : ''}`} />
                        <span>{comment.likes_count || 0}</span>
                      </button>
                      {/* 评论删除按钮 - 评论作者或管理员可见 */}
                      {(comment.user_id === userId || isAdmin(currentUser)) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500"
                          title={comment.user_id === userId ? '删除评论' : '管理员删除评论'}
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
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
