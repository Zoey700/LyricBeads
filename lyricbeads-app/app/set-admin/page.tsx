'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SetAdminPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setMessage('')

    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setMessage('请先登录')
        return
      }

      // 检查当前用户是否是目标用户（为了安全，只允许用户自己设置）
      if (user.email !== email) {
        setMessage('只能设置自己的角色')
        return
      }

      // 更新用户角色
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          role: 'admin'
        }
      })

      if (error) {
        setMessage('设置失败: ' + error.message)
      } else {
        setMessage('✓ 成功设置为管理员！刷新页面生效。')
        setTimeout(() => router.push('/'), 2000)
      }
    } catch (err: any) {
      setMessage('设置失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">设置管理员</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          输入你的邮箱地址将自己设置为管理员
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              邮箱地址
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.startsWith('✓')
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '设置中...' : '设置为管理员'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            注意：此页面仅供开发使用。在生产环境中，管理员角色应由系统管理员或通过安全的后台流程设置。
          </p>
        </div>
      </div>
    </div>
  )
}
