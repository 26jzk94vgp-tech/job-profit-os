'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    { href: '/', icon: '🏠', label: '首页', labelEn: 'Home' },
    { href: '/jobs/new', icon: '➕', label: '新工程', labelEn: 'New Job' },
    { href: '/tax', icon: '📊', label: '税务', labelEn: 'Tax' },
    { href: '/cashflow', icon: '💰', label: '现金流', labelEn: 'Cash Flow' },
    { href: '/clients', icon: '👥', label: '客户', labelEn: 'Clients' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${isActive(tab.href) ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}