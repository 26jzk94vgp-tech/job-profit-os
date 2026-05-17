const fs = require('fs')
const content = `'use client'

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
}`

fs.writeFileSync('app/components/BottomNav.tsx', content)
console.log('done')
const fs = require('fs')
let c = fs.readFileSync('app/finance/page.tsx', 'utf8')

c = c.replace(
  `          <Link href="/import-materials" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">`,
  `          <Link href="/tax" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '税务中心' : 'Tax Hub'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? 'GST、BAS、ATO分类申报' : 'GST, BAS & ATO Categories'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/import-materials" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">`
)

fs.writeFileSync('app/finance/page.tsx', c)
console.log('done finance')
