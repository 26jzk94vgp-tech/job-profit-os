'use client'

import { useState } from 'react'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import { createClient } from '../../utils/supabase/client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function MobileHeader() {
  const { lang } = useLanguage()
  const pathname = usePathname()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  if (pathname === '/login' || pathname === '/onboarding' || pathname === '/landing' || pathname === '/') return null

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const zh = lang === 'zh'
  const nav = [
    { href: '/', icon: '🏠', label: zh ? '首页' : 'Home' },
    { href: '/jobs', icon: '🔨', label: zh ? '工单' : 'Jobs' },
    { href: '/quotes', icon: '📋', label: zh ? '报价' : 'Quotes' },
    { href: '/clients', icon: '👥', label: zh ? '客户' : 'Clients' },
    { href: '/finance', icon: '💹', label: zh ? '财务' : 'Finance' },
    { href: '/settings', icon: '⚙️', label: zh ? '设置' : 'Settings' },
  ]

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-[#3A3A3C] px-4 py-3 z-50 flex justify-between items-center">
        <span className="font-semibold text-gray-900 dark:text-white text-sm">CIMO</span>
        <button onClick={() => setOpen(true)} aria-label="menu" className="w-9 h-9 rounded-lg border border-gray-200 dark:border-[#3A3A3C] bg-gray-100 dark:bg-[#2C2C2E] flex flex-col items-center justify-center gap-1">
          <span className="block w-4 h-px bg-gray-600 dark:bg-[#8E8E93]" />
          <span className="block w-4 h-px bg-gray-600 dark:bg-[#8E8E93]" />
          <span className="block w-4 h-px bg-gray-600 dark:bg-[#8E8E93]" />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 w-56 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#3A3A3C] rounded-2xl overflow-hidden shadow-2xl">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={'flex items-center gap-3 px-4 py-3 text-sm ' + (pathname === n.href ? 'text-[#0A84FF] bg-[#0A84FF]/10' : 'text-gray-800 dark:text-white')}>
                <span>{n.icon}</span>{n.label}
              </Link>
            ))}
            <div className="h-px bg-gray-200 dark:bg-[#3A3A3C]" />
            <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-[#FF453A]">
              <span>🚪</span>{zh ? '退出' : 'Log Out'}
            </button>
          </div>
        </div>
      )}

      <div className="md:hidden" style={{ height: '64px' }} aria-hidden />
    </>
  )
}
