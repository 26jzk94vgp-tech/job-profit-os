'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { createClient } from '../../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [client, setClient] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setClient(data)
        setName(data.name || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setAddress(data.address || '')
      }
    })
    supabase.from('job_summary').select('*').eq('client_id', id).order('created_at', { ascending: false }).then(({ data }) => setJobs(data || []))
    supabase.from('quotes').select('*').eq('client_id', id).order('created_at', { ascending: false }).then(({ data }) => setQuotes(data || []))
  }, [id])

  async function handleSave() {
    setSaving(true)
    await supabase.from('clients').update({ name, phone, email, address }).eq('id', id)
    setClient((c: any) => ({ ...c, name, phone, email, address }))
    setEditing(false)
    setSaving(false)
  }

  if (!client) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-[#8E8E93] text-sm">Loading...</div>
    </div>
  )

  const totalRevenue = jobs.reduce((sum, j) => sum + Number(j.revenue), 0)
  const totalProfit = jobs.reduce((sum, j) => sum + Number(j.profit), 0)
  const unpaid = jobs.reduce((sum, j) => sum + Number(j.unpaid_amount || 0), 0)

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 text-gray-900 dark:text-[#F2F2F7] bg-white dark:bg-[#3A3A3C] outline-none focus:ring-2 focus:ring-blue-500/40 transition text-sm"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/clients" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">
              ← {lang === 'zh' ? '客户' : 'Clients'}
            </Link>
            <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
            <h1 className="font-semibold text-gray-900 dark:text-white">{client.name}</h1>
          </div>
          <button onClick={() => setEditing(!editing)} className="text-[#0A84FF] text-sm font-medium">
            {editing ? (lang === 'zh' ? '取消' : 'Cancel') : (lang === 'zh' ? '编辑' : 'Edit')}
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-16 pb-8 md:pt-8 space-y-5">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link href="/clients" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '客户' : 'Clients'}</Link>
          </div>
          <button onClick={() => setEditing(!editing)} className="text-[#0A84FF] text-sm font-medium">
            {editing ? (lang === 'zh' ? '取消' : 'Cancel') : (lang === 'zh' ? '编辑' : 'Edit')}
          </button>
        </div>

        {/* Client info card */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#8E8E93] uppercase tracking-wide">{lang === 'zh' ? '姓名' : 'Name'}</label>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8E8E93] uppercase tracking-wide">{lang === 'zh' ? '电话' : 'Phone'}</label>
                <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="0400 000 000" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8E8E93] uppercase tracking-wide">{lang === 'zh' ? '邮箱' : 'Email'}</label>
                <input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="client@email.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8E8E93] uppercase tracking-wide">{lang === 'zh' ? '地址' : 'Address'}</label>
                <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-semibold disabled:opacity-50 transition-colors">
                {saving ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存' : 'Save')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{client.name}</h2>
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">📞</span>
                  <span className="text-[#0A84FF]">{client.phone}</span>
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">✉️</span>
                  <span className="text-[#0A84FF]">{client.email}</span>
                </a>
              )}
              {client.address && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-lg">📍</span>
                  <span className="text-gray-600 dark:text-[#8E8E93]">{client.address}</span>
                </div>
              )}
              {!client.phone && !client.email && !client.address && (
                <p className="text-[#8E8E93] text-sm">{lang === 'zh' ? '点击编辑添加联系方式' : 'Tap Edit to add contact details'}</p>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4 text-center">
            <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wide mb-1">{lang === 'zh' ? '总收入' : 'Revenue'}</p>
            <p className={`text-lg font-bold ${totalRevenue > 0 ? 'text-[#30D158]' : 'text-[#8E8E93]'}`}>${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4 text-center">
            <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wide mb-1">{lang === 'zh' ? '总利润' : 'Profit'}</p>
            <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>${totalProfit.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4 text-center">
            <p className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wide mb-1">{lang === 'zh' ? '未收款' : 'Unpaid'}</p>
            <p className={`text-lg font-bold ${unpaid > 0 ? 'text-[#FF9F0A]' : 'text-[#8E8E93]'}`}>${unpaid.toLocaleString()}</p>
          </div>
        </div>

        {/* Jobs */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C] flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '工单历史' : 'Jobs'}</h3>
            <span className="text-[#8E8E93] text-sm">{jobs.length}</span>
          </div>
          {jobs.length === 0 ? (
            <div className="px-6 py-8 text-center text-[#8E8E93] text-sm">{lang === 'zh' ? '暂无工单' : 'No jobs yet'}</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {jobs.map(job => (
                <Link href={'/jobs/' + job.id} key={job.id} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-[#F2F2F7] text-sm">{job.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      job.status === 'active' ? 'bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF]' :
                      job.status === 'completed' ? 'bg-green-100 dark:bg-[#30D158]/20 text-green-600 dark:text-[#30D158]' :
                      'bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-[#8E8E93]'
                    }`}>
                      {job.status === 'active' ? (lang === 'zh' ? '进行中' : 'Active') :
                       job.status === 'completed' ? (lang === 'zh' ? '已完成' : 'Completed') :
                       (lang === 'zh' ? '暂停' : 'Paused')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#30D158]">${Number(job.revenue).toLocaleString()}</p>
                    <p className={`text-xs ${Number(job.profit) >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
                      {lang === 'zh' ? '利润' : 'Profit'} ${Number(job.profit).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quotes */}
        {quotes.length > 0 && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C] flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '报价单' : 'Quotes'}</h3>
              <span className="text-[#8E8E93] text-sm">{quotes.length}</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {quotes.map((q: any) => (
                <Link href={'/quotes/' + q.id} key={q.id} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-[#F2F2F7] text-sm">
                      {lang === 'zh' ? '报价单' : 'Quote'} #{q.quote_number || q.id.slice(0, 6).toUpperCase()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      q.status === 'accepted' ? 'bg-green-100 dark:bg-[#30D158]/20 text-green-600 dark:text-[#30D158]' :
                      q.status === 'sent' ? 'bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF]' :
                      'bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-[#8E8E93]'
                    }`}>
                      {q.status === 'accepted' ? (lang === 'zh' ? '已成交' : 'Won') :
                       q.status === 'sent' ? (lang === 'zh' ? '已发送' : 'Sent') :
                       (lang === 'zh' ? '草稿' : 'Draft')}
                    </span>
                  </div>
                  <span className="text-[#8E8E93] text-sm">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* New job shortcut */}
        <Link href={`/jobs/new?client_id=${id}&client_name=${encodeURIComponent(client.name)}`} className="block bg-blue-600 hover:bg-blue-500 text-white text-center py-4 rounded-2xl font-semibold transition-colors">
          + {lang === 'zh' ? '为此客户新建工单' : 'New Job for This Client'}
        </Link>
      </main>
    </div>
  )
}
