'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugSupabasePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testConnection = async () => {
    setLoading(true)
    setResult(null)

    try {
      // 测试 1: 检查客户端是否创建成功
      const clientInfo = {
        hasAuth: !!supabase.auth,
        supabaseUrl: (supabase as any).supabaseUrl,
        supabaseKey: (supabase as any).supabaseKey?.substring(0, 30) + '...',
      }

      // 测试 2: 直接 fetch 请求
      const testResponse = await fetch('https://obgupwnrfietechhttlo.supabase.co/auth/v1/user', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZ3Vwd25yZmlldGVjaGh0dGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mjc3MTQsImV4cCI6MjA5NDUwMzcxNH0.IxLTy4LJRECUNl49yvEs1lmQi7PZ5TbeRlk7blJFJxw',
          'Content-Type': 'application/json',
        },
      })

      const fetchResult = {
        ok: testResponse.ok,
        status: testResponse.status,
        statusText: testResponse.statusText,
      }

      setResult({
        clientInfo,
        fetchResult,
      })
    } catch (err: any) {
      setResult({
        error: err.message,
        stack: err.stack,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Supabase 连接调试</h1>

      <button
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '测试中...' : '测试连接'}
      </button>

      {result && (
        <pre className="mt-4 bg-white p-4 rounded-lg shadow overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
        <p className="font-semibold">如果测试失败，请检查：</p>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
          <li>Supabase 项目是否已暂停（登录 Supabase Dashboard 检查）</li>
          <li>API Key 是否正确（可能已过期）</li>
          <li>浏览器控制台 Network 标签中的请求详情</li>
        </ol>
      </div>
    </div>
  )
}
