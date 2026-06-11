'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import Link from 'next/link'

export default function Settings() {
  const supabase = createClient()
  const router = useRouter()
  const { lang, setLang } = useLanguage()
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [abn, setAbn] = useState('')
  const [bankName, setBankName] = useState('')
  const [bsb, setBsb] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [planType, setPlanType] = useState<string>('trial')

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true'
    setDarkMode(saved)
    if (saved) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setCompanyName(data.company_name || '')
        setCompanyEmail(data.company_email || '')
        setCompanyPhone(data.company_phone || '')
        setCompanyAddress(data.company_address || '')
        setAbn(data.abn || '')
        setBankName(data.bank_name || '')
        setBsb(data.bsb || '')
        setAccountNumber(data.account_number || '')
        setAccountName(data.account_name || '')
        setTrialEndsAt(data.trial_ends_at || null)
        setPlanType(data.plan_type || 'trial')
      }
    }
    loadProfile()
  }, [])

  // 计算试用剩余天数
  const trialDaysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('darkMode', String(next))
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  async function handleSave() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      company_name: companyName, company_email: companyEmail,
      company_phone: companyPhone, company_address: companyAddress, abn,
      bank_name: bankName, bsb, account_number: accountNumber, account_name: accountName,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)
    if (error) { console.error(error); alert('保存失败,请重试 / Save failed, please try again') } else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40 transition"
  const labelCls = "text-sm font-medium text-gray-700 dark:text-gray-300"
  const cardCls = "bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6 space-y-4"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">
            ← {lang === 'zh' ? '首页' : 'Home'}
          </Link>
          <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '设置' : 'Settings'}</h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-16 pb-8 md:pt-8 space-y-5">
        <div className="md:hidden flex items-center justify-between mb-2">
          <Link href="/" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '设置' : 'Settings'}</h1>
        </div>

        {/* 试用期 banner */}
        {trialDaysLeft !== null && trialDaysLeft > 0 && planType === 'trial' && (
          <div className="bg-[#30D158]/10 dark:bg-[#30D158]/10 border border-[#30D158]/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#30D158] text-sm">
                🎉 {lang === 'zh' ? `免费试用中 · 剩余 ${trialDaysLeft} 天` : `Free Trial · ${trialDaysLeft} days left`}
              </p>
              <p className="text-[#8E8E93] text-xs mt-0.5">
                {lang === 'zh' ? '所有功能已解锁' : 'All features unlocked'}
              </p>
            </div>
            <Link href="/pricing" className="bg-[#0A84FF] hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
              {lang === 'zh' ? '查看计划' : 'View Plans'}
            </Link>
          </div>
        )}

        {/* 试用到期 banner */}
        {trialDaysLeft !== null && trialDaysLeft <= 0 && planType === 'trial' && (
          <div className="bg-[#FF453A]/10 border border-[#FF453A]/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#FF453A] text-sm">
                ⚠️ {lang === 'zh' ? '试用已到期' : 'Trial Expired'}
              </p>
              <p className="text-[#8E8E93] text-xs mt-0.5">
                {lang === 'zh' ? '请升级以继续使用' : 'Please upgrade to continue'}
              </p>
            </div>
            <Link href="/pricing" className="bg-[#FF453A] hover:bg-red-400 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
              {lang === 'zh' ? '立即升级' : 'Upgrade Now'}
            </Link>
          </div>
        )}

        {/* Language */}
        <div className={cardCls}>
          <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '语言 / Language' : 'Language'}</h2>
          <div className="flex gap-3">
            <button onClick={() => setLang('en')} className={`flex-1 py-3 rounded-xl font-medium transition-colors ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
              🇦🇺 English
            </button>
            <button onClick={() => setLang('zh')} className={`flex-1 py-3 rounded-xl font-medium transition-colors ${lang === 'zh' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
              🇨🇳 中文
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className={cardCls}>
          <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '外观' : 'Appearance'}</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-[#F2F2F7] text-sm">{lang === 'zh' ? '暗色模式' : 'Dark Mode'}</p>
              <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '切换深色界面' : 'Switch to dark interface'}</p>
            </div>
            <button onClick={toggleDarkMode} className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-[#0A84FF]' : 'bg-gray-200 dark:bg-[#3A3A3C]'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Account */}
        <div className={cardCls}>
          <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '账户 / Account' : 'Account'}</h2>
          <p className="text-[#8E8E93] text-sm">{userEmail}</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl p-4">
            <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">👥 {lang === 'zh' ? '共享账号' : 'Share Account'}</p>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
              {lang === 'zh' ? '将以下账号信息分享给同事，他们可以直接登录使用相同的数据。' : 'Share the login below with your colleague to access the same data.'}
            </p>
            <div className="mt-3 bg-white dark:bg-[#2C2C2E] rounded-xl p-3 border border-blue-100 dark:border-[#3A3A3C]">
              <p className="text-xs text-[#8E8E93]">{lang === 'zh' ? '登录邮箱' : 'Login Email'}</p>
              <p className="text-gray-900 dark:text-[#F2F2F7] font-medium text-sm mt-0.5">{userEmail}</p>
            </div>
            <p className="text-blue-500 dark:text-blue-400 text-xs mt-2">⚠️ {lang === 'zh' ? '请仅与信任的人分享登录信息' : 'Only share with people you trust'}</p>
          </div>
          <button onClick={handleSignOut} className="w-full py-2.5 rounded-xl text-sm font-medium bg-red-50 dark:bg-[#FF453A]/20 text-red-600 dark:text-[#FF453A] hover:bg-red-100 dark:hover:bg-[#FF453A]/30 transition-colors">
            {lang === 'zh' ? '退出登录' : 'Sign Out'}
          </button>
        </div>

        {/* Company Profile */}
        <div className={cardCls}>
          <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '公司资料' : 'Company Profile'}</h2>
          <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '这些信息将自动填入发票' : 'This info will auto-fill your invoices'}</p>

          <div><label className={labelCls}>{lang === 'zh' ? '公司名称 *' : 'Company Name *'}</label><input className={inputCls} placeholder="e.g. Smith Plumbing Pty Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
          <div><label className={labelCls}>ABN</label><input className={inputCls} placeholder="e.g. 12 345 678 901" value={abn} onChange={e => setAbn(e.target.value)} /></div>
          <div><label className={labelCls}>{lang === 'zh' ? '电话' : 'Phone'}</label><input className={inputCls} placeholder="0400 000 000" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} /></div>
          <div><label className={labelCls}>{lang === 'zh' ? '邮箱' : 'Email'}</label><input className={inputCls} placeholder="info@company.com.au" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} /></div>
          <div><label className={labelCls}>{lang === 'zh' ? '地址' : 'Address'}</label><input className={inputCls} placeholder="123 Main St, Brisbane QLD 4000" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} /></div>

          <div className="pt-2 border-t border-gray-100 dark:border-[#3A3A3C]">
            <p className="text-[#8E8E93] text-xs font-medium mb-3">{lang === 'zh' ? '银行账户' : 'Bank Details'}</p>
            <div className="space-y-3">
              <div><label className={labelCls}>{lang === 'zh' ? '银行名称' : 'Bank Name'}</label><input className={inputCls} placeholder="e.g. Commonwealth Bank" value={bankName} onChange={e => setBankName(e.target.value)} /></div>
              <div><label className={labelCls}>Account Name</label><input className={inputCls} placeholder="e.g. SMITH PLUMBING PTY LTD" value={accountName} onChange={e => setAccountName(e.target.value)} /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className={labelCls}>BSB</label><input className={inputCls} placeholder="062-000" value={bsb} onChange={e => setBsb(e.target.value)} /></div>
                <div className="flex-1"><label className={labelCls}>Account No</label><input className={inputCls} placeholder="12345678" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} /></div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-[#3A3A3C]">
            <p className="text-[#8E8E93] text-xs font-medium mb-3">{lang === 'zh' ? '通知设置' : 'Notifications'}</p>
            <button onClick={async () => {
              if (!('Notification' in window)) { alert(lang === 'zh' ? '您的浏览器不支持通知' : 'Browser does not support notifications'); return }
              const permission = await Notification.requestPermission()
              if (permission === 'granted') {
                const reg = await navigator.serviceWorker.ready
                const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY })
                await fetch('/api/push-subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub }) })
                alert(lang === 'zh' ? '推送通知已开启！' : 'Push notifications enabled!')
              }
            }} className="w-full border border-blue-200 dark:border-blue-700/40 text-blue-600 dark:text-[#0A84FF] py-2.5 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-[#0A84FF]/10 transition-colors">
              🔔 {lang === 'zh' ? '开启发票到期提醒' : 'Enable Invoice Due Reminders'}
            </button>
          </div>

          {saved && <p className="text-[#30D158] text-sm font-medium">✅ {lang === 'zh' ? '已保存！' : 'Saved!'}</p>}

          <button onClick={handleSave} disabled={loading || !companyName} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50 transition-colors">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存设置' : 'Save Settings')}
          </button>
        </div>
      </main>
    </div>
  )
}
