cat > /Users/shux/Desktop/job-profit-os/app/onboarding/page.tsx << 'EOF'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function Onboarding() {
  const supabase = createClient()
  const [companyName, setCompanyName] = useState('')
  const [abn, setAbn] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [bsb, setBsb] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase.from('profiles').select('company_name').eq('id', user.id).single()
      if (data?.company_name) { window.location.href = '/' }
    }
    check()
  }, [])

  async function handleSave() {
    if (!companyName.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 60)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      company_name: companyName.trim(),
      abn: abn || null,
      company_phone: companyPhone || null,
      company_email: companyEmail || null,
      company_address: companyAddress || null,
      bank_name: bankName || null,
      account_name: accountName || null,
      bsb: bsb || null,
      account_number: accountNumber || null,
      trial_ends_at: trialEndsAt.toISOString(),
      plan_type: 'trial',
      updated_at: new Date().toISOString()
    })
    if (error) { alert('Error: ' + error.message); setLoading(false); return }
    window.location.href = '/'
  }

  const inputCls = "w-full border border-[#3A3A3C] rounded-xl p-3 mt-1 text-white bg-[#2C2C2E] outline-none focus:ring-2 focus:ring-[#0A84FF]/50 transition placeholder-[#636366]"
  const labelCls = "text-[#8E8E93] text-sm"

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">JP</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Job Profit OS</h1>
          <p className="text-[#8E8E93] text-sm mt-1">Set up your company — takes 1 minute</p>
          <div className="mt-3 inline-block bg-[#30D158]/20 border border-[#30D158]/40 rounded-full px-3 py-1">
            <p className="text-[#30D158] text-xs font-semibold">🎉 60-day free trial — all features unlocked</p>
          </div>
        </div>
        <div className="flex gap-2 mb-6">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#0A84FF]' : 'bg-[#3A3A3C]'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#0A84FF]' : 'bg-[#3A3A3C]'}`} />
        </div>
        <div className="bg-[#1C1C1E] rounded-2xl border border-[#3A3A3C] p-6 space-y-4">
          {step === 1 && (
            <>
              <h2 className="font-semibold text-white">Company Info</h2>
              <div><label className={labelCls}>Company Name *</label><input className={inputCls} placeholder="e.g. Smith Plumbing Pty Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)} autoFocus /></div>
              <div><label className={labelCls}>ABN</label><input className={inputCls} placeholder="e.g. 12 345 678 901" value={abn} onChange={e => setAbn(e.target.value)} /></div>
              <div><label className={labelCls}>Phone</label><input className={inputCls} placeholder="0400 000 000" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} /></div>
              <div><label className={labelCls}>Email</label><input className={inputCls} placeholder="info@company.com.au" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} /></div>
              <div><label className={labelCls}>Address</label><input className={inputCls} placeholder="123 Main St, Brisbane QLD 4000" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} /></div>
              <button onClick={() => companyName.trim() && setStep(2)} disabled={!companyName.trim()} className="w-full bg-[#0A84FF] hover:bg-blue-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-40 transition-colors mt-2">Next →</button>
              <button onClick={handleSave} disabled={loading || !companyName.trim()} className="w-full text-[#8E8E93] text-sm py-2 disabled:opacity-40">{loading ? 'Setting up...' : 'Skip bank details for now'}</button>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="font-semibold text-white">Bank Details <span className="text-[#8E8E93] font-normal text-sm">(for invoices)</span></h2>
              <div><label className={labelCls}>Bank Name</label><input className={inputCls} placeholder="e.g. Commonwealth Bank" value={bankName} onChange={e => setBankName(e.target.value)} /></div>
              <div><label className={labelCls}>Account Name</label><input className={inputCls} placeholder="e.g. SMITH PLUMBING PTY LTD" value={accountName} onChange={e => setAccountName(e.target.value)} /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className={labelCls}>BSB</label><input className={inputCls} placeholder="062-000" value={bsb} onChange={e => setBsb(e.target.value)} /></div>
                <div className="flex-1"><label className={labelCls}>Account No</label><input className={inputCls} placeholder="12345678" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} /></div>
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full bg-[#30D158] hover:bg-green-400 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50 transition-colors mt-2">{loading ? 'Setting up...' : "🚀 Let's go!"}</button>
              <button onClick={() => setStep(1)} disabled={loading} className="w-full text-[#8E8E93] text-sm py-2">← Back</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
EOF
