'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UploadReferencesPage() {
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const uploadFiles = async (files: FileList) => {
    setUploading(true)
    setResults([])

    for (const file of Array.from(files)) {
      try {
        const fileName = `references/${file.name}`

        console.log('上传文件:', fileName)

        const { data, error } = await supabase.storage
          .from('bracelet-images')
          .upload(fileName, file, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (error) {
          console.error('上传错误:', error)
          setResults(prev => [...prev, `❌ ${file.name} 失败: ${error.message}`])
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('bracelet-images')
            .getPublicUrl(fileName)

          setResults(prev => [...prev, `✅ ${file.name}\n${publicUrl}`])
        }
      } catch (err: any) {
        console.error('上传出错:', err)
        setResults(prev => [...prev, `❌ ${file.name} 出错: ${err.message}`])
      }
    }

    setUploading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">上传参考图片</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          登录用户: {user?.email}
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">选择图片文件</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png"
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              disabled={uploading}
              className="mt-2 block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 dark:file:bg-purple-900/30 file:text-purple-700 dark:file:text-purple-300
                hover:file:bg-purple-100 dark:hover:file:bg-purple-800/50
                disabled:opacity-50"
            />
          </label>

          {uploading && (
            <p className="text-sm text-gray-600 dark:text-gray-400">上传中...</p>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">上传结果</h2>
            <div className="space-y-2">
              {results.map((result, i) => (
                <pre key={i} className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                  {result}
                </pre>
              ))}
            </div>

            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              返回首页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
