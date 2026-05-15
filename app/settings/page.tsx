'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'

export default function Settings() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [abn, setAbn] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setCompanyName(data.company_name || '')
        setCompanyEmail(data.company_email || '')
        setCompanyPhone(data.company_phone || '')
        setCompanyAddress(data.company_address || '')
        setAbn(data.abn || '')
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
      updated_at: new Date().toISOString()
    })
    if (error) { alert('Error: ' + error.message) } else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setLoading(false)
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          <h1 className="font-semibold text-gray-900">公司设置 / Company Settings</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">公司资料 / Company Profile</h2>
          <p className="text-gray-400 text-xs">这些信息将自动填入发票 / This info will auto-fill your invoices</p>

          <div>
            <label className="text-gray-700 text-sm font-medium">公司名称 / Company Name *</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Smith Plumbing Pty Ltd" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium">ABN</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 12 345 678 901" value={abn} onChange={(e) => setAbn(e.target.value)} />
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium">电话 / Phone</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 0400 000 000" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium">邮箱 / Email</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. info@smithplumbing.com.au" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium">地址 / Address</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 123 Main St, Brisbane QLD 4000" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
          </div>

          {saved && <p className="text-green-600 text-sm font-medium">✅ 已保存 / Saved!</p>}

          <button onClick={handleSave} disabled={loading || !companyName} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? '保存中...' : '保存设置 / Save Settings'}
          </button>
        </div>
      </main>
    </div>
  )
}