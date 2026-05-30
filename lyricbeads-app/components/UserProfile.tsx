'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post, User } from '@/types'
import { Heart, Bookmark, Clock, Settings, User as UserIcon, ChevronRight, Grid3X3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfileProps {
  userId: string
  user: User
}

export default function UserProfile({ userId, user }: UserProfileProps) {
  const [myPostsCount, setMyPostsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchMyPostsCount()
  }, [])

  const fetchMyPostsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      if (!error) {
        setMyPostsCount(data?.length || 0)
      }
    } catch (err) {
      console.error('获取创作数量失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 菜单项配置
  const menuItems = [
    {
      id: 'history',
      label: '浏览历史',
      icon: Clock,
      href: '/profile?tab=history',
      description: '看过的内容'
    },
    {
      id: 'likes',
      label: '点赞',
      icon: Heart,
      href: '/profile?tab=likes',
      description: '喜欢的作品'
    },
    {
      id: 'favorites',
      label: '收藏',
      icon: Bookmark,
      href: '/profile?tab=favorites',
      description: '收藏的内容'
    },
    {
      id: 'settings',
      label: '设置',
      icon: Settings,
      href: '/settings',
      description: '账号设置'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* 顶部头像和用户名区域 */}
      <header className="bg-white dark:bg-gray-800 px-6 pt-8 pb-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
            {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {user.user_metadata?.name || user.email?.split('@')[0] || '用户'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
        </div>
      </header>

      {/* 我的创作 - 高亮显示 */}
      <section className="px-4 py-3">
        <Link
          href="/profile?tab=myPosts"
          className="block bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-5 text-white shadow-lg active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                <Grid3X3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">我的创作</h2>
                <p className="text-white/80 text-sm">
                  {loading ? '...' : `${myPostsCount} 部作品`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white/60" />
          </div>
        </Link>
      </section>

      {/* 功能菜单列表 */}
      <section className="px-4 py-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-700 transition ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.label}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* 底部提示 */}
      <footer className="text-center py-6">
        <p className="text-xs text-gray-400 dark:text-gray-500">LyricBeads · 用歌词编织手链</p>
      </footer>
    </div>
  )
}
