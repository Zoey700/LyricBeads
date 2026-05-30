'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, PlusCircle, User, Heart } from 'lucide-react'

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/community', label: '社区', icon: Compass },
  { path: '/create', label: '创作', icon: PlusCircle },
  { path: '/profile', label: '我的', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  // 隐藏导航栏的页面
  const hideNavPaths = ['/login']
  if (hideNavPaths.includes(pathname)) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            const Icon = item.icon

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 ${
                  isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon className={`w-6 h-6 ${item.path === '/create' ? 'w-8 h-8' : ''}`} />
                <span className="text-xs mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
