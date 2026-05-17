'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../utils/supabase/client'
import Link from 'next/link'
import JobStatusToggle from './JobStatusToggle'
import DeleteEntry from './DeleteEntry'
import { useLanguage } from '../../../lib/i18n/LanguageContext'
import { formatDate } from '../../../lib/utils'

export default function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [job, setJob] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    supabase.from('job_summary').select('*').eq('id', id).single().then(({ data }) => setJob(data))
    supabase.from('job_entries').select('*').eq('job_id', id).order('created_at', { ascending: false }).then(({ data }) => setEntries(data || []))
  }, [id])

  if (!job) return <div className="p-6">Loading...</div>

  const revenue = Number(job.revenue)
  const labor = Number(job.labor_cost)
  const fuel = Number(job.fuel_cost || 0)
  const material = Number(job.material_cost)
  const subcontract = Number(job.subcontract_cost)
  const profit = Number(job.profit)
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

  async function updatePaymentStatus(entryId: string, status: string, received?: number) {
    const update: Record<string, unknown> = { payment_status: status }
    if (received !== undefined) update.payment_received = received
    await supabase.from('job_entries').update(update).eq('id', entryId)
    setEntries((prev: any[]) => prev.map((e: any) => e.id === entryId ? { ...e, payment_status: status, payment_received: received ?? e.payment_received } : e))
  }

  const unpaidInvoices = entries.filter((e: any) => e.type === 'invoice' && e.payment_status !== 'paid')
  const unpaidTotal = unpaidInvoices.reduce((sum: number, e: any) => sum + Number(e.amount), 0)

  const typeLabel = (type: string) => {
    if (lang !== 'zh') return type
    const labels: Record<string, string> = { invoice: '发票', labor: '人工', material: '材料', subcontract: '分包', fuel: '油费' }
    return labels[type] || type
  }

  const statusLabel = (status: string) => {
    if (lang !== 'zh') {
      const enLabels: Record<string, string> = { paid: 'Paid', unpaid: 'Unpaid', overdue: 'Overdue', partial: 'Partial' }
      return enLabels[status] || status
    }
    const labels: Record<string, string> = { paid: '已付', unpaid: '未付', overdue: '逾期', partial: '部分付款' }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900">{job.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={'/jobs/' + id + '/invoice'} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">🧾 {lang === 'zh' ? '发票' : 'Invoice'}</Link>
            <Link href={'/jobs/' + id + '/edit'} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">✏️ {lang === 'zh' ? '编辑' : 'Edit'}</Link>

            <Link href={'/jobs/' + id + '/add'} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">+ {lang === 'zh' ? '添加条目' : 'Add Entry'}</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="md:hidden flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-gray-500 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900">{job.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={'/jobs/' + id + '/invoice'} className="bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg text-xs">🧾</Link>
            <Link href={'/jobs/' + id + '/edit'} className="bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg text-xs">✏️</Link>

            <Link href={'/jobs/' + id + '/add'} className="bg-blue-600 text-white px-2 py-1.5 rounded-lg text-xs">+</Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-500">{job.client_name}</p>
          <JobStatusToggle jobId={id} currentStatus={job.status} />
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{lang === 'zh' ? '概览' : 'Overview'}</button>
          <button onClick={() => setActiveTab('entries')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'entries' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{lang === 'zh' ? '条目' : 'Entries'}</button>
          <button onClick={() => setActiveTab('invoice')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'invoice' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{lang === 'zh' ? '发票' : 'Invoice'}</button>
        </div>

        {activeTab === 'overview' && (<>
        {unpaidTotal > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="font-medium text-yellow-800">💰 {lang === 'zh' ? '未收款项' : 'Outstanding Payments'}</p>
              <p className="text-yellow-600 text-sm">{unpaidInvoices.length} {lang === 'zh' ? '张未付发票' : 'unpaid invoice(s)'}</p>
            </div>
            <span className="font-bold text-yellow-800">${unpaidTotal.toLocaleString()}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">{lang === 'zh' ? '收入' : 'Revenue'}</p>
            <p className="text-2xl font-bold text-green-600 mt-1">${revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">{lang === 'zh' ? '利润' : 'Profit'}</p>
            <p className={profit >= 0 ? 'text-2xl font-bold text-green-600 mt-1' : 'text-2xl font-bold text-red-600 mt-1'}>${profit.toLocaleString()} ({margin}%)</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '成本明细' : 'Cost Breakdown'}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-3 flex justify-between"><span className="text-gray-600">{lang === 'zh' ? '人工' : 'Labor'}</span><span className="text-red-500">${labor.toLocaleString()}</span></div>
            <div className="px-6 py-3 flex justify-between"><span className="text-gray-600">{lang === 'zh' ? '材料' : 'Materials'}</span><span className="text-red-500">${material.toLocaleString()}</span></div>
            <div className="px-6 py-3 flex justify-between"><span className="text-gray-600">{lang === 'zh' ? '分包' : 'Subcontract'}</span><span className="text-red-500">${subcontract.toLocaleString()}</span></div>
            {fuel > 0 && <div className="px-6 py-3 flex justify-between"><span className="text-gray-600">{lang === 'zh' ? '车辆/油费' : 'Vehicle/Fuel'}</span><span className="text-red-500">${fuel.toLocaleString()}</span></div>}
          </div>
        </div>

        </>)}

        {activeTab === 'entries' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '条目' : 'Entries'}</h2>
          </div>
          {!entries.length && <div className="px-6 py-8 text-center text-gray-400">{lang === 'zh' ? '还没有条目。' : 'No entries yet.'}</div>}
          <div className="divide-y divide-gray-100">
            {entries.map((entry: any) => (
              <div key={entry.id} className="px-6 py-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase">{typeLabel(entry.type)}</span>
                    {entry.type === 'invoice' && (
                      <span className={
                        entry.payment_status === 'paid' ? 'text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full' :
                        entry.payment_status === 'overdue' ? 'text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full' :
                        entry.payment_status === 'partial' ? 'text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full' :
                        'text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full'
                      }>{statusLabel(entry.payment_status || 'unpaid')}</span>
                    )}
                  </div>
                  <p className="text-gray-900 mt-1">{entry.description || entry.worker_name || entry.type}</p>
                  {entry.type === 'fuel' && entry.trip_from && <p className="text-gray-400 text-xs">{entry.trip_from} → {entry.trip_to} {entry.kilometers && entry.kilometers + 'km'}</p>}
                  {entry.type === 'invoice' && entry.payment_due_date && <p className="text-gray-400 text-xs">{lang === 'zh' ? '到期' : 'Due'}: {formatDate(entry.payment_due_date)}</p>}
                  {entry.type === 'invoice' && entry.payment_status !== 'paid' && (
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => updatePaymentStatus(entry.id, 'paid')} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-200">✓ {lang === 'zh' ? '标记已付' : 'Mark Paid'}</button>
                      <button onClick={() => { const amt = prompt(lang === 'zh' ? '输入已收金额：' : 'Enter amount received:'); if (amt) updatePaymentStatus(entry.id, 'partial', Number(amt)) }} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200">{lang === 'zh' ? '部分付款' : 'Partial'}</button>
                    </div>
                  )}
                  {entry.type === 'invoice' && entry.payment_status === 'partial' && entry.payment_received > 0 && (
                    <p className="text-blue-500 text-xs">{lang === 'zh' ? '已收' : 'Received'}: ${Number(entry.payment_received).toLocaleString()} · {lang === 'zh' ? '未收' : 'Outstanding'}: ${(Number(entry.amount) - Number(entry.payment_received)).toLocaleString()}</p>
                  )}
                  <p className="text-gray-400 text-sm">{formatDate(entry.entry_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={entry.type === 'invoice' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {entry.type === 'invoice' ? '+' : '-'}${entry.type === 'labor' ? (Number(entry.hours) * Number(entry.hourly_rate)).toLocaleString() : Number(entry.amount).toLocaleString()}
                  </span>
                  <Link href={'/jobs/' + id + '/entry/' + entry.id + '/edit'} className="text-blue-500 text-sm hover:text-blue-700">{lang === 'zh' ? '编辑' : 'Edit'}</Link>
                  <DeleteEntry entryId={entry.id} jobId={id} />
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {activeTab === 'invoice' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '发票条目' : 'Invoice Entries'}</h2>
          </div>
          {entries.filter((e: any) => e.type === 'invoice').length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">
              <p>{lang === 'zh' ? '还没有发票条目' : 'No invoice entries yet.'}</p>
              <Link href={'/jobs/' + id + '/add'} className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ {lang === 'zh' ? '添加发票' : 'Add Invoice'}</Link>
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {entries.filter((e: any) => e.type === 'invoice').map((entry: any) => (
              <div key={entry.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{entry.description || (lang === 'zh' ? '发票' : 'Invoice')}</p>
                    {entry.payment_due_date && <p className="text-gray-400 text-xs">{lang === 'zh' ? '到期' : 'Due'}: {formatDate(entry.payment_due_date)}</p>}
                    <span className={
                      entry.payment_status === 'paid' ? 'text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full' :
                      entry.payment_status === 'partial' ? 'text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full' :
                      'text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full'
                    }>{statusLabel(entry.payment_status || 'unpaid')}</span>
                  </div>
                  <span className="text-green-600 font-bold">\${Number(entry.amount).toLocaleString()}</span>
                </div>
                {entry.payment_status !== 'paid' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => updatePaymentStatus(entry.id, 'paid')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">✓ {lang === 'zh' ? '标记已付' : 'Mark Paid'}</button>
                    <button onClick={() => { const amt = prompt(lang === 'zh' ? '输入已收金额：' : 'Enter amount received:'); if (amt) updatePaymentStatus(entry.id, 'partial', Number(amt)) }} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">{lang === 'zh' ? '部分付款' : 'Partial'}</button>
                  </div>
                )}
                {entry.payment_status === 'partial' && entry.payment_received > 0 && (
                  <p className="text-blue-500 text-xs mt-1">{lang === 'zh' ? '已收' : 'Received'}: \${Number(entry.payment_received).toLocaleString()} · {lang === 'zh' ? '未收' : 'Outstanding'}: \${(Number(entry.amount) - Number(entry.payment_received)).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        )}
      </main>
    </div>
  )
}