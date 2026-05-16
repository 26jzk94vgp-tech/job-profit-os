'use client'

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

  useEffect(() => {
    supabase.from('job_summary').select('*').eq('id', id).single().then(({ data }: { data: any }) => {
      setJob(data)
      if (data?.client_name) setToName(data.client_name)
    })
    supabase.from('job_entries').select('*').eq('job_id', id).then(({ data }: { data: any }) => setEntries(data || []))
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }: { data: any }) => {
          if (data) setProfile(data)
        })
      }
    })
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

  if (!job) return <div className="p-6">Loading...</div>

  const invoiceEntries = entries.filter(e => e.type !== 'invoice')
  const subTotal = invoiceEntries.reduce((sum, e) => sum + (e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)), 0)
  const gst = subTotal * 0.1
  const total = subTotal + gst

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6 print:hidden">
        <div className="flex items-center gap-3 mb-6">
          <Link href={"/jobs/" + id} className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '发票预览' : 'Invoice Preview'}</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '发票编号' : 'Invoice Number'}</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
            <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '到期日' : 'Due Date'}</label><input type="date" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
          <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '客户名称' : 'Bill To (Client Name)'}</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={toName} onChange={(e) => setToName(e.target.value)} /></div>
          <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '工程地址' : 'Job Address / TO:'}</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" placeholder="e.g. Unit 6C Lot 188 Coastal Rise" value={toAddress} onChange={(e) => setToAddress(e.target.value)} /></div>
          <hr />
          <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '发送到客户邮箱' : 'Send to Client Email'}</label><input type="email" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" placeholder="client@email.com" value={toEmail} onChange={(e) => setToEmail(e.target.value)} /></div>
          {sent && <p className="text-green-600 text-sm">✅ {lang === 'zh' ? '发票已发送！' : 'Invoice sent!'}</p>}
          <div><label className="text-gray-500 text-xs">{lang === 'zh' ? '备注 / 付款条款' : 'Note / Payment Terms'}</label><textarea className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="flex gap-3">
            <button onClick={handleSendEmail} disabled={sending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{sending ? (lang === 'zh' ? '发送中...' : 'Sending...') : '📧 ' + (lang === 'zh' ? '发送发票' : 'Send Invoice')}</button>
            <button onClick={() => window.print()} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium">🖨️ {lang === 'zh' ? '打印/PDF' : 'Print / PDF'}</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-10 print:p-8 shadow-sm">
        <div className="flex justify-between items-start mb-8">
          <div><p className="text-sm text-gray-600">{toAddress || job.name}</p></div>
          <div className="text-right">
            <p className="font-bold text-lg">{profile?.company_name || 'Your Company'}</p>
            {profile?.account_name && (
              <div className="text-sm text-gray-600 mt-2">
                <p>Account Name: <span className="font-medium">{profile.account_name}</span></p>
                {profile.bsb && <p>BSB: <span className="font-medium">{profile.bsb}</span></p>}
                {profile.account_number && <p>Account No: <span className="font-medium">{profile.account_number}</span></p>}
                {profile.abn && <p>ABN: <span className="font-medium">{profile.abn}</span></p>}
              </div>
            )}
          </div>
        </div>

        {toAddress && <p className="text-sm mb-4"><span className="font-bold">TO: </span>{toAddress}</p>}

        <div className="flex justify-end mb-6">
          <div className="text-right">
            <p className="text-sm text-gray-600">{lang === 'zh' ? '发票编号' : 'Invoice Number'}: <span className="font-bold">{invoiceNumber}</span></p>
            {dueDate && <p className="text-sm text-gray-600">{lang === 'zh' ? '到期日' : 'Due Date'}: <span className="font-medium">{dueDate}</span></p>}
          </div>
        </div>

        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border border-gray-400 bg-gray-100">
              <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">{lang === 'zh' ? '工程描述' : 'JOB DESCRIPTION'}</th>
              <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-16">{lang === 'zh' ? '数量' : 'QTY'}</th>
              <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold w-28">{lang === 'zh' ? '单价' : 'UNIT PRICE'}</th>
              <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold w-28">{lang === 'zh' ? '金额' : 'PRICE'}</th>
            </tr>
          </thead>
          <tbody>
            {invoiceEntries.length > 0 ? invoiceEntries.map((e) => {
              const qty = e.type === 'labor' ? Number(e.hours) : Number(e.quantity || 1)
              const unitPrice = e.type === 'labor' ? Number(e.hourly_rate) : (e.unit_price ? Number(e.unit_price) : Number(e.amount))
              const price = e.type === 'labor' ? qty * unitPrice : Number(e.amount)
              return (
                <tr key={e.id} className="border border-gray-300">
                  <td className="border border-gray-300 px-3 py-2 text-sm">{e.description || e.worker_name || e.type}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-center">{qty}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-right">${unitPrice.toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-right">${price.toFixed(2)}</td>
                </tr>
              )
            }) : (
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-3 py-2 text-sm">{job.name} - {lang === 'zh' ? '专业服务' : 'Professional Services'}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-center">1</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-right">${subTotal.toFixed(2)}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-right">${subTotal.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end">
          <table className="border-collapse">
            <tbody>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-6 py-2 text-sm font-medium">{lang === 'zh' ? '小计' : 'Sub Total'}:</td>
                <td className="border border-gray-300 px-6 py-2 text-sm text-right w-32">${subTotal.toFixed(2)}</td>
              </tr>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-6 py-2 text-sm font-medium">GST:</td>
                <td className="border border-gray-300 px-6 py-2 text-sm text-right">10%</td>
              </tr>
              <tr className="border border-gray-300 bg-gray-50">
                <td className="border border-gray-300 px-6 py-2 text-sm font-bold">{lang === 'zh' ? '总计' : 'Total'}:</td>
                <td className="border border-gray-300 px-6 py-2 text-sm font-bold text-right">${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {note && (
          <div className="mt-6 pt-4 border-t border-gray-300">
            <p className="text-xs font-medium text-gray-600 mb-1">{lang === 'zh' ? '备注' : 'Note'}:</p>
            <p className="text-sm text-gray-700">{note}</p>
          </div>
        )}
      </div>
    </div>
  )
}