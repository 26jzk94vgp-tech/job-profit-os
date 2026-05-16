'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()

  if (pathname === '/login') return null

  const tabs = [
    { href: '/', icon: '🏠', label: lang === 'zh' ? '首页' : 'Home' },
    { href: '/jobs/new', icon: '➕', label: lang === 'zh' ? '新建' : 'New' },
    { href: '/quotes', icon: '📋', label: lang === 'zh' ? '报价' : 'Quote' },
    { href: '/tax', icon: '📊', label: lang === 'zh' ? '税务' : 'Tax' },
    { href: '/finance', icon: '💹', label: lang === 'zh' ? '财务' : 'Finance' },
    { href: '/clients', icon: '👥', label: lang === 'zh' ? '客户' : 'Client' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-[100] shadow-lg">
      <div className="grid grid-cols-6 items-center py-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0 py-1 ${isActive(tab.href) ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="text-[9px] font-medium leading-tight mt-0.5">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}