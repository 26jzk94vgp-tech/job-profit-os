'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function NewClient() {
  const router = useRouter()
  const supabase = createClient()
  const { lang } = useLanguage()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('clients').insert({ name, phone, email, address, owner_id: user?.id })
    if (error) { alert('Error: ' + error.message) } else { router.push('/clients') }
    setLoading(false)
  }

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40 transition"
  const labelCls = "text-sm font-medium text-gray-700 dark:text-gray-300"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">
            ← {lang === 'zh' ? '返回' : 'Back'}
          </button>
          <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '新建客户' : 'New Client'}</h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className="md:hidden flex items-center gap-2 mb-2">
          <button onClick={() => router.back()} className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</button>
          <span className="text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '新建客户' : 'New Client'}</h1>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
          <div>
            <label className={labelCls}>{lang === 'zh' ? '客户名称' : 'Client Name'} *</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Smith" />
          </div>
          <div>
            <label className={labelCls}>{lang === 'zh' ? '电话' : 'Phone'}</label>
            <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0412 345 678" />
          </div>
          <div>
            <label className={labelCls}>{lang === 'zh' ? '邮箱' : 'Email'}</label>
            <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. john@email.com" />
          </div>
          <div>
            <label className={labelCls}>{lang === 'zh' ? '地址' : 'Address'}</label>
            <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 123 Main St, Perth WA" />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !name}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50 transition-colors"
        >
          {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存客户' : 'Save Client')}
        </button>
      </main>
    </div>
  )
}
