'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'

const ALLOWED_PATHS = ['/login', '/onboarding', '/pricing', '/settings', '/landing']

export default function TrialGuard() {
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // 不检查白名单页面
    if (ALLOWED_PATHS.some(p => pathname.startsWith(p))) return

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at, plan_type')
        .eq('id', user.id)
        .single()

      if (!profile) return

      // 已付费用户不限制
      if (profile.plan_type === 'pro' || profile.plan_type === 'business') return

      // 试用期到期 → 跳转 pricing
      if (profile.trial_ends_at) {
        const trialEnd = new Date(profile.trial_ends_at)
        if (trialEnd < new Date()) {
          window.location.href = '/pricing?expired=1'
        }
      }
    }

    check()
  }, [pathname])

  return null
}
