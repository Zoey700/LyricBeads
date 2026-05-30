'use client'

import { ArrowLeft, Bell, Heart, MessageSquare, User } from 'lucide-react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import { useState } from 'react'

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState({
    like: true,
    comment: true,
    follow: true,
    system: true,
  })

  const toggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  return (
    <PageLayout>
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg z-10 px-4 py-3 border-b border-gray-100 lg:hidden">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </Link>
      </header>

      <div className="p-4 space-y-4 lg:bg-white lg:rounded-2xl lg:shadow-sm lg:p-6 lg:min-h-full">
        <h1 className="text-xl font-bold text-gray-900">通知设置</h1>

        {/* 通知列表 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:bg-gray-50 lg:border lg:border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-gray-900 font-medium">点赞通知</p>
                <p className="text-xs text-gray-500">有人点赞你的作品时</p>
              </div>
            </div>
            <button
              onClick={() => toggle('like')}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.like ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-1 ${settings.like ? 'right-1' : 'left-1'} w-5 h-5 bg-white rounded-full shadow-sm transition-all`} />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-gray-900 font-medium">评论通知</p>
                <p className="text-xs text-gray-500">有人评论你的作品时</p>
              </div>
            </div>
            <button
              onClick={() => toggle('comment')}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.comment ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-1 ${settings.comment ? 'right-1' : 'left-1'} w-5 h-5 bg-white rounded-full shadow-sm transition-all`} />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-gray-900 font-medium">关注通知</p>
                <p className="text-xs text-gray-500">有人关注你时</p>
              </div>
            </div>
            <button
              onClick={() => toggle('follow')}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.follow ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-1 ${settings.follow ? 'right-1' : 'left-1'} w-5 h-5 bg-white rounded-full shadow-sm transition-all`} />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-gray-900 font-medium">系统通知</p>
                <p className="text-xs text-gray-500">接收系统公告和更新</p>
              </div>
            </div>
            <button
              onClick={() => toggle('system')}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.system ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-1 ${settings.system ? 'right-1' : 'left-1'} w-5 h-5 bg-white rounded-full shadow-sm transition-all`} />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center py-4">
          通知设置已自动保存
        </p>
      </div>
    </PageLayout>
  )
}
