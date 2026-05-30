import type { User } from '@/types'

/**
 * 检查用户是否是管理员
 * @param user 用户对象
 * @returns 是否是管理员
 */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.user_metadata?.role === 'admin'
}

/**
 * 检查用户是否可以删除指定帖子
 * @param user 当前用户
 * @param postUserId 帖子作者 ID
 * @returns 是否可以删除
 */
export function canDeletePost(user: User | null | undefined, postUserId: string): boolean {
  if (!user) return false
  return user.id === postUserId || isAdmin(user)
}

/**
 * 获取管理员邮箱列表
 * 这些邮箱的用户将被自动视为管理员
 */
export const ADMIN_EMAILS: string[] = [
  // 在这里添加管理员邮箱
  // 例如: 'admin@example.com'
]

/**
 * 检查邮箱是否在管理员列表中
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}
