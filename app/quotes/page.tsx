'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Quotes() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [quotes, setQuotes] = useState<any[]>([])
  const [converting, setConverting] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [selectedInactive, setSelectedInactive] = useState<Set<string>>(new Set())

  async function loadQuotes() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('quotes')
      .select('*, quote_items(*)')
      .eq('owner_id', user?.id)
      .order('created_at', { ascending: false })
    setQuotes(data || [])
  }

  useEffect(() => { loadQuotes() }, [])

  async function handleWon(quote: any) {
    if (!confirm(lang === 'zh' ? '确认成交？将自动创建客户和工单。' : 'Confirm won? This will create a client and job automatically.')) return
    setConverting(quote.id)
    const { data: { user } } = await supabase.auth.getUser()
    try {
      const { data: freshQuote } = await supabase.from('quotes').select('*').eq('id', quote.id).single()
      if (freshQuote?.status === 'accepted' && freshQuote?.job_id) {
        window.location.href = '/jobs/' + freshQuote.job_id
        return
      }
      let clientId = quote.client_id
      if (!clientId && quote.client_name) {
        const { data: existing } = await supabase.from('clients').select('id').eq('name', quote.client_name).eq('owner_id', user?.id).single()
        if (existing) { clientId = existing.id } else {
          const { data: newClient } = await supabase.from('clients').insert({ name: quote.client_name, owner_id: user?.id }).select().single()
          clientId = newClient?.id
        }
      }
      let jobId = freshQuote?.job_id || quote.job_id || null
      if (!jobId) {
      const jobName = quote.client_name
        ? (lang === 'zh' ? `${quote.client_name} 的工单` : `${quote.client_name}'s Job`)
        : (lang === 'zh' ? '新工单（来自报价单）' : 'New Job (from quote)')
      const { data: newJob } = await supabase.from('jobs').insert({
        name: jobName, client_name: quote.client_name || null, client_id: clientId || null,
        notes: quote.notes || null, owner_id: user?.id, status: 'active'
      }).select().single()
      if (!newJob) throw new Error('Failed to create job')
      jobId = newJob.id
      }
      const quoteItems = quote.quote_items || []
      if (quoteItems.length > 0) {
        const invoiceItems = quoteItems.map((item: any) => ({
          job_id: jobId, owner_id: user?.id, type: 'invoice',
          description: item.description + (item.area ? ' - ' + item.area : ''),
          item_group: item.item_group || null, area: item.area || null,
          quantity: Number(item.quantity) || 1, unit: item.item_unit || item.unit || null,
          unit_price: Number(item.unit_price),
          amount: Number(item.quantity) * Number(item.unit_price),
          gst_status: 'exclusive', tax_category: 'other_income', payment_status: 'unpaid'
        }))
        await supabase.from('job_entries').insert(invoiceItems)
        const materialItems = quoteItems.filter((i: any) => Number(i.cost_price) > 0).map((item: any) => ({
          job_id: jobId, owner_id: user?.id, type: 'material',
          description: item.description + (item.area ? ' - ' + item.area : ''),
          quantity: Number(item.quantity), unit: item.item_unit || item.unit || null,
          unit_price: Number(item.cost_price), amount: Number(item.quantity) * Number(item.cost_price),
          gst_status: 'inclusive', tax_category: 'cogs_material', notes: 'QUOTE_ESTIMATE'
        }))
        if (materialItems.length > 0) await supabase.from('job_entries').insert(materialItems)
      }
      await supabase.from('quotes').update({ status: 'accepted', job_id: jobId, client_id: clientId || null, deposit_status: 'pending' }).eq('id', quote.id)
      window.location.href = '/jobs/' + jobId
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setConverting(null)
  }

  async function handleLost(quote: any) {
    if (!confirm(lang === 'zh' ? '确认不成交？' : 'Mark as lost?')) return
    await supabase.from('quotes').update({ status: 'declined' }).eq('id', quote.id)
    await loadQuotes()
  }

  async function handleDelete(quoteId: string) {
    await supabase.from('quote_items').delete().eq('quote_id', quoteId)
    await supabase.from('quotes').delete().eq('id', quoteId)
    await loadQuotes()
  }

  async function handleBulkDelete() {
    if (!selectedInactive.size) return
    if (!confirm(lang === 'zh' ? `确认删除 ${selectedInactive.size} 个报价单？` : `Delete ${selectedInactive.size} quotes?`)) return
    for (const id of selectedInactive) {
      await supabase.from('quote_items').delete().eq('quote_id', id)
      await supabase.from('quotes').delete().eq('id', id)
    }
    setSelectedInactive(new Set())
    await loadQuotes()
  }

  function toggleInactiveSelect(id: string) {
    setSelectedInactive(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const isActive = (q: any) => !q.status || ['draft', 'sent', 'pending'].includes(q.status)
  const isInactive = (q: any) => ['won', 'lost', 'accepted', 'declined'].includes(q.status)
  const activeQuotes = quotes.filter(isActive)
  const inactiveQuotes = quotes.filter(isInactive)

  const statusConfig: Record<string, { label: string, labelZh: string, cls: string }> = {
    draft:    { label: 'Draft',    labelZh: '草稿',     cls: 'bg-gray-100 dark:bg-[#3A3A3C] text-[#8E8E93]' },
    sent:     { label: 'Sent',     labelZh: '已发送',   cls: 'bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF]' },
    pending:  { label: 'Pending',  labelZh: '待定',     cls: 'bg-yellow-100 dark:bg-[#FF9F0A]/20 text-yellow-600 dark:text-[#FF9F0A]' },
    won:      { label: 'Won ✓',    labelZh: '已成交 ✓', cls: 'bg-green-100 dark:bg-[#30D158]/20 text-green-600 dark:text-[#30D158]' },
    lost:     { label: 'Lost',     labelZh: '未成交',   cls: 'bg-red-100 dark:bg-[#FF453A]/20 text-red-500 dark:text-[#FF453A]' },
    accepted: { label: 'Won ✓',    labelZh: '已成交 ✓', cls: 'bg-green-100 dark:bg-[#30D158]/20 text-green-600 dark:text-[#30D158]' },
    declined: { label: 'Lost',     labelZh: '未成交',   cls: 'bg-red-100 dark:bg-[#FF453A]/20 text-red-500 dark:text-[#FF453A]' },
  }

  const QuoteCard = ({ quote, inactive = false }: { quote: any, inactive?: boolean }) => {
    const total = (quote.quote_items || []).reduce((sum: number, item: any) =>
      sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0)
    const deposit = total * 0.2
    const sc = statusConfig[quote.status] || statusConfig['draft']
    const isConverting = converting === quote.id
    const isSelected = selectedInactive.has(quote.id)
    return (
      <div className={`px-5 py-4 transition-colors ${inactive && isSelected ? 'bg-blue-50 dark:bg-[#0A84FF]/10' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          {inactive && (
            <button onClick={() => toggleInactiveSelect(quote.id)} className="mt-1 shrink-0">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-gray-300 dark:border-[#8E8E93]'}`}>
                {isSelected && <span className="text-white text-xs font-bold">✓</span>}
              </div>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{quote.client_name || (lang === 'zh' ? '未知客户' : 'Unknown Client')}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{lang === 'zh' ? sc.labelZh : sc.label}</span>
            </div>
            {quote.quote_number && <p className="text-[#8E8E93] text-xs mt-0.5">{quote.quote_number}</p>}
            {total > 0 && <p className="text-[#30D158] font-semibold mt-1">${total.toLocaleString()}</p>}
            {['won', 'accepted'].includes(quote.status) && quote.job_id && (
              <Link href={`/jobs/${quote.job_id}`} className="text-[#0A84FF] text-xs mt-1 inline-block">→ {lang === 'zh' ? '查看工单' : 'View Job'}</Link>
            )}
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <Link href={`/quotes/${quote.id}`} className="text-xs bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] px-3 py-1.5 rounded-xl text-center">{lang === 'zh' ? '查看' : 'View'}</Link>
            {!inactive && (
              <>
                <button onClick={() => handleWon(quote)} disabled={isConverting} className="text-xs bg-[#30D158]/20 text-[#30D158] px-3 py-1.5 rounded-xl font-medium disabled:opacity-50">
                  {isConverting ? '...' : (lang === 'zh' ? '✓ 成交' : '✓ Won')}
                </button>
                <button onClick={() => handleLost(quote)} className="text-xs bg-[#FF453A]/10 text-[#FF453A] px-3 py-1.5 rounded-xl font-medium">{lang === 'zh' ? '✗ 不成交' : '✗ Lost'}</button>
              </>
            )}
            {inactive && (
              <button onClick={() => handleDelete(quote.id)} className="text-xs text-[#8E8E93] px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3A3C]">{lang === 'zh' ? '删除' : 'Delete'}</button>
            )}
          </div>
        </div>
        {!inactive && total > 0 && (
          <div className="mt-3 bg-yellow-50 dark:bg-[#2C2100] border border-yellow-200 dark:border-[#FF9F0A]/20 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 dark:text-[#FF9F0A] text-xs font-medium">💰 {lang === 'zh' ? '建议收取20%预付款' : '20% Deposit Recommended'}</p>
                <p className="text-yellow-600 dark:text-[#FF9F0A]/70 text-xs mt-0.5">{lang === 'zh' ? `预付款金额：$${deposit.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `Deposit amount: $${deposit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await supabase.from('quotes').update({ deposit_status: 'received' }).eq('id', quote.id); await loadQuotes() }}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${quote.deposit_status === 'received' ? 'bg-[#30D158] text-white' : 'bg-white dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] border border-gray-200 dark:border-[#48484A]'}`}>
                  {lang === 'zh' ? '已收款' : 'Received'}
                </button>
                <button onClick={async () => { await supabase.from('quotes').update({ deposit_status: 'skipped' }).eq('id', quote.id); await loadQuotes() }}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${quote.deposit_status === 'skipped' ? 'bg-gray-400 text-white' : 'bg-white dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] border border-gray-200 dark:border-[#48484A]'}`}>
                  {lang === 'zh' ? '忽略' : 'Skip'}
                </button>
              </div>
            </div>
            {quote.deposit_status === 'received' && <p className="text-[#30D158] text-xs mt-2">✅ {lang === 'zh' ? '预付款已收取' : 'Deposit received'}</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-12 md:pt-0">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 dark:text-[#8E8E93] text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '报价单' : 'Quotes'}</h1>
          </div>
          <Link href="/quotes/new" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium">+ {lang === 'zh' ? '新建报价单' : 'New Quote'}</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="md:hidden flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '报价单' : 'Quotes'}</h1>
          </div>
          <Link href="/quotes/new" className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium">+ {lang === 'zh' ? '新建' : 'New'}</Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeQuotes.length}</p>
            <p className="text-xs text-[#8E8E93] mt-0.5">{lang === 'zh' ? '进行中' : 'Active'}</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4 text-center">
            <p className="text-2xl font-bold text-[#30D158]">{inactiveQuotes.filter(q => ['won','accepted'].includes(q.status)).length}</p>
            <p className="text-xs text-[#8E8E93] mt-0.5">{lang === 'zh' ? '已成交' : 'Won'}</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4 text-center">
            <p className="text-2xl font-bold text-[#FF453A]">{inactiveQuotes.filter(q => ['lost','declined'].includes(q.status)).length}</p>
            <p className="text-xs text-[#8E8E93] mt-0.5">{lang === 'zh' ? '未成交' : 'Lost'}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
            <p className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '进行中' : 'Active'} <span className="text-[#8E8E93] font-normal text-sm ml-1">({activeQuotes.length})</span></p>
          </div>
          {activeQuotes.length === 0 ? (
            <div className="px-6 py-10 text-center text-[#8E8E93]">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">{lang === 'zh' ? '没有进行中的报价单' : 'No active quotes'}</p>
              <Link href="/quotes/new" className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">{lang === 'zh' ? '新建报价单' : 'New Quote'}</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {activeQuotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)}
            </div>
          )}
        </div>
        {inactiveQuotes.length > 0 && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
            <button onClick={() => setShowInactive(!showInactive)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
              <p className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '已结束' : 'Inactive'} <span className="text-[#8E8E93] font-normal text-sm ml-1">({inactiveQuotes.length})</span></p>
              <div className="flex items-center gap-3">
                {selectedInactive.size > 0 && (
                  <button onClick={e => { e.stopPropagation(); handleBulkDelete() }} className="text-xs bg-[#FF453A]/10 text-[#FF453A] px-3 py-1 rounded-lg font-medium">
                    🗑 {lang === 'zh' ? `删除 ${selectedInactive.size} 个` : `Delete ${selectedInactive.size}`}
                  </button>
                )}
                <span className="text-[#8E8E93] text-sm">{showInactive ? '▲' : '▼'}</span>
              </div>
            </button>
            {showInactive && (
              <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C] border-t border-gray-100 dark:border-[#3A3A3C]">
                {inactiveQuotes.map(quote => <QuoteCard key={quote.id} quote={quote} inactive />)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

