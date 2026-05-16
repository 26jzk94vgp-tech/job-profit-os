'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import { useLanguage } from '../../../../lib/i18n/LanguageContext'

export default function EditJob({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setName(data.name || '')
        setClientName(data.client_name || '')
      }
    })
  }, [id])

  async function handleSave() {
    if (!name) return
    setLoading(true)
    const { error } = await supabase.from('jobs').update({
      name,
      client_name: clientName
    }).eq('id', id)
    if (error) { alert('Error: ' + error.message) } else {
      window.location.href = '/jobs/' + id
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href={"/jobs/" + id} className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</a>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '编辑工程' : 'Edit Job'}</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="md:hidden mb-6 flex items-center gap-3">
          <a href={"/jobs/" + id} className="text-gray-500 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</a>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '编辑工程' : 'Edit Job'}</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '工程名称 *' : 'Job Name *'}</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitchen Renovation" />
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '客户名称' : 'Client Name'}</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. John Smith" />
          </div>
          <button onClick={handleSave} disabled={loading || !name} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存' : 'Save')}
          </button>
        </div>
      </main>
    </div>
  )
}