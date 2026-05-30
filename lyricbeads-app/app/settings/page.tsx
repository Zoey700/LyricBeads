'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User as UserIcon, Bell, Shield, Info, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import { useTheme } from '@/hooks/useTheme'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggleTheme, mounted } = useTheme()

  useEffect(() => {
    supabase.auth.getUser().then((result: any) => {
      setUser(result.data.user)
    })
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('登出失败:', err)
    }
  }

  const menuItems = [
    { icon: UserIcon, label: '编辑资料', href: '/settings/profile' },
    { icon: Bell, label: '通知设置', href: '/settings/notifications' },
    { icon: Shield, label: '隐私设置', href: '/settings/privacy' },
    { icon: Info, label: '关于我们', href: '/settings/about' },
  ]

  // 防止服务端渲染时闪烁
  if (!mounted) {
    return null
  }

  return (
    <PageLayout>
      <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg z-10 px-4 py-3 border-b border-gray-100 dark:border-gray-700 lg:hidden">
        <Link
          href="/profile"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </Link>
      </header>

      <div className="p-4 space-y-4 lg:bg-white dark:lg:bg-black lg:rounded-2xl lg:shadow-sm lg:p-6 lg:min-h-full">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white lg:hidden">设置</h1>

        {/* PC端标题 */}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden lg:block">设置</h1>

        {/* 用户信息卡片 */}
        {user && (
          <div className="bg-white dark:bg-black rounded-2xl p-4 shadow-sm lg:bg-gray-50 dark:lg:bg-black lg:border lg:border-gray-200 dark:lg:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user.user_metadata?.name || '用户'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* 夜间模式开关 */}
        <div className="bg-white dark:bg-black rounded-2xl shadow-sm overflow-hidden lg:bg-gray-50 dark:lg:bg-black lg:border lg:border-gray-200 dark:lg:border-gray-800">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-50 dark:active:bg-gray-900 transition"
          >
            <div className="flex items-center gap-4">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <Sun className="w-5 h-5 text-orange-500" />
              )}
              <span className="text-gray-900 dark:text-white">夜间模式</span>
            </div>
            <div className="relative w-12 h-7 bg-gray-200 dark:bg-purple-600 rounded-full transition-colors">
              <div className={`absolute top-1 ${theme === 'dark' ? 'right-1' : 'left-1'} w-5 h-5 bg-white rounded-full shadow-sm transition-all`} />
            </div>
          </button>
        </div>

        {/* 其他设置菜单 */}
        <div className="bg-white dark:bg-black rounded-2xl shadow-sm overflow-hidden lg:bg-gray-50 dark:lg:bg-black lg:border lg:border-gray-200 dark:lg:border-gray-800">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 active:bg-gray-50 dark:active:bg-gray-900 transition"
              >
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="flex-1 text-gray-900 dark:text-white">{item.label}</span>
                <span className="text-gray-400 dark:text-gray-600">›</span>
              </Link>
            )
          })}
        </div>

        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-white dark:bg-black rounded-2xl shadow-sm text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition lg:bg-gray-50 dark:lg:bg-black lg:border lg:border-gray-200 dark:lg:border-gray-800"
        >
          退出登录
        </button>

        {/* 版本信息 */}
        <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
          <p>LyricBeads v1.0.0</p>
          <p className="mt-1">文字化作珠串，心情结成手链</p>
        </div>
      </div>
    </PageLayout>
  )
}
