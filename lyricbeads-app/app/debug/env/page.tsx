'use client'

import { useEffect, useState } from 'react'

export default function DebugEnvPage() {
  const [env, setEnv] = useState<any>({})

  useEffect(() => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      // 不显示完整的 key，只显示前几个字符
      hasNextPublicKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'none',
    })
  }, [])

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">环境变量调试</h1>
      <pre className="bg-white p-4 rounded-lg shadow">
        {JSON.stringify(env, null, 2)}
      </pre>
      <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
        <p className="font-semibold">如果上面显示值为空或 undefined：</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>检查 .env.local 文件是否在项目根目录</li>
          <li>确保重启了开发服务器</li>
          <li>确保环境变量以 NEXT_PUBLIC_ 开头</li>
        </ol>
      </div>
    </div>
  )
}
