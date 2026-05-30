import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = session.user
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 })
    }

    // 获取评论
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // 获取每个评论的点赞数和当前用户的点赞状态
    const commentIds = (comments || []).map(c => c.id)

    let likeCounts: Record<string, number> = {}
    let userLikedCommentIds = new Set<string>()

    if (commentIds.length > 0) {
      const { data: allLikes } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds)

      allLikes?.forEach(like => {
        likeCounts[like.comment_id] = (likeCounts[like.comment_id] || 0) + 1
        if (like.user_id === user.id) {
          userLikedCommentIds.add(like.comment_id)
        }
      })
    }

    const commentsWithLikes = (comments || []).map(comment => ({
      ...comment,
      likes_count: likeCounts[comment.id] || 0,
      is_liked: userLikedCommentIds.has(comment.id),
    }))

    return NextResponse.json({ comments: commentsWithLikes })
  } catch (error) {
    console.error('获取评论失败:', error)
    return NextResponse.json({ error: '获取评论失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 先尝试 getSession，更可靠
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // 调试：检查 session
    if (sessionError) {
      console.error('POST /api/comments - Session 错误:', sessionError)
    }
    console.log('POST /api/comments - Session 存在:', !!session)
    console.log('POST /api/comments - User ID:', session?.user?.id)

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = session.user

    const body = await request.json()
    const { postId, content } = body

    if (!postId || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({ error: '评论内容不能超过500字' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ comment: { ...data, likes_count: 0, is_liked: false } })
  } catch (error) {
    console.error('创建评论失败:', error)
    return NextResponse.json({ error: '创建评论失败' }, { status: 500 })
  }
}
