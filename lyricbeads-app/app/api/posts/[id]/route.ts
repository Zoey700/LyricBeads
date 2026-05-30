import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // 先检查帖子是否存在且属于当前用户
    const { data: post } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!post) {
      return NextResponse.json({ error: '作品不存在' }, { status: 404 })
    }

    // 检查是否是帖子作者或管理员
    const userRole = user.user_metadata?.role || 'user'
    const isAdmin = userRole === 'admin'

    if (post.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: '无权删除此作品' }, { status: 403 })
    }

    // 删除帖子（级联删除相关的点赞、收藏、评论、浏览记录）
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除作品数据库错误:', error)
      throw error
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('删除作品失败:', error)
    return NextResponse.json({ error: '删除作品失败' }, { status: 500 })
  }
}
