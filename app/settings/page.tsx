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
      }
    }
    loadProfile()
  }, [])

  async function handleSave() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      company_name: companyName,
      company_email: companyEmail,
      company_phone: companyPhone,
      company_address: companyAddress,
      abn,
      bank_name: bankName,
      bsb,
      account_number: accountNumber,
      account_name: accountName,
      updated_at: new Date().toISOString()
    })
    if (error) { alert('Error: ' + error.message) } else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '设置' : 'Settings'}</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="md:hidden flex items-center justify-between">
          <Link href="/" className="text-gray-500 text-sm">← {lang === 'zh' ? '返回首页' : 'Back to Home'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '设置' : 'Settings'}</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '语言设置 / Language' : 'Language'}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setLang('en')}
              className={lang === 'en' ? 'flex-1 py-3 rounded-lg font-medium bg-blue-600 text-white' : 'flex-1 py-3 rounded-lg font-medium bg-gray-100 text-gray-600'}
            >
              🇦🇺 English
            </button>
            <button
              onClick={() => setLang('zh')}
              className={lang === 'zh' ? 'flex-1 py-3 rounded-lg font-medium bg-blue-600 text-white' : 'flex-1 py-3 rounded-lg font-medium bg-gray-100 text-gray-600'}
            >
              🇨🇳 中文
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '账户信息 / Account' : 'Account'}</h2>
          <p className="text-gray-500 text-sm">{userEmail}</p>
          <button onClick={handleSignOut} className="w-full py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100">
            {lang === 'zh' ? '退出登录 / Sign Out' : 'Sign Out'}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '公司资料 / Company Profile' : 'Company Profile'}</h2>
          <p className="text-gray-400 text-xs">{lang === 'zh' ? '这些信息将自动填入发票' : 'This info will auto-fill your invoices'}</p>

          <div><label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '公司名称 *' : 'Company Name *'}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Smith Plumbing Pty Ltd" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>

          <div><label className="text-gray-700 text-sm font-medium">ABN</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 12 345 678 901" value={abn} onChange={(e) => setAbn(e.target.value)} /></div>

          <div><label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '电话' : 'Phone'}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0400 000 000" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} /></div>

          <div><label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '邮箱' : 'Email'}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="info@company.com.au" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} /></div>

          <div><label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '地址' : 'Address'}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="123 Main St, Brisbane QLD 4000" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} /></div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-gray-500 text-xs font-medium mb-3">{lang === 'zh' ? '银行账户 / Bank Details' : 'Bank Details'}</p>
            <div className="space-y-3">
              <div><label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '银行名称' : 'Bank Name'}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Commonwealth Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">Account Name</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. SMITH PLUMBING PTY LTD" value={accountName} onChange={(e) => setAccountName(e.target.value)} /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-gray-700 text-sm font-medium">BSB</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 062-000" value={bsb} onChange={(e) => setBsb(e.target.value)} /></div>
                <div className="flex-1"><label className="text-gray-700 text-sm font-medium">Account No</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 12345678" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></div>
              </div>
            </div>
          </div>

          {saved && <p className="text-green-600 text-sm font-medium">✅ {lang === 'zh' ? '已保存！' : 'Saved!'}</p>}

          <button onClick={handleSave} disabled={loading || !companyName} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存设置' : 'Save Settings')}
          </button>
        </div>

      </main>
    </div>
  )
}