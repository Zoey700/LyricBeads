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

    // 先检查评论是否存在且属于当前用户
    const { data: comment } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 })
    }

    // 检查是否是评论作者或管理员
    const userRole = user.user_metadata?.role || 'user'
    const isAdmin = userRole === 'admin'

    if (comment.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: '无权删除此评论' }, { status: 403 })
    }

    // 删除评论
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除评论数据库错误:', error)
      throw error
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('删除评论失败:', error)
    return NextResponse.json({ error: '删除评论失败' }, { status: 500 })
  }
}
