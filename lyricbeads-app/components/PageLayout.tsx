'use client'

import { useEffect, useState } from 'react'
import SidebarNav from './SidebarNav'
import BottomNav from './BottomNav'

interface PageLayoutProps {
  children: React.ReactNode
  showNav?: boolean
}

export default function PageLayout({ children, showNav = true }: PageLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 服务端渲染时显示加载状态
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600"></div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-black min-h-screen relative shadow-sm pb-20">
        {children}
        {showNav && <BottomNav />}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen dark:bg-black">
      {showNav && <SidebarNav />}
      <main className="flex-1 bg-gray-50 dark:bg-black">
        {children}
      </main>
    </div>
  )
}
