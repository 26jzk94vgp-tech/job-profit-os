'use client'

import { useLanguage } from '../../lib/i18n/LanguageContext'
import { createClient } from '../../utils/supabase/client'
import { usePathname } from 'next/navigation'

export default function MobileHeader() {
  const { lang, setLang } = useLanguage()
  const pathname = usePathname()
  const supabase = createClient()

  if (pathname === '/login') return null

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 z-50 flex justify-between items-center">
      <span className="font-semibold text-gray-900 text-sm">Job Profit OS</span>
      <div className="flex items-center gap-2">
      
        <a href="/settings" className="text-xs font-medium px-3 py-2 rounded-lg bg-gray-100 text-gray-700">⚙️</a>
        <button
          onClick={handleSignOut}
          className="text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-600 active:bg-red-100"
        >
          {lang === 'zh' ? '退出' : 'Log Out'}
        </button>
      </div>
    </div>
  )
}