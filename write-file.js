const fs = require('fs')
const content = `'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()

  if (pathname === '/login') return null

  const tabs = [
    { href: '/', icon: '🏠', label: lang === 'zh' ? '首页' : 'Home' },
    { href: '/jobs/new', icon: '➕', label: lang === 'zh' ? '新工程' : 'New Job' },
    { href: '/quotes', icon: '📋', label: lang === 'zh' ? '报价单' : 'Quotes' },
    { href: '/tax', icon: '📊', label: lang === 'zh' ? '税务' : 'Tax' },
    { href: '/cashflow', icon: '💰', label: lang === 'zh' ? '现金流' : 'Cash' },
    { href: '/clients', icon: '👥', label: lang === 'zh' ? '客户' : 'Clients' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-[100] shadow-lg">
      <div className="flex justify-around items-center py-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={\`flex flex-col items-center gap-0 px-1 py-1 rounded-lg \${isActive(tab.href) ? 'text-blue-600' : 'text-gray-500'}\`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}`

fs.writeFileSync('app/components/BottomNav.tsx', content)
console.log('done')
