import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = session.user
    const { id } = await params

    // 检查评论是否存在
    const { data: comment } = await supabase
      .from('comments')
      .select('id')
      .eq('id', id)
      .single()

    if (!comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 })
    }

    // 检查是否已点赞
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      return NextResponse.json({ error: '已经点赞过了' }, { status: 400 })
    }

    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: id,
        user_id: user.id,
      })

    if (error) throw error

    // 获取最新的点赞数
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', id)

    return NextResponse.json({
      likes_count: likes?.length || 0,
      is_liked: true,
    })
  } catch (error) {
    console.error('点赞失败:', error)
    return NextResponse.json({ error: '点赞失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = session.user
    const { id } = await params

    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', id)
      .eq('user_id', user.id)

    if (error) throw error

    // 获取最新的点赞数
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', id)

    return NextResponse.json({
      likes_count: likes?.length || 0,
      is_liked: false,
    })
  } catch (error) {
    console.error('取消点赞失败:', error)
    return NextResponse.json({ error: '取消点赞失败' }, { status: 500 })
  }
}
