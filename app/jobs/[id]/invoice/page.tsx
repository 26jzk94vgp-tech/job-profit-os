'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { use } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../../../lib/i18n/LanguageContext'

export default function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const searchParams = useSearchParams()
  const stageParam = searchParams.get('stage')
  const stageNum = stageParam ? Number(stageParam) : null
  const [job, setJob] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001')
  const [dueDate, setDueDate] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [toName, setToName] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [toEmail, setToEmail] = useState('')
  const [note, setNote] = useState(lang === 'zh' ? '请在14天内付款。感谢您的惠顾！' : 'Payment due within 14 days. Thank you for your business!')
  const [copyingLink, setCopyingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: jobData } = await supabase.from('job_summary').select('*').eq('id', id).single()
      if (!jobData) return
      setJob(jobData)
      if (jobData.client_name) setToName(jobData.client_name)
      if (jobData.client_name) {
        supabase.from('clients').select('address, email').eq('name', jobData.client_name).single().then(({ data: c }) => {
          if (c?.address) setToAddress(c.address)
          if (c?.email) setToEmail(c.email)
        })
      }

      // 加载关联报价单
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('id, quote_number, status')
        .eq('job_id', id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: true })
      setQuotes(quotesData || [])

      const { data: entryData } = await supabase.from('job_entries').select('*').eq('job_id', id)
      const allEntries = entryData || []
      const invoiceEntries = allEntries.filter((e: any) => e.type === 'invoice')
      const isSummaryOnly = invoiceEntries.length === 1 && /报价单|quote/i.test(invoiceEntries[0]?.description || '')
      if (isSummaryOnly) {
        setImporting(true)
        try {
          const { data: quote } = await supabase.from('quotes').select('id, quote_number').eq('job_id', id).order('created_at', { ascending: false }).limit(1).single()
          if (quote) {
            const { data: quoteItems } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id)
            if (quoteItems && quoteItems.length > 0) {
              const { data: { user } } = await supabase.auth.getUser()
              await supabase.from('job_entries').delete().eq('id', invoiceEntries[0].id)
              const newItems = quoteItems.map((item: any) => ({
                job_id: id, owner_id: user?.id, type: 'invoice',
                description: item.description + (item.area ? ' - ' + item.area : ''),
                item_group: item.item_group || null, area: item.area || null,
                quantity: Number(item.quantity) || 1, unit: item.unit || null,
                unit_price: Number(item.unit_price),
                amount: Number(item.quantity) * Number(item.unit_price),
                gst_status: 'exclusive', tax_category: 'other_income', payment_status: 'unpaid'
              }))
              await supabase.from('job_entries').insert(newItems)
              const { data: refreshed } = await supabase.from('job_entries').select('*').eq('job_id', id)
              setEntries(refreshed || [])
              setImportDone(true)
            }
          }
        } catch (e) {}
        setImporting(false)
      } else {
        setEntries(allEntries)
      }
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }: { data: any }) => { if (data) setProfile(data) })
      })
    }
    load()
  }, [id])

  async function handleSendEmail() {
    if (!toEmail) { alert(lang === 'zh' ? '请输入客户邮箱' : 'Please enter client email'); return }
    setSending(true)
    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: id, toEmail, toName, companyName: profile?.company_name || '', companyEmail: profile?.company_email || '', invoiceNumber, dueDate })
    })
    const json = await res.json()
    if (json.success) { setSent(true) } else { alert('Failed: ' + json.error) }
    setSending(false)
  }

  async function generateAndCopyLink() {
    setCopyingLink(true)
    let url = ''
    const buildUrl = async () => {
      let token = null
      const { data: jobData } = await supabase.from('jobs').select('public_token').eq('id', id).single()
      if (jobData?.public_token) { token = jobData.public_token } else {
        token = crypto.randomUUID()
        await supabase.from('jobs').update({ public_token: token }).eq('id', id)
      }
      url = window.location.origin + '/invoice/' + token
      return url
    }
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        const item = new ClipboardItem({ 'text/plain': buildUrl().then(u => new Blob([u], { type: 'text/plain' })) })
        await navigator.clipboard.write([item])
      } else {
        await navigator.clipboard.writeText(await buildUrl())
      }
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (e) {
      if (!url) { try { await buildUrl() } catch (e2) {} }
      if (url) { window.prompt(lang === 'zh' ? '自动复制失败,请手动复制链接:' : 'Auto-copy failed, copy manually:', url) }
    }
    setCopyingLink(false)
  }

  if (!job || importing) return (
    <div className="invoice-page min-h-screen flex items-center justify-center">
      <div className="invoice-label text-sm">{importing ? (lang === 'zh' ? '⏳ 正在导入报价单细分条目...' : '⏳ Importing quote items...') : 'Loading...'}</div>
    </div>
  )

  const allInvoiceEntries = entries.filter(e => e.type === 'invoice')
  const invoiceEntries = stageNum ? allInvoiceEntries.filter(e => Number(e.claim_stage) === stageNum) : allInvoiceEntries
  const stageMeta = stageNum ? allInvoiceEntries.find(e => Number(e.claim_stage) === stageNum) : null
  const stageDef = stageMeta?.notes && String(stageMeta.notes).startsWith('STAGE_DEF:') ? String(stageMeta.notes).slice(10) : ''
  const totalStages = [...new Set(allInvoiceEntries.filter(e=>e.claim_stage).map(e=>Number(e.claim_stage)))].length
  const exclusiveTotal = invoiceEntries.filter(e => e.gst_status === 'exclusive' || !e.gst_status).reduce((sum, e) => sum + Number(e.amount), 0)
  const inclusiveTotal = invoiceEntries.filter(e => e.gst_status === 'inclusive').reduce((sum, e) => sum + Number(e.amount), 0)
  const gst = exclusiveTotal * 0.1 + inclusiveTotal / 11
  const subTotal = exclusiveTotal + inclusiveTotal
  const total = exclusiveTotal + exclusiveTotal * 0.1 + inclusiveTotal
  const hasArea = invoiceEntries.some(e => e.area)
  const colSpan = hasArea ? 5 : 4

  // 按报价单分组：有 quote_id 的按报价单分，没有的归入第一组
  const hasMultipleQuotes = quotes.length > 0
  const getQuoteIndex = (quoteId: string) => quotes.findIndex(q => q.id === quoteId) + 1

  const renderRow = (e: any) => {
    const qty = Number(e.quantity || 1)
    const unitPrice = e.unit_price ? Number(e.unit_price) : Number(e.amount) / qty
    const amount = Number(e.amount)
    const cellStyle = {color:'#111827', backgroundColor:'#FFFFFF'}
    return (
      <tr key={e.id} style={{borderColor:'#D1D5DB'}}>
        <td className="px-3 py-2 text-sm" style={{...cellStyle, border:'1px solid #D1D5DB'}}>
          <div className="flex items-center justify-between gap-2">
            <span>{e.description || e.type}</span>
            <a href={'/jobs/' + id + '/entry/' + e.id + '/edit'} className="print:hidden text-xs shrink-0" style={{color:'#60A5FA'}}>✏️</a>
          </div>
        </td>
        {hasArea && <td className="px-3 py-2 text-sm text-center" style={{...cellStyle, border:'1px solid #D1D5DB', color:'#6B7280'}}>{e.area || ''}</td>}
        <td className="px-3 py-2 text-sm text-center" style={{...cellStyle, border:'1px solid #D1D5DB'}}>{qty}</td>
        <td className="px-3 py-2 text-sm text-right" style={{...cellStyle, border:'1px solid #D1D5DB'}}>${unitPrice.toFixed(2)}</td>
        <td className="px-3 py-2 text-sm text-right" style={{...cellStyle, border:'1px solid #D1D5DB'}}>${amount.toFixed(2)}</td>
      </tr>
    )
  }

  const renderQuoteSection = (quote: any, quoteNum: number) => {
    const quoteEntries = invoiceEntries.filter(e =>
      e.quote_id === quote.id || (!e.quote_id && quoteNum === 1)
    )
    if (quoteEntries.length === 0) return null
    const quoteTotal = quoteEntries.reduce((sum, e) => sum + Number(e.amount), 0)
    const groups = [...new Set(quoteEntries.map(e => e.item_group || ''))].filter(Boolean)
    const noGroup = quoteEntries.filter(e => !e.item_group)
    const hasGroups = groups.length > 0

    return (
      <React.Fragment key={quote.id}>
        {/* 单1/单2 标题行 */}
        <tr>
          <td colSpan={colSpan} className="border border-gray-400 px-3 py-2 text-sm font-bold" style={{backgroundColor:'#E5E7EB', color:'#111827'}}>
            {lang === 'zh' ? `单${quoteNum}` : `Q${quoteNum}`} — {quote.quote_number}
            <span className="float-right font-semibold">${quoteTotal.toFixed(2)}</span>
          </td>
        </tr>
        {hasGroups ? (
          <>
            {groups.map(group => (
              <React.Fragment key={group}>
                <tr>
                  <td colSpan={colSpan} className="border border-gray-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wider" style={{backgroundColor:'#FFFFFF', color:'#374151'}}>📁 {group}</td>
                </tr>
                {quoteEntries.filter(e => e.item_group === group).map(renderRow)}
              </React.Fragment>
            ))}
            {noGroup.map(renderRow)}
          </>
        ) : (
          quoteEntries.map(renderRow)
        )}
      </React.Fragment>
    )
  }

  return (
    <div className="invoice-page min-h-screen">

      {/* ── 控制面板 print:hidden ── */}
      <div className="max-w-2xl mx-auto px-4 pt-16 pb-8 md:pt-6 print:hidden">

        <div className="flex items-center gap-3 mb-6">
          <Link href={"/jobs/" + id} className="text-[#0A84FF] text-sm font-medium">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <span className="invoice-value font-semibold text-base">{lang === 'zh' ? '发票' : 'Invoice'}</span>
        </div>

        {importDone && (
          <div className="rounded-2xl px-4 py-3 mb-4" style={{backgroundColor:'rgba(48,209,88,0.12)',border:'1px solid rgba(48,209,88,0.4)'}}>
            <p className="text-sm font-medium" style={{color:'#30D158'}}>✅ {lang === 'zh' ? '已自动从报价单导入细分条目' : 'Quote items imported automatically'}</p>
          </div>
        )}

        {/* 发票信息卡片 */}
        <div className="invoice-card rounded-2xl overflow-hidden mb-4" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
          <div className="grid grid-cols-2">
            <div className="px-4 py-3 invoice-divider" style={{borderRight:'1px solid',borderBottom:'1px solid'}}>
              <p className="invoice-label mb-1">{lang === 'zh' ? '发票编号' : 'Invoice No.'}</p>
              <input className="w-full bg-transparent outline-none text-sm font-semibold invoice-value" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="px-4 py-3" style={{borderBottom:'1px solid',borderColor:'inherit'}}>
              <p className="invoice-label mb-1">{lang === 'zh' ? '到期日' : 'Due Date'}</p>
              <input type="date" className="w-full bg-transparent outline-none text-sm invoice-value" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="px-4 py-3" style={{borderBottom:'1px solid var(--tw-border-opacity, #E5E5EA)'}}>
            <p className="invoice-label mb-1">{lang === 'zh' ? '账单送达' : 'Bill To'}</p>
            <input className="w-full bg-transparent outline-none text-sm font-medium invoice-value" placeholder={lang === 'zh' ? '客户名称' : 'Client name'} value={toName} onChange={e => setToName(e.target.value)} />
          </div>
          <div className="px-4 py-3">
            <p className="invoice-label mb-1">{lang === 'zh' ? '客户地址' : 'Address'}</p>
            <input className="w-full bg-transparent outline-none text-sm invoice-placeholder" placeholder="e.g. 123 Smith St, Perth WA" value={toAddress} onChange={e => setToAddress(e.target.value)} />
          </div>
        </div>

        {/* 邮箱 + 备注卡片 */}
        <div className="invoice-card rounded-2xl overflow-hidden mb-4" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
          <div className="px-4 py-3" style={{borderBottom:'1px solid'}}>
            <p className="invoice-label mb-1">{lang === 'zh' ? '客户邮箱' : 'Client Email'}</p>
            <input type="email" className="w-full bg-transparent outline-none text-sm invoice-value" placeholder="client@email.com" value={toEmail} onChange={e => setToEmail(e.target.value)} />
          </div>
          <div className="px-4 py-3">
            <p className="invoice-label mb-1">{lang === 'zh' ? '备注 / 付款条款' : 'Notes / Payment Terms'}</p>
            <textarea className="w-full bg-transparent outline-none text-sm resize-none invoice-value" rows={2} value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        {!profile?.company_name && (
          <div className="rounded-2xl px-4 py-3 mb-4" style={{backgroundColor:'rgba(255,159,10,0.12)',border:'1px solid rgba(255,159,10,0.4)'}}>
            <p className="text-sm" style={{color:'#FF9F0A'}}>⚠️ {lang === 'zh' ? '还没有填写公司信息 · ' : 'Company info not set up · '}
              <Link href="/settings" className="underline font-medium">{lang === 'zh' ? '前往设置' : 'Go to Settings'}</Link>
            </p>
          </div>
        )}

        {sent && (
          <div className="rounded-2xl px-4 py-3 mb-4" style={{backgroundColor:'rgba(48,209,88,0.12)',border:'1px solid rgba(48,209,88,0.4)'}}>
            <p className="text-sm font-medium" style={{color:'#30D158'}}>✅ {lang === 'zh' ? '发票已发送！' : 'Invoice sent!'}</p>
          </div>
        )}

        <div className="space-y-3">
          <button onClick={handleSendEmail} disabled={sending}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{backgroundColor:'#0A84FF'}}>
            {sending ? (lang === 'zh' ? '发送中...' : 'Sending...') : '📧 ' + (lang === 'zh' ? '发送发票给客户' : 'Send Invoice to Client')}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={generateAndCopyLink} disabled={copyingLink}
              className="invoice-card py-3 rounded-2xl text-sm font-medium invoice-value disabled:opacity-50"
              style={{border:'1px solid'}}>
              {linkCopied ? '✅ ' + (lang === 'zh' ? '已复制' : 'Copied') : copyingLink ? '...' : '🔗 ' + (lang === 'zh' ? '复制链接' : 'Copy Link')}
            </button>
            <button onClick={() => window.print()}
              className="invoice-card py-3 rounded-2xl text-sm font-medium invoice-value"
              style={{border:'1px solid'}}>
              💾 {lang === 'zh' ? '存PDF' : 'Save PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 发票正文（打印区域）── */}
      <div className="max-w-4xl mx-auto p-10 print:p-8 shadow-sm" style={{backgroundColor:'#FFFFFF', color:'#111827'}}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'#9CA3AF'}}>{lang === 'zh' ? '服务提供方' : 'From'}</p>
            <p className="font-bold text-xl" style={{color:'#111827'}}>{profile?.company_name || 'Your Company Name'}</p>
            {profile?.company_address && <p className="text-sm mt-1" style={{color:'#4B5563'}}><span style={{color:'#9CA3AF'}}>{lang === 'zh' ? '地址: ' : 'Address: '}</span>{profile.company_address}</p>}
            {profile?.company_email && <p className="text-sm" style={{color:'#4B5563'}}><span style={{color:'#9CA3AF'}}>{lang === 'zh' ? '邮箱: ' : 'Email: '}</span>{profile.company_email}</p>}
            {profile?.company_phone && <p className="text-sm" style={{color:'#4B5563'}}><span style={{color:'#9CA3AF'}}>{lang === 'zh' ? '电话: ' : 'Phone: '}</span>{profile.company_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-wide" style={{color:'#1F2937'}}>INVOICE</p>
            <p className="text-sm mt-2" style={{color:'#4B5563'}}><span style={{color:'#9CA3AF'}}>{lang === 'zh' ? '发票编号: ' : 'Invoice #: '}</span><span className="font-bold">{invoiceNumber}</span></p>
            <p className="text-sm" style={{color:'#4B5563'}}><span style={{color:'#9CA3AF'}}>{lang === 'zh' ? '日期: ' : 'Date: '}</span><span className="font-medium">{new Date().toLocaleDateString('en-AU')}</span></p>
            {dueDate && <p className="text-sm" style={{color:'#4B5563'}}><span style={{color:'#9CA3AF'}}>{lang === 'zh' ? '到期日: ' : 'Due Date: '}</span><span className="font-medium">{dueDate}</span></p>}
            {stageNum && stageMeta && (
              <div className="mt-2 inline-block px-3 py-1 rounded-full" style={{backgroundColor:'#EFF6FF'}}>
                <span className="text-xs font-bold" style={{color:'#1D4ED8'}}>{lang === 'zh' ? '第' : 'Stage '}{stageNum}{lang === 'zh' ? '期' : ''}{totalStages>0 ? (lang==='zh' ? ' / 共'+totalStages+'期' : ' of '+totalStages) : ''} · {stageMeta.claim_label || ''}{stageMeta.claim_percent ? ' · '+Math.round(Number(stageMeta.claim_percent)*100)+'%' : ''}</span>
              </div>
            )}
          </div>
        </div>
        {stageNum && stageDef && (
          <div className="mb-6 rounded-lg p-3" style={{backgroundColor:'#F9FAFB', border:'1px solid #E5E7EB'}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'#9CA3AF'}}>{lang === 'zh' ? '本期说明' : 'Stage Definition'}</p>
            <p className="text-sm" style={{color:'#4B5563'}}>{stageDef}</p>
          </div>
        )}

        {profile?.account_name && (
          <div className="mb-4 bg-white border border-gray-300 rounded-lg p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{lang === 'zh' ? '付款信息' : 'Payment Details'}</p>
            <p className="text-sm text-gray-700"><span className="text-gray-400">{lang === 'zh' ? '账户名: ' : 'Account Name: '}</span><span className="font-medium">{profile.account_name}</span></p>
            {profile.bsb && <p className="text-sm text-gray-700"><span className="text-gray-400">BSB: </span><span className="font-medium">{profile.bsb}</span></p>}
            {profile.account_number && <p className="text-sm text-gray-700"><span className="text-gray-400">{lang === 'zh' ? '账号: ' : 'Account No: '}</span><span className="font-medium">{profile.account_number}</span></p>}
            {profile.abn && <p className="text-sm text-gray-700"><span className="text-gray-400">ABN: </span><span className="font-medium">{profile.abn}</span></p>}
          </div>
        )}

        <div className="mb-6 rounded-lg p-4" style={{backgroundColor:'#F9FAFB'}}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#6B7280'}}>{lang === 'zh' ? '账单送达' : 'Bill To'}</p>
          {toName && <p className="text-sm" style={{color:'#374151'}}><span style={{color:'#9CA3AF'}}>{lang === 'zh' ? '客户名称: ' : 'Client Name: '}</span><span className="font-semibold" style={{color:'#111827'}}>{toName}</span></p>}
          {toAddress && <p className="text-sm mt-1" style={{color:'#374151'}}><span style={{color:'#9CA3AF'}}>{lang === 'zh' ? '客户地址: ' : 'Address: '}</span><span className="font-medium">{toAddress}</span></p>}
          {!toName && !toAddress && <p className="text-sm italic" style={{color:'#9CA3AF'}}>{lang === 'zh' ? '请在上方填写客户名称和地址' : 'Please fill in client name and address above'}</p>}
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse" style={{minWidth:'400px'}}>
            <thead>
              <tr className="border border-gray-400 bg-white">
                <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">{lang === 'zh' ? '描述' : 'DESCRIPTION'}</th>
                {hasArea && <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-20">{lang === 'zh' ? '区域' : 'AREA'}</th>}
                <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-16">{lang === 'zh' ? '数量' : 'QTY'}</th>
                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold w-24">{lang === 'zh' ? '单价' : 'UNIT PRICE'}</th>
                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold w-24">{lang === 'zh' ? '金额' : 'AMOUNT'}</th>
              </tr>
            </thead>
            <tbody>
              {invoiceEntries.length > 0 ? (
                hasMultipleQuotes && quotes.length > 0 ? (
                  // 多报价单：按单1/单2分组
                  quotes.map((quote, index) => renderQuoteSection(quote, index + 1))
                ) : (
                  // 单报价单：按 item_group 分组（原逻辑）
                  (() => {
                    const groups = [...new Set(invoiceEntries.map(e => e.item_group || ''))].filter(Boolean)
                    const noGroup = invoiceEntries.filter(e => !e.item_group)
                    const hasGroups = groups.length > 0
                    return hasGroups ? (
                      <>
                        {groups.map(group => (
                          <React.Fragment key={group}>
                            <tr><td colSpan={colSpan} className="border border-gray-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wider" style={{backgroundColor:'#FFFFFF', color:'#374151'}}>📁 {group}</td></tr>
                            {invoiceEntries.filter(e => e.item_group === group).map(renderRow)}
                          </React.Fragment>
                        ))}
                        {noGroup.map(renderRow)}
                      </>
                    ) : invoiceEntries.map(renderRow)
                  })()
                )
              ) : (
                <tr className="border border-gray-300">
                  <td className="border border-gray-300 px-3 py-2 text-sm text-gray-400 italic" colSpan={colSpan}>{lang === 'zh' ? '还没有发票条目' : 'No invoice items yet.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-6">
          <table style={{borderCollapse:'collapse'}}>
            <tbody>
              <tr>
                <td style={{border:'1px solid #D1D5DB', padding:'8px 24px', fontSize:'14px', fontWeight:500, color:'#111827', backgroundColor:'#FFFFFF'}}>{lang === 'zh' ? '小计' : 'Sub Total'}:</td>
                <td style={{border:'1px solid #D1D5DB', padding:'8px 24px', fontSize:'14px', textAlign:'right', width:'128px', color:'#111827', backgroundColor:'#FFFFFF'}}>${subTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #D1D5DB', padding:'8px 24px', fontSize:'14px', fontWeight:500, color:'#111827', backgroundColor:'#FFFFFF'}}>GST (10%):</td>
                <td style={{border:'1px solid #D1D5DB', padding:'8px 24px', fontSize:'14px', textAlign:'right', color:'#111827', backgroundColor:'#FFFFFF'}}>${gst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{border:'1px solid #D1D5DB', padding:'8px 24px', fontSize:'14px', fontWeight:700, color:'#111827', backgroundColor:'#FFFFFF'}}>{lang === 'zh' ? '含GST总计' : 'Total Inc. GST'}:</td>
                <td style={{border:'1px solid #D1D5DB', padding:'8px 24px', fontSize:'14px', fontWeight:700, textAlign:'right', color:'#111827', backgroundColor:'#FFFFFF'}}>${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {note && (
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-xs font-medium mb-1" style={{color:'#4B5563'}}>{lang === 'zh' ? '备注' : 'Note'}:</p>
            <p className="text-sm" style={{color:'#374151'}}>{note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
