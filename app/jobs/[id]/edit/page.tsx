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
  const [notes, setNotes] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  async function fetchSuggestions(query: string) {
    if (query.length < 3) { setSuggestions([]); return }
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`)
    const data = await res.json()
    setSuggestions(data)
    setShowSuggestions(true)
  }
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setName(data.name || '')
        setClientName(data.client_name || '')
        setNotes(data.notes || '')
        setSiteAddress(data.site_address || '')
      }
    })
  }, [id])

  async function handleSave() {
    if (!name) return
    setLoading(true)
    const { error } = await supabase.from('jobs').update({
      name,
      client_name: clientName,
      notes: notes || null,
      site_address: siteAddress || null
    }).eq('id', id)
    if (error) { alert('Error: ' + error.message) } else {
      window.location.href = '/jobs/' + id
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1C1C1E]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href={"/jobs/" + id} className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</a>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '编辑工单' : 'Edit Job'}</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="md:hidden mb-6 flex items-center gap-3">
          <a href={"/jobs/" + id} className="text-gray-500 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</a>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '编辑工单' : 'Edit Job'}</h1>
        </div>
        <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '工单名称 *' : 'Job Name *'}</label>
            <input className="w-full border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-3 mt-1 text-gray-900 dark:text-[#F2F2F7] dark:bg-[#3A3A3C] outline-none focus:ring-2 focus:ring-blue-500" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitchen Renovation" />
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '客户名称' : 'Client Name'}</label>
            <input className="w-full border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-3 mt-1 text-gray-900 dark:text-[#F2F2F7] dark:bg-[#3A3A3C] outline-none focus:ring-2 focus:ring-blue-500" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. John Smith" />
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '工地地址' : 'Site Address'}</label>
            <div className="relative">
              <input
                className="w-full border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-3 mt-1 text-gray-900 dark:text-[#F2F2F7] dark:bg-[#3A3A3C] outline-none focus:ring-2 focus:ring-blue-500"
                value={siteAddress}
                onChange={(e) => { setSiteAddress(e.target.value); fetchSuggestions(e.target.value) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="e.g. 123 Murray St, Perth WA 6000"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button"
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#F2F2F7] hover:bg-gray-50 dark:hover:bg-[#3A3A3C] border-b border-gray-100 dark:border-[#3A3A3C]"
                      onClick={() => { setSiteAddress(s.display_name); setShowSuggestions(false) }}>
                      📍 {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '备注' : 'Notes'}</label>
            <textarea className="w-full border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-3 mt-1 text-gray-900 dark:text-[#F2F2F7] dark:bg-[#3A3A3C] outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder={lang === 'zh' ? '例如：工程地址、特殊要求等' : 'e.g. Site address, special requirements...'} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button onClick={handleSave} disabled={loading || !name} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存' : 'Save')}
          </button>
        </div>
      </main>
    </div>
  )
}