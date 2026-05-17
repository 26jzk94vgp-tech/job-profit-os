'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '../lib/i18n/LanguageContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()

  const tabs = [
    { href: '/', icon: '🏠', label: lang === 'zh' ? '首页' : 'Home' },
    { href: '/jobs', icon: '🔨', label: lang === 'zh' ? '工单' : 'Jobs' },
    { href: '/clients', icon: '👥', label: lang === 'zh' ? '客户' : 'Clients' },
    { href: '/finance', icon: '💹', label: lang === 'zh' ? '财务' : 'Finance' },
    { href: '/settings', icon: '⚙️', label: lang === 'zh' ? '设置' : 'Settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50">
      {tabs.map((tab) => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
        return (
          <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5">
            <span className="text-xl">{tab.icon}</span>
            <span className={isActive ? 'text-xs font-medium text-blue-600' : 'text-xs text-gray-400'}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}