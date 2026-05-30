'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Mail, Camera } from 'lucide-react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then((result: any) => {
      const userData = result.data.user
      if (userData) {
        setUser(userData)
        setName(userData.user_metadata?.name || '')
      }
    })
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name }
      })

      if (error) throw error

      setUser({ ...user, user_metadata: { ...user.user_metadata, name } })
      setMessage('保存成功')
      setTimeout(() => setMessage(''), 2000)
    } catch (err: any) {
      setMessage(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
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
        <h1 className="text-xl font-bold text-gray-900 lg:hidden">编辑资料</h1>
        <h1 className="text-xl font-bold text-gray-900 hidden lg:block">编辑资料</h1>

        {/* 头像区域 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm lg:bg-gray-50 lg:border lg:border-gray-200">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">
              {(user?.user_metadata?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">头像</h2>
              <p className="text-sm text-gray-500">点击头像更换图片</p>
            </div>
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
              <Camera className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 昵称输入 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm lg:bg-gray-50 lg:border lg:border-gray-200">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700 mb-3">
            <User className="w-5 h-5 text-gray-400" />
            <span>昵称</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入昵称"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            maxLength={20}
          />
          <p className="text-xs text-gray-400 mt-2 text-right">{name.length}/20</p>
        </div>

        {/* 邮箱显示 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm lg:bg-gray-50 lg:border lg:border-gray-200">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700 mb-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <span>邮箱</span>
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-2">邮箱地址不可修改</p>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-2xl hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>

        {/* 提示消息 */}
        {message && (
          <p className={`text-center text-sm ${message.includes('成功') ? 'text-green-500' : 'text-red-500'}`}>
            {message}
          </p>
        )}
      </div>
    </PageLayout>
  )
}
