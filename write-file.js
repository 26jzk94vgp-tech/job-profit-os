const fs = require('fs')
const content = `'use client'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</button>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '新建客户' : 'New Client'}</h1>
        </div>
      </nav>
      <div className="md:hidden flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-200">
        <button onClick={() => router.back()} className="text-gray-500 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</button>
        <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '新建客户' : 'New Client'}</h1>
      </div>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '姓名 *' : 'Name *'}</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Smith" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '电话' : 'Phone'}</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0400 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '邮箱' : 'Email'}</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '地址' : 'Address'}</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="123 Main St, Sydney" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <button onClick={handleSubmit} disabled={loading || !name} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存客户' : 'Save Client')}
          </button>
        </div>
      </main>
    </div>
  )
}`

fs.writeFileSync('app/clients/new/page.tsx', content)
console.log('done')
