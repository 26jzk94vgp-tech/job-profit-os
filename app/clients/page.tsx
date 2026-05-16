'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Clients() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    supabase.from('clients').select('*').order('created_at', { ascending: false }).then(({ data }) => setClients(data || []))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '客户' : 'Clients'}</h1>
          </div>
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ {lang === 'zh' ? '新建客户' : 'New Client'}</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '客户' : 'Clients'}</h1>
          </div>
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ {lang === 'zh' ? '新建' : 'New'}</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200">
          {!clients.length && <div className="px-6 py-16 text-center text-gray-400">{lang === 'zh' ? '还没有客户' : 'No clients yet.'}</div>}
          <div className="divide-y divide-gray-100">
            {clients.map((client) => (
              <div key={client.id} className="px-6 py-4">
                <p className="font-medium text-gray-900">{client.name}</p>
                <p className="text-gray-500 text-sm">{client.phone} {client.email}</p>
                <p className="text-gray-400 text-sm">{client.address}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}