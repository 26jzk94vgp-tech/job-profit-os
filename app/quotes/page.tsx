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
  const [filterStatus, setFilterStatus] = useState('all')

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
    let clientId = quote.client_id
    if (!clientId && quote.client_name) {
      const { data: existing } = await supabase.from('clients').select('id').eq('name', quote.client_name).eq('owner_id', user?.id).single()
      if (existing) { clientId = existing.id } else {
        const { data: newClient } = await supabase.from('clients').insert({ name: quote.client_name, owner_id: user?.id }).select().single()
        clientId = newClient?.id
      }
    }
    const jobName = quote.client_name ? (lang === 'zh' ? `${quote.client_name} 的工单` : `${quote.client_name}'s Job`) : (lang === 'zh' ? '新工单（来自报价单）' : 'New Job (from quote)')
    const { data: newJob } = await supabase.from('jobs').insert({ name: jobName, client_name: quote.client_name || null, client_id: clientId || null, notes: quote.notes || null, owner_id: user?.id, status: 'active' }).select().single()
    const totalSell = (quote.quote_items || []).reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0)
    if (newJob && totalSell > 0) {
      await supabase.from('job_entries').insert({ job_id: newJob.id, owner_id: user?.id, type: 'invoice', description: lang === 'zh' ? `报价单转工单 ${quote.quote_number || ''}`.trim() : `From quote ${quote.quote_number || ''}`.trim(), amount: totalSell, payment_status: 'unpaid', gst_status: 'inclusive', tax_category: 'other_income' })
    }
    await supabase.from('quotes').update({ status: 'won', job_id: newJob?.id, client_id: clientId || null }).eq('id', quote.id)
    await loadQuotes()
    setConverting(null)
    if (newJob) window.location.href = '/jobs/' + newJob.id
  }

  async function handleLost(quote: any) {
    if (!confirm(lang === 'zh' ? '确认不成交？' : 'Mark as lost?')) return
    await supabase.from('quotes').update({ status: 'lost' }).eq('id', quote.id)
    await loadQuotes()
  }

  async function handleDelete(quoteId: string) {
    if (!confirm(lang === 'zh' ? '确认删除？' : 'Delete this quote?')) return
    await supabase.from('quote_items').delete().eq('quote_id', quoteId)
    await supabase.from('quotes').delete().eq('id', quoteId)
    await loadQuotes()
  }

  const statusConfig: Record<string, { label: string, labelZh: string, cls: string }> = {
    draft:    { label: 'Draft',    labelZh: '草稿',      cls: 'bg-gray-100 dark:bg-[#3A3A3C] text-[#8E8E93]' },
    sent:     { label: 'Sent',     labelZh: '已发送',    cls: 'bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF]' },
    pending:  { label: 'Pending',  labelZh: '待定',      cls: 'bg-yellow-100 dark:bg-[#FF9F0A]/20 text-yellow-600 dark:text-[#FF9F0A]' },
    won:      { label: 'Won ✓',    labelZh: '已成交 ✓',  cls: 'bg-green-100 dark:bg-[#30D158]/20 text-green-600 dark:text-[#30D158]' },
    lost:     { label: 'Lost',     labelZh: '未成交',    cls: 'bg-red-100 dark:bg-[#FF453A]/20 text-red-500 dark:text-[#FF453A]' },
    accepted: { label: 'Accepted', labelZh: '已接受',    cls: 'bg-green-100 dark:bg-[#30D158]/20 text-green-600 dark:text-[#30D158]' },
    declined: { label: 'Declined', labelZh: '已拒绝',    cls: 'bg-red-100 dark:bg-[#FF453A]/20 text-red-500 dark:text-[#FF453A]' },
  }

  const filtered = filterStatus === 'all' ? quotes : quotes.filter(q => {
    if (filterStatus === 'pending') return !q.status || ['draft','sent','pending'].includes(q.status)
    if (filterStatus === 'won') return ['won','accepted'].includes(q.status)
    if (filterStatus === 'lost') return ['lost','declined'].includes(q.status)
    return q.status === filterStatus
  })

  const counts = {
    pending: quotes.filter(q => !q.status || ['draft','sent','pending'].includes(q.status)).length,
    won: quotes.filter(q => ['won','accepted'].includes(q.status)).length,
    lost: quotes.filter(q => ['lost','declined'].includes(q.status)).length,
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
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.pending}</p>
            <p className="text-xs text-[#8E8E93] mt-0.5">{lang === 'zh' ? '待定' : 'Pending'}</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4 text-center">
            <p className="text-2xl font-bold text-[#30D158]">{counts.won}</p>
            <p className="text-xs text-[#8E8E93] mt-0.5">{lang === 'zh' ? '已成交' : 'Won'}</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4 text-center">
            <p className="text-2xl font-bold text-[#FF453A]">{counts.lost}</p>
            <p className="text-xs text-[#8E8E93] mt-0.5">{lang === 'zh' ? '未成交' : 'Lost'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[{key:'all',label:lang==='zh'?'全部':'All'},{key:'pending',label:lang==='zh'?'待定':'Pending'},{key:'won',label:lang==='zh'?'已成交':'Won'},{key:'lost',label:lang==='zh'?'未成交':'Lost'}].map(f=>(
            <button key={f.key} onClick={()=>setFilterStatus(f.key)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus===f.key?'bg-[#0A84FF] text-white':'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>{f.label}</button>
          ))}
        </div>
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          {!filtered.length && <div className="px-6 py-16 text-center text-[#8E8E93]"><p className="text-4xl mb-3">📋</p><p>{lang==='zh'?'还没有报价单':'No quotes yet.'}</p><Link href="/quotes/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">{lang==='zh'?'新建报价单':'New Quote'}</Link></div>}
          <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
            {filtered.map(quote => {
              const total = (quote.quote_items||[]).reduce((sum:number,item:any)=>sum+(Number(item.quantity)*Number(item.unit_price)||0),0)
              const sc = statusConfig[quote.status]||statusConfig['draft']
              const isWonOrLost = ['won','lost','accepted','declined'].includes(quote.status)
              const isConverting = converting===quote.id
              return (
                <div key={quote.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{quote.client_name||(lang==='zh'?'未知客户':'Unknown Client')}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{lang==='zh'?sc.labelZh:sc.label}</span>
                      </div>
                      {quote.quote_number&&<p className="text-[#8E8E93] text-xs mt-0.5">{quote.quote_number}</p>}
                      {total>0&&<p className="text-[#30D158] font-semibold mt-1">${total.toLocaleString()}</p>}
                      {quote.status==='won'&&quote.job_id&&<Link href={`/jobs/${quote.job_id}`} className="text-[#0A84FF] text-xs mt-1 inline-block">→ {lang==='zh'?'查看工单':'View Job'}</Link>}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Link href={`/quotes/${quote.id}`} className="text-xs bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] px-3 py-1.5 rounded-xl text-center">{lang==='zh'?'查看':'View'}</Link>
                      {!isWonOrLost&&<>
                        <button onClick={()=>handleWon(quote)} disabled={isConverting} className="text-xs bg-[#30D158]/20 text-[#30D158] px-3 py-1.5 rounded-xl font-medium disabled:opacity-50">{isConverting?'...':(lang==='zh'?'✓ 成交':'✓ Won')}</button>
                        <button onClick={()=>handleLost(quote)} className="text-xs bg-[#FF453A]/10 text-[#FF453A] px-3 py-1.5 rounded-xl font-medium">{lang==='zh'?'✗ 不成交':'✗ Lost'}</button>
                      </>}
                      {isWonOrLost&&<button onClick={()=>handleDelete(quote.id)} className="text-xs text-[#8E8E93] px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3A3A3C]">{lang==='zh'?'删除':'Delete'}</button>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
