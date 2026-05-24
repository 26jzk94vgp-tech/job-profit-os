'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../../../lib/i18n/LanguageContext'

export default function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [job, setJob] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
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
    try {
      let token = null
      const { data: jobData } = await supabase.from('jobs').select('public_token').eq('id', id).single()
      if (jobData?.public_token) { token = jobData.public_token } else {
        token = Math.random().toString(36).substring(2) + Date.now().toString(36)
        await supabase.from('jobs').update({ public_token: token }).eq('id', id)
      }
      const url = window.location.origin + '/invoice/' + token
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (e) {}
    setCopyingLink(false)
  }

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: (job?.name || 'Invoice') + ' - ' + invoiceNumber, url: window.location.href }) } catch (e) {}
    } else { window.print() }
  }

  if (!job || importing) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-400 text-sm">{importing ? (lang === 'zh' ? '⏳ 正在导入报价单细分条目...' : '⏳ Importing quote items...') : 'Loading...'}</div>
    </div>
  )

  const invoiceEntries = entries.filter(e => e.type === 'invoice')
  const exclusiveTotal = invoiceEntries.filter(e => e.gst_status === 'exclusive' || !e.gst_status).reduce((sum, e) => sum + Number(e.amount), 0)
  const inclusiveTotal = invoiceEntries.filter(e => e.gst_status === 'inclusive').reduce((sum, e) => sum + Number(e.amount), 0)
  const gst = exclusiveTotal * 0.1 + inclusiveTotal / 11
  const subTotal = exclusiveTotal + inclusiveTotal
  const total = exclusiveTotal + exclusiveTotal * 0.1 + inclusiveTotal
  const groups = [...new Set(invoiceEntries.map(e => e.item_group || ''))].filter(Boolean)
  const noGroup = invoiceEntries.filter(e => !e.item_group)
  const hasGroups = groups.length > 0
  const hasArea = invoiceEntries.some(e => e.area)

  const renderRow = (e: any) => {
    const qty = Number(e.quantity || 1)
    const unitPrice = e.unit_price ? Number(e.unit_price) : Number(e.amount) / qty
    const amount = Number(e.amount)
    return (
      <tr key={e.id} className="border border-gray-300">
        <td className="border border-gray-300 px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span>{e.description || e.type}</span>
            <a href={'/jobs/' + id + '/entry/' + e.id + '/edit'} className="print:hidden text-blue-400 hover:text-blue-600 text-xs shrink-0">✏️</a>
          </div>
        </td>
        {hasArea && <td className="border border-gray-300 px-3 py-2 text-sm text-center text-gray-500">{e.area || ''}</td>}
        <td className="border border-gray-300 px-3 py-2 text-sm text-center">{qty}</td>
        <td className="border border-gray-300 px-3 py-2 text-sm text-right">${unitPrice.toFixed(2)}</td>
        <td className="border border-gray-300 px-3 py-2 text-sm text-right">${amount.toFixed(2)}</td>
      </tr>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6 print:hidden">
        <div className="flex items-center gap-3 mb-6">
          <Link href={"/jobs/" + id} className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '发票预览' : 'Invoice Preview'}</h1>
        </div>

        {importDone && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            <p className="text-green-700 text-sm">✅ {lang === 'zh' ? '已自动从报价单导入细分条目' : 'Quote items imported automatically'}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '发票编号' : 'Invoice Number'}</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} /></div>
            <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '到期日' : 'Due Date'}</label><input type="date" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '客户名称 (账单送达)' : 'Client Name (Bill To)'}</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={toName} onChange={e => setToName(e.target.value)} /></div>
          <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '客户地址' : 'Client Address'}</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" placeholder="e.g. 123 Smith St, Perth WA" value={toAddress} onChange={e => setToAddress(e.target.value)} /></div>
          <hr />
          <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '发送到客户邮箱' : 'Send to Client Email'}</label><input type="email" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" placeholder="client@email.com" value={toEmail} onChange={e => setToEmail(e.target.value)} /></div>
          {sent && <p className="text-green-600 text-sm">✅ {lang === 'zh' ? '发票已发送！' : 'Invoice sent!'}</p>}
          <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '备注 / 付款条款' : 'Note / Payment Terms'}</label><textarea className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" rows={2} value={note} onChange={e => setNote(e.target.value)} /></div>
          {!profile?.company_name && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-xs">⚠️ {lang === 'zh' ? '还没有填写公司信息，' : 'Company info not set up yet. '}
                <Link href="/settings" className="text-blue-600 underline">{lang === 'zh' ? '前往设置' : 'Go to Settings'}</Link>
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleSendEmail} disabled={sending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {sending ? (lang === 'zh' ? '发送中...' : 'Sending...') : '📧 ' + (lang === 'zh' ? '发送发票' : 'Send Invoice')}
            </button>
            <button onClick={generateAndCopyLink} disabled={copyingLink} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium">
              {linkCopied ? '✅ ' + (lang === 'zh' ? '已复制!' : 'Copied!') : copyingLink ? '...' : '🔗 ' + (lang === 'zh' ? '复制链接' : 'Copy Link')}
            </button>
            {/* ✅ 存PDF 按钮 */}
            <button onClick={() => window.print()} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium">
              💾 {lang === 'zh' ? '存PDF' : 'Save PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-10 print:p-8 shadow-sm">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{lang === 'zh' ? '服务提供方' : 'From'}</p>
            <p className="font-bold text-xl text-gray-900">{profile?.company_name || 'Your Company Name'}</p>
            {profile?.company_address && <p className="text-sm text-gray-600 mt-1"><span className="text-gray-400">{lang === 'zh' ? '地址: ' : 'Address: '}</span>{profile.company_address}</p>}
            {profile?.company_email && <p className="text-sm text-gray-600"><span className="text-gray-400">{lang === 'zh' ? '邮箱: ' : 'Email: '}</span>{profile.company_email}</p>}
            {profile?.company_phone && <p className="text-sm text-gray-600"><span className="text-gray-400">{lang === 'zh' ? '电话: ' : 'Phone: '}</span>{profile.company_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-800 tracking-wide">INVOICE</p>
            <p className="text-sm text-gray-600 mt-2"><span className="text-gray-400">{lang === 'zh' ? '发票编号: ' : 'Invoice #: '}</span><span className="font-bold">{invoiceNumber}</span></p>
            <p className="text-sm text-gray-600"><span className="text-gray-400">{lang === 'zh' ? '日期: ' : 'Date: '}</span><span className="font-medium">{new Date().toLocaleDateString('en-AU')}</span></p>
            {dueDate && <p className="text-sm text-gray-600"><span className="text-gray-400">{lang === 'zh' ? '到期日: ' : 'Due Date: '}</span><span className="font-medium">{dueDate}</span></p>}
          </div>
        </div>

        {profile?.account_name && (
          <div className="mb-4 bg-blue-50 rounded-lg p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{lang === 'zh' ? '付款信息' : 'Payment Details'}</p>
            <p className="text-sm text-gray-700"><span className="text-gray-400">{lang === 'zh' ? '账户名: ' : 'Account Name: '}</span><span className="font-medium">{profile.account_name}</span></p>
            {profile.bsb && <p className="text-sm text-gray-700"><span className="text-gray-400">BSB: </span><span className="font-medium">{profile.bsb}</span></p>}
            {profile.account_number && <p className="text-sm text-gray-700"><span className="text-gray-400">{lang === 'zh' ? '账号: ' : 'Account No: '}</span><span className="font-medium">{profile.account_number}</span></p>}
            {profile.abn && <p className="text-sm text-gray-700"><span className="text-gray-400">ABN: </span><span className="font-medium">{profile.abn}</span></p>}
          </div>
        )}

        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{lang === 'zh' ? '账单送达' : 'Bill To'}</p>
          {toName && <p className="text-sm text-gray-700"><span className="text-gray-400">{lang === 'zh' ? '客户名称: ' : 'Client Name: '}</span><span className="font-semibold text-gray-900">{toName}</span></p>}
          {toAddress && <p className="text-sm text-gray-700 mt-1"><span className="text-gray-400">{lang === 'zh' ? '客户地址: ' : 'Address: '}</span><span className="font-medium">{toAddress}</span></p>}
          {!toName && !toAddress && <p className="text-sm text-gray-400 italic">{lang === 'zh' ? '请在上方填写客户名称和地址' : 'Please fill in client name and address above'}</p>}
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse" style={{minWidth: '400px'}}>
            <thead>
              <tr className="border border-gray-400 bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">{lang === 'zh' ? '描述' : 'DESCRIPTION'}</th>
                {hasArea && <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-20">{lang === 'zh' ? '区域' : 'AREA'}</th>}
                <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-16">{lang === 'zh' ? '数量' : 'QTY'}</th>
                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold w-24">{lang === 'zh' ? '单价' : 'UNIT PRICE'}</th>
                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold w-24">{lang === 'zh' ? '金额' : 'AMOUNT'}</th>
              </tr>
            </thead>
            <tbody>
              {invoiceEntries.length > 0 ? (
                hasGroups ? (
                  <>
                    {groups.map(group => (
                      <React.Fragment key={'group-' + group}>
                        <tr>
                          <td colSpan={hasArea ? 5 : 4} className="border border-gray-300 px-3 py-1.5 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">📁 {group}</td>
                        </tr>
                        {invoiceEntries.filter(e => e.item_group === group).map(renderRow)}
                      </React.Fragment>
                    ))}
                    {noGroup.map(renderRow)}
                  </>
                ) : invoiceEntries.map(renderRow)
              ) : (
                <tr className="border border-gray-300">
                  <td className="border border-gray-300 px-3 py-2 text-sm text-gray-400 italic" colSpan={hasArea ? 5 : 4}>{lang === 'zh' ? '还没有发票条目' : 'No invoice items yet.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-6">
          <table className="border-collapse">
            <tbody>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-6 py-2 text-sm font-medium">{lang === 'zh' ? '小计' : 'Sub Total'}:</td>
                <td className="border border-gray-300 px-6 py-2 text-sm text-right w-32">${subTotal.toFixed(2)}</td>
              </tr>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-6 py-2 text-sm font-medium">GST (10%):</td>
                <td className="border border-gray-300 px-6 py-2 text-sm text-right">${gst.toFixed(2)}</td>
              </tr>
              <tr className="border border-gray-300 bg-gray-50">
                <td className="border border-gray-300 px-6 py-2 text-sm font-bold">{lang === 'zh' ? '含GST总计' : 'Total Inc. GST'}:</td>
                <td className="border border-gray-300 px-6 py-2 text-sm font-bold text-right">${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {note && (
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-xs font-medium text-gray-600 mb-1">{lang === 'zh' ? '备注' : 'Note'}:</p>
            <p className="text-sm text-gray-700">{note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
