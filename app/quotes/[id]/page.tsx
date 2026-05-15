'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../utils/supabase/client'
import Link from 'next/link'

export default function QuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [quote, setQuote] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

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

  async function convertToInvoice() {
    if (!quote?.job_id) { alert('This quote has no associated job. Please link a job first.'); return }
    setLoading(true)
    const invoiceItems = items.map(item => ({
      job_id: quote.job_id,
      owner_id: quote.owner_id,
      type: 'invoice',
      description: item.description + (item.area ? ' - ' + item.area : ''),
      quantity: Number(item.quantity),
      unit: item.item_unit,
      unit_price: Number(item.unit_price),
      amount: Number(item.quantity) * Number(item.unit_price),
      gst_status: 'exclusive',
      tax_category: 'other_income'
    }))
    const { error } = await supabase.from('job_entries').insert(invoiceItems)
    if (error) { alert('Error: ' + error.message) } else {
      await supabase.from('quotes').update({ status: 'accepted' }).eq('id', id)
      alert('Quote converted to invoice entries!')
      window.location.href = '/jobs/' + quote.job_id
    }
    setLoading(false)
  }

  if (!quote) return <div className="p-6">Loading...</div>

  const subTotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0)
  const gst = subTotal * 0.1
  const totalIncGst = subTotal + gst
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6 print:hidden space-y-3">
        <div className="flex items-center gap-3">
          <a href="/quotes" className="text-gray-500 hover:text-gray-700 text-sm">← Back</a>
          <h1 className="font-semibold text-gray-900">Quote Detail</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 flex-wrap">
          <span className="text-sm text-gray-500">Status:</span>
          {['draft','sent','accepted','declined'].map(s => (
            <button key={s} onClick={() => updateStatus(s)} className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${quote.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{s}</button>
          ))}
          <button onClick={() => window.print()} className="ml-auto px-4 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">🖨️ Print / PDF</button>
          {quote.job_id && (
            <button onClick={convertToInvoice} disabled={loading} className="px-4 py-1 rounded-lg text-xs font-medium bg-green-600 text-white disabled:opacity-50">
              {loading ? 'Converting...' : '✅ Convert to Invoice'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm print:p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{profile?.company_name || 'Your Company'}</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">{profile?.company_name || 'Your Company'}</p>
            {profile?.company_phone && <p>{profile.company_phone}</p>}
            {profile?.company_email && <p className="text-blue-600">{profile.company_email}</p>}
          </div>
        </div>

        <table className="w-full border-collapse mb-0 text-sm">
          <tbody>
            <tr className="border border-gray-300">
              <td className="border border-gray-300 px-3 py-1 w-28 text-gray-500">Quote No.</td>
              <td className="border border-gray-300 px-3 py-1 font-medium">{quote.quote_number || 'Q-001'}</td>
              <td className="border border-gray-300 px-3 py-1 w-28 text-gray-500">Date</td>
              <td className="border border-gray-300 px-3 py-1">{quote.quote_date || new Date().toLocaleDateString('en-AU')}</td>
            </tr>
            <tr className="border border-gray-300">
              <td className="border border-gray-300 px-3 py-1 text-gray-500">Type</td>
              <td className="border border-gray-300 px-3 py-1 font-medium">{quote.quote_type || 'Residential'}</td>
              <td className="border border-gray-300 px-3 py-1 text-gray-500">Builder</td>
              <td className="border border-gray-300 px-3 py-1">{quote.builder_name || ''}</td>
            </tr>
            <tr className="border border-gray-300">
              <td className="border border-gray-300 px-3 py-1 text-gray-500">Address</td>
              <td colSpan={3} className="border border-gray-300 px-3 py-1">{quote.site_address || quote.jobs?.name || ''}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse text-sm mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-2 text-left">Description</th>
              <th className="border border-gray-400 px-2 py-2 text-left">Area</th>
              <th className="border border-gray-400 px-2 py-2 text-left w-16">Code</th>
              <th className="border border-gray-400 px-2 py-2 text-left">Name</th>
              <th className="border border-gray-400 px-2 py-2 text-left w-16">Type</th>
              <th className="border border-gray-400 px-2 py-2 text-left w-12">Unit</th>
              <th className="border border-gray-400 px-2 py-2 text-right w-12">Qty</th>
              <th className="border border-gray-400 px-2 py-2 text-right w-24">Rate</th>
              <th className="border border-gray-400 px-2 py-2 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border border-gray-300">
                <td className="border border-gray-300 px-2 py-1">{item.description}</td>
                <td className="border border-gray-300 px-2 py-1 font-medium">{item.area || ''}</td>
                <td className="border border-gray-300 px-2 py-1">{item.code || ''}</td>
                <td className="border border-gray-300 px-2 py-1">{item.item_name || ''}</td>
                <td className="border border-gray-300 px-2 py-1">{item.item_type || ''}</td>
                <td className="border border-gray-300 px-2 py-1">{item.item_unit || ''}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{item.quantity}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">${Number(item.unit_price).toFixed(2)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-2">
          <table className="border-collapse text-sm">
            <tbody>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-6 py-1 font-medium">Sub-Total</td>
                <td className="border border-gray-300 px-6 py-1 text-right w-32">${subTotal.toFixed(2)}</td>
              </tr>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-6 py-1 font-medium">GST</td>
                <td className="border border-gray-300 px-6 py-1 text-right">${gst.toFixed(2)}</td>
              </tr>
              <tr className="border border-gray-300 bg-blue-50">
                <td className="border border-gray-300 px-6 py-1 font-bold">Total Inc GST</td>
                <td className="border border-gray-300 px-6 py-1 font-bold text-right">${totalIncGst.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {quote.scope_of_work && (
          <div className="mt-6 border border-gray-300 p-4">
            <p className="font-bold text-sm mb-2">General Scope of Work:</p>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{quote.scope_of_work}</pre>
          </div>
        )}

        {quote.notes && (
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium">Note: {quote.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}