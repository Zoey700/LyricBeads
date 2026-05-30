'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mic, Send, Sparkles, Image as ImageIcon } from 'lucide-react'
import PageLayout from '@/components/PageLayout'

export default function CreatePage() {
  const [content, setContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string>('')
  const supabase = createClient()

  const startRecording = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别功能')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setContent(transcript)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
      alert('语音识别出错，请重试')
    }

    recognition.start()
  }

  const generateBracelet = async () => {
    if (!content.trim()) {
      alert('请先输入内容')
      return
    }

    setGenerating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      // 1. 生成图片
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) throw new Error('生成失败')

      const data = await response.json()

      // 2. 下载图片并上传到 Supabase Storage
      try {
        const imageResponse = await fetch(data.imageUrl)
        const blob = await imageResponse.blob()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bracelet-images')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadError) {
          console.warn('上传失败，使用原始URL:', uploadError)
          setGeneratedImage(data.imageUrl)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('bracelet-images')
            .getPublicUrl(fileName)
          setGeneratedImage(publicUrl)
        }
      } catch (uploadErr) {
        console.warn('上传失败，使用原始URL:', uploadErr)
        setGeneratedImage(data.imageUrl)
      }
    } catch (err: any) {
      alert(err.message || '生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const publishPost = async () => {
    if (!content.trim()) {
      alert('请输入内容')
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content,
        image_url: generatedImage || undefined,
        is_public: true,
      })

      if (error) throw error

      alert('发布成功！')
      setContent('')
      setGeneratedImage('')
      window.location.href = '/'
    } catch (err: any) {
      alert(err.message || '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout>
      <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg z-10 px-4 py-3 border-b border-gray-100 dark:border-gray-700 lg:hidden">
        <h1 className="text-lg font-bold text-center text-gray-900 dark:text-white">创作手链</h1>
      </header>

      <div className="p-4 space-y-4 min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 lg:bg-transparent lg:p-6">
        <div className="lg:bg-white dark:lg:bg-gray-800 lg:rounded-2xl lg:shadow-sm lg:p-6 lg:space-y-6">
          {/* PC端标题 */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden lg:block">创作手链</h1>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              输入歌词、诗词或心情...
            </label>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下你的心情、喜欢的歌词或诗句..."
                className="w-full h-40 p-4 pr-12 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                maxLength={500}
              />
              <button
                onClick={startRecording}
                disabled={isRecording}
                className={`absolute bottom-4 right-4 p-2 rounded-full transition ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/50'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{content.length}/500</p>
          </div>

          {generatedImage && (
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-sm lg:bg-gray-50 dark:lg:bg-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">生成的手链</span>
              </div>
              <img
                src={generatedImage}
                alt="生成的手链"
                className="w-full rounded-xl"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={generateBracelet}
              disabled={generating || !content.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  生成手链
                </>
              )}
            </button>

            <button
              onClick={publishPost}
              disabled={submitting || !content.trim()}
              className="flex-1 py-3 px-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  发布中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  发布
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 提示：输入歌词、诗词或心情后，点击「生成手链」AI 会为你创作专属的手链图片，然后点击「发布」分享到社区。
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
