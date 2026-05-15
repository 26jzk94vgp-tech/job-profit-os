'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import Link from 'next/link'

export default function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001')
  const [dueDate, setDueDate] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('job_summary').select('*').eq('id', id).single().then(({ data }) => setJob(data))
    supabase.from('job_entries').select('*').eq('job_id', id).eq('type', 'invoice').then(({ data }) => setEntries(data || []))
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) {
            setCompanyName(data.company_name || '')
            setCompanyEmail(data.company_email || '')
            setCompanyPhone(data.company_phone || '')
          }
        })
      }
    })
  }, [id])

  async function handleSendEmail() {
    if (!toEmail) { alert('Please enter client email'); return }
    setSending(true)
    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: id, toEmail, toName: job?.client_name, companyName, companyEmail, invoiceNumber, dueDate })
    })
    const json = await res.json()
    if (json.success) { setSent(true) } else { alert('Failed to send: ' + json.error) }
    setSending(false)
  }

  function handlePrint() { window.print() }

  if (!job) return <div className="p-6">Loading...</div>

  const revenue = Number(job.revenue)
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href={"/jobs/" + id} className="text-gray-500 hover:text-gray-700 text-sm">← Back</Link>
          <h1 className="font-semibold text-gray-900">Invoice</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 flex gap-6">
        <div className="w-72 shrink-0 print:hidden">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Your Details</h2>
            <div><label className="text-gray-500 text-xs">Company Name</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company" /></div>
            <div><label className="text-gray-500 text-xs">Your Email</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="you@company.com" /></div>
            <div><label className="text-gray-500 text-xs">Phone</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="0400 000 000" /></div>
            <div><label className="text-gray-500 text-xs">Invoice Number</label><input className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
            <div><label className="text-gray-500 text-xs">Due Date</label><input type="date" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <hr />
            <h2 className="font-semibold text-gray-900">Send to Client</h2>
            <div><label className="text-gray-500 text-xs">Client Email</label><input type="email" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="client@email.com" /></div>
            {sent && <p className="text-green-600 text-sm font-medium">✅ Invoice sent!</p>}
            <button onClick={handleSendEmail} disabled={sending} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{sending ? 'Sending...' : '📧 Send Invoice'}</button>
            <button onClick={handlePrint} className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium">🖨️ Print / PDF</button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{companyName || 'Your Company'}</h2>
              {companyEmail && <p className="text-gray-500 text-sm">{companyEmail}</p>}
              {companyPhone && <p className="text-gray-500 text-sm">{companyPhone}</p>}
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-blue-600">INVOICE</h1>
              <p className="text-gray-500 text-sm">{invoiceNumber}</p>
              {dueDate && <p className="text-gray-500 text-sm">Due: {dueDate}</p>}
            </div>
          </div>
          <div className="mb-8">
            <p className="text-gray-400 text-xs uppercase mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">{job.client_name || 'Client'}</p>
            <p className="text-gray-500 text-sm">{job.name}</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-gray-500 text-sm font-medium">Description</th>
                <th className="text-right py-2 text-gray-500 text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.length > 0 ? entries.map((e) => (
                <tr key={e.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">{e.description || 'Service'}</td>
                  <td className="py-3 text-right text-gray-900">${Number(e.amount).toLocaleString()}</td>
                </tr>
              )) : (
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">{job.name} - Professional Services</td>
                  <td className="py-3 text-right text-gray-900">${revenue.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="py-4 font-bold text-gray-900">Total</td>
                <td className="py-4 text-right font-bold text-blue-600 text-lg">${revenue.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          <p className="text-gray-400 text-sm mt-8">Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}