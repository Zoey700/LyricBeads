'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // 注册
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error

        // 注册成功
        if (data.user) {
          router.push('/')
          router.refresh()
        }
      } else {
        // 登录
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // 登录成功
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex dark:bg-gray-900">
      {/* 左侧品牌区 - 仅PC端显示 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-500 items-center justify-center p-12">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">LyricBeads</h1>
          <p className="text-xl text-white/90">文字化作珠串，心情结成手链</p>
          <p className="mt-8 text-white/80">输入歌词、诗词或心情，AI 为你生成专属手链</p>
        </div>
      </div>

      {/* 右侧登录区 */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 lg:bg-gray-50 lg:dark:bg-gray-900">
        <div className="w-full max-w-sm lg:max-w-md">
          {/* 移动端品牌显示 */}
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              LyricBeads
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">文字化作珠串，心情结成手链</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-center mb-6 text-gray-900 dark:text-white">
              {isSignUp ? '创建账号' : '登录'}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className={`text-sm ${isSignUp ? 'text-green-600' : 'text-red-500'}`}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? '处理中...' : isSignUp ? '注册' : '登录'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {isSignUp ? '已有账号？' : '还没有账号？'}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                }}
                className="ml-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                {isSignUp ? '登录' : '注册'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
