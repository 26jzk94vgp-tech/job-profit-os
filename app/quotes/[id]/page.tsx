'use client'

import { useState, useEffect, Fragment} from 'react'
import { use } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function QuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [quote, setQuote] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [successBanner, setSuccessBanner] = useState<{ jobId: string; deposit: number; msg: string } | null>(null)
  const [showEmailPanel, setShowEmailPanel] = useState(false)
  const [toEmail, setToEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    supabase.from('quotes').select('*, jobs(name), clients(name, address, phone, email)').eq('id', id).single().then(({ data }) => setQuote(data))
    supabase.from('quote_items').select('*').eq('quote_id', id).then(({ data }) => setItems(data || []))
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
  }, [id])

  async function updateStatus(status: string) {
    await supabase.from('quotes').update({ status }).eq('id', id)
    setQuote((q: any) => ({ ...q, status }))
  }

  async function sendQuote() {
    if (!toEmail) { alert('Please enter client email'); return }
    setSending(true)
    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: id, toEmail, toName: quote.client_name || '',
        companyName: profile?.company_name || '', companyEmail: profile?.company_email || '',
        invoiceNumber: quote.quote_number || 'Q-001', dueDate: '', isQuote: true
      })
    })
    const json = await res.json()
    if (json.success) {
      setSent(true)
      await updateStatus('sent')
      setTimeout(() => { setSent(false); setShowEmailPanel(false) }, 2000)
    } else { alert('Failed: ' + json.error) }
    setSending(false)
  }

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: (quote.quote_number || 'Quote') + ' - ' + (quote.client_name || ''), url: window.location.href }) } catch (e) {}
    } else { window.print() }
  }

  async function handleWon() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    try {
      const { data: freshQuote } = await supabase.from('quotes').select('*').eq('id', id).single()
      if (!freshQuote) throw new Error('Quote not found')
      if (freshQuote.status === 'accepted' && freshQuote.job_id) {
        window.location.href = '/jobs/' + freshQuote.job_id
        return
      }
      let jobId = freshQuote.job_id
      if (!jobId) {
        let clientId = freshQuote.client_id
        if (!clientId && freshQuote.client_name) {
          const { data: existingClient } = await supabase.from('clients').select('id').eq('owner_id', user?.id).ilike('name', freshQuote.client_name.trim()).single()
          if (existingClient) { clientId = existingClient.id } else {
            const { data: newClient } = await supabase.from('clients').insert({ name: freshQuote.client_name.trim(), owner_id: user?.id, address: freshQuote.site_address || null }).select('id').single()
            clientId = newClient?.id
          }
        }
        const jobName = freshQuote.job_name || freshQuote.client_name || (lang === 'zh' ? '新工单' : 'New Job')
        const { data: newJob, error: jobError } = await supabase.from('jobs').insert({ name: jobName, client_id: clientId || null, client_name: freshQuote.client_name || null, site_address: freshQuote.site_address || null, owner_id: user?.id, status: 'active' }).select('id').single()
        if (jobError) throw new Error(jobError.message)
        jobId = newJob.id
        const { error: updateError } = await supabase.from('quotes').update({ job_id: jobId, client_id: clientId || null, status: 'accepted', deposit_status: 'pending' }).eq('id', id)
        if (updateError) throw new Error(updateError.message)
      }
      const { data: existingInvoices } = await supabase.from('job_entries').select('id').eq('job_id', jobId).eq('type', 'invoice')
      if (!existingInvoices || existingInvoices.length === 0) {
        const invoiceItems = items.map(item => ({
          job_id: jobId, owner_id: user?.id, type: 'invoice',
          description: item.description + (item.area ? ' - ' + item.area : ''),
          item_group: item.item_group || null, area: item.area || null,
          quantity: Number(item.quantity), unit: item.item_unit || item.unit || null,
          unit_price: Number(item.unit_price), amount: Number(item.quantity) * Number(item.unit_price),
          gst_status: 'exclusive', tax_category: 'other_income', payment_status: 'unpaid'
        }))
        const { error: invoiceError } = await supabase.from('job_entries').insert(invoiceItems)
        if (invoiceError) throw new Error(invoiceError.message)
        const materialItems = items.filter(i => Number(i.cost_price) > 0).map(item => ({
          job_id: jobId, owner_id: user?.id, type: 'material',
          description: item.description + (item.area ? ' - ' + item.area : ''),
          quantity: Number(item.quantity), unit: item.item_unit || item.unit || null,
          unit_price: Number(item.cost_price), amount: Number(item.quantity) * Number(item.cost_price),
          gst_status: 'inclusive', tax_category: 'cogs_material', notes: 'QUOTE_ESTIMATE'
        }))
        if (materialItems.length > 0) await supabase.from('job_entries').insert(materialItems)
      }
      if (freshQuote.job_id) {
        await supabase.from('quotes').update({ status: 'accepted', deposit_status: 'pending' }).eq('id', id)
      }
      const subTotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0)
      const deposit = subTotal * 0.2
      const msg = lang === 'zh' ? `已自动创建工单并导入 ${items.length} 个条目` : `Job created! ${items.length} item(s) added`
      setSuccessBanner({ jobId, deposit, msg })
      setQuote((q: any) => ({ ...q, status: 'accepted', job_id: jobId }))
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }

  if (!quote) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
    </div>
  )

  const subTotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0)
  const gst = subTotal * 0.1
  const totalIncGst = subTotal + gst

  const statusConfig: Record<string, { label: string; labelZh: string; color: string }> = {
    draft:    { label: 'Draft',    labelZh: '草稿',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    sent:     { label: 'Sent',     labelZh: '已发送', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    accepted: { label: 'Accepted', labelZh: '已成交', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    declined: { label: 'Declined', labelZh: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 pt-5 pb-4 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <a href="/quotes" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">← {lang === 'zh' ? '返回' : 'Back'}</a>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{lang === 'zh' ? '报价单详情' : 'Quote Detail'}</h1>
        </div>

        {successBanner && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300 text-sm">🎉 {lang === 'zh' ? '成交！' : 'Won!'}</p>
                <p className="text-green-700 dark:text-green-400 text-xs mt-0.5">{successBanner.msg}</p>
                <div className="mt-2 bg-white dark:bg-[#2C2C2E] rounded-xl px-3 py-2 inline-block">
                  <p className="text-xs text-[#8E8E93]">{lang === 'zh' ? '建议收取 20% 预付款' : 'Suggested 20% deposit'}</p>
                  <p className="font-bold text-[#FF9F0A] text-base">${successBanner.deposit.toFixed(2)}</p>
                </div>
              </div>
              <a href={'/jobs/' + successBanner.jobId} className="shrink-0 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">{lang === 'zh' ? '查看工单 →' : 'View Job →'}</a>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">{lang === 'zh' ? '状态' : 'Status'}</span>
          {(['draft', 'sent', 'accepted', 'declined'] as const).map(s => {
            const cfg = statusConfig[s]
            const isActive = quote.status === s
            return (
              <button key={s} onClick={() => updateStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${isActive ? cfg.color + ' ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900 ring-current' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {lang === 'zh' ? cfg.labelZh : cfg.label}
              </button>
            )
          })}
          <a href={`/quotes/${id}/edit`} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            ✏️ {lang === 'zh' ? '编辑' : 'Edit'}
          </a>
          <div className="flex-1" />
          {/* ✅ 存PDF 按钮 */}
          <button onClick={() => window.print()} className="px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            💾 {lang === 'zh' ? '存PDF' : 'Save PDF'}
          </button>
          <button onClick={() => setShowEmailPanel(!showEmailPanel)} className="px-4 py-1.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors">
            📧 {lang === 'zh' ? '发送报价' : 'Send Quote'}
          </button>
          {quote.status !== 'accepted' ? (
            <button onClick={handleWon} disabled={loading} className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#30D158] hover:bg-green-400 text-white disabled:opacity-50 transition-colors">
              {loading ? (lang === 'zh' ? '处理中…' : 'Processing…') : (lang === 'zh' ? '🎉 成交！' : '🎉 Won!')}
            </button>
          ) : (
            <a href={'/jobs/' + quote.job_id} className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-green-600 dark:text-[#30D158] transition-colors">
              ✅ {lang === 'zh' ? '查看工单' : 'View Job'}
            </a>
          )}
        </div>
      </div>

      {showEmailPanel && (
        <div className="max-w-4xl mx-auto px-4 pb-4 print:hidden">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm px-4 py-4 space-y-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">📧 {lang === 'zh' ? '发送报价单' : 'Send Quote'}</p>
            <div className="flex gap-2">
              <input type="email" className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/40"
                placeholder={quote.clients?.email || 'client@email.com'} value={toEmail} onChange={e => setToEmail(e.target.value)} />
              <button onClick={sendQuote} disabled={sending} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                {sent ? '✅' : sending ? (lang === 'zh' ? '发送中...' : 'Sending...') : (lang === 'zh' ? '发送' : 'Send')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 pb-12 print:px-0 print:pb-0">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm overflow-hidden print:rounded-none print:shadow-none print:border-0">
          <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{profile?.company_name || 'Your Company'}</h2>
              {profile?.company_abn && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">ABN {profile.company_abn}</p>}
            </div>
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
              <p className="font-semibold text-gray-700 dark:text-gray-200">{profile?.company_name || 'Your Company'}</p>
              {profile?.company_phone && <p>{profile.company_phone}</p>}
              {profile?.company_email && <p className="text-blue-500 dark:text-blue-400">{profile.company_email}</p>}
            </div>
          </div>

          <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex gap-3"><span className="w-20 text-gray-400 dark:text-gray-500 shrink-0">{lang === 'zh' ? '报价单号' : 'Quote No.'}</span><span className="font-semibold text-gray-800 dark:text-gray-100">{quote.quote_number || 'Q-001'}</span></div>
              <div className="flex gap-3"><span className="w-20 text-gray-400 dark:text-gray-500 shrink-0">{lang === 'zh' ? '日期' : 'Date'}</span><span className="text-gray-700 dark:text-gray-200">{quote.quote_date || new Date().toLocaleDateString('en-AU')}</span></div>
              <div className="flex gap-3"><span className="w-20 text-gray-400 dark:text-gray-500 shrink-0">{lang === 'zh' ? '客户' : 'Client'}</span><span className="text-gray-700 dark:text-gray-200">{quote.client_name || quote.clients?.name || '—'}</span></div>
              <div className="flex gap-3"><span className="w-20 text-gray-400 dark:text-gray-500 shrink-0">{lang === 'zh' ? '类型' : 'Type'}</span><span className="text-gray-700 dark:text-gray-200">{quote.quote_type || 'Residential'}</span></div>
              <div className="flex gap-3 col-span-2"><span className="w-20 text-gray-400 dark:text-gray-500 shrink-0">{lang === 'zh' ? '地址' : 'Address'}</span><span className="text-gray-700 dark:text-gray-200">{quote.site_address || quote.jobs?.name || '—'}</span></div>
            </div>
          </div>

          <div className="px-8 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{lang === 'zh' ? '描述' : 'Description'}</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{lang === 'zh' ? '区域' : 'Area'}</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-16">Code</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{lang === 'zh' ? '名称' : 'Name'}</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-16">{lang === 'zh' ? '类型' : 'Type'}</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-12">{lang === 'zh' ? '单位' : 'Unit'}</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-12">{lang === 'zh' ? '数量' : 'Qty'}</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24">{lang === 'zh' ? '单价' : 'Rate'}</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24">{lang === 'zh' ? '金额' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const groups = [...new Set(items.map(i => i.item_group || ''))].filter(Boolean)
                  const noGroup = items.filter(i => !i.item_group)
                  const renderRow = (item: any) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-2.5 pr-3 text-gray-700 dark:text-gray-200">{item.description}</td>
                      <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-300">{item.area || ''}</td>
                      <td className="py-2.5 pr-3 text-gray-500 dark:text-gray-400">{item.code || ''}</td>
                      <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-300">{item.item_name || ''}</td>
                      <td className="py-2.5 pr-3 text-gray-500 dark:text-gray-400">{item.item_type || ''}</td>
                      <td className="py-2.5 pr-3 text-gray-500 dark:text-gray-400">{item.item_unit || item.unit || ''}</td>
                      <td className="py-2.5 text-right text-gray-700 dark:text-gray-200">{item.quantity}</td>
                      <td className="py-2.5 text-right text-gray-700 dark:text-gray-200">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-2.5 text-right font-medium text-gray-800 dark:text-gray-100">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                    </tr>
                  )
                  return (
                    <>
                      {groups.map(group => (
                        <Fragment key={group}><tr key={group}><td colSpan={9} className="pt-4 pb-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{group}</td></tr>
                        {items.filter(i => i.item_group === group).map(renderRow)}</Fragment>
                      ))}
                      {noGroup.map(renderRow)}
                    </>
                  )
                })()}
              </tbody>
            </table>
          </div>

          <div className="px-8 pb-8 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between py-1.5 text-gray-500 dark:text-gray-400"><span>{lang === 'zh' ? '小计' : 'Sub-Total'}</span><span>${subTotal.toFixed(2)}</span></div>
              <div className="flex justify-between py-1.5 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800"><span>GST (10%)</span><span>${gst.toFixed(2)}</span></div>
              <div className="flex justify-between py-2.5 font-semibold text-base text-gray-900 dark:text-white"><span>{lang === 'zh' ? '含GST总计' : 'Total Inc. GST'}</span><span className="text-blue-600 dark:text-blue-400">${totalIncGst.toFixed(2)}</span></div>
              <div className="flex justify-between py-1.5 text-[#FF9F0A] text-xs border-t border-gray-100 dark:border-gray-800 mt-1 pt-2">
                <span>{lang === 'zh' ? '建议预付款 (20%)' : 'Suggested Deposit (20%)'}</span>
                <span className="font-semibold">${(subTotal * 0.2).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {quote.scope_of_work && (
            <div className="px-8 pb-6 border-t border-gray-100 dark:border-gray-800 pt-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{lang === 'zh' ? '工作范围' : 'Scope of Work'}</p>
              <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{quote.scope_of_work}</pre>
            </div>
          )}
          {quote.notes && (
            <div className="px-8 pb-8">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{lang === 'zh' ? '备注' : 'Notes'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{quote.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
