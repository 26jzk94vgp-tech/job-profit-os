'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [companyName, setCompanyName] = useState('Your Company Name')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    supabase.from('job_summary').select('*').eq('id', id).single().then(({ data }) => setJob(data))
    supabase.from('job_entries').select('*').eq('job_id', id).eq('type', 'invoice').then(({ data }) => setEntries(data || []))
  }, [id])

  function handlePrint() {
    window.print()
  }
  if (!job) return <div className="text-white p-6">Loading...</div>

  const revenue = Number(job.revenue)
  const labor = Number(job.labor_cost)
  const material = Number(job.material_cost)
  const subcontract = Number(job.subcontract_cost)
  const totalCost = labor + material + subcontract
  const profit = Number(job.profit)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto p-6 print:hidden">
        <div className="flex items-center gap-3 mb-6"><a href={"javascript:history.back()"} className="text-gray-400">← Back</a><h1 className="text-2xl font-bold">Invoice Preview</h1></div>
        <div className="space-y-3 mb-6">
          <div><label className="text-gray-400 text-sm">Company Name</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
          <div><label className="text-gray-400 text-sm">Phone</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="0400 000 000" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} /></div>
          <div><label className="text-gray-400 text-sm">Email</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="info@company.com" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} /></div>
          <div><label className="text-gray-400 text-sm">Invoice Number</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
          <div><label className="text-gray-400 text-sm">Due Date</label><input type="date" className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        </div>
        <button onClick={handlePrint} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium mb-4">🖨️ Print / Save as PDF</button>
      </div>

      <div className="max-w-2xl mx-auto p-8 bg-white text-gray-900 print:p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{companyName}</h2>
            {companyPhone && <p className="text-gray-600">{companyPhone}</p>}
            {companyEmail && <p className="text-gray-600">{companyEmail}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-blue-600">INVOICE</h1>
            <p className="text-gray-600">{invoiceNumber}</p>
            {dueDate && <p className="text-gray-600">Due: {dueDate}</p>}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-gray-500 text-sm uppercase mb-1">Bill To</h3>
          <p className="font-semibold">{job.client_name || 'Client Name'}</p>
          <p className="text-gray-600">{job.name}</p>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-gray-600">Description</th>
              <th className="text-right py-2 text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? entries.map((e) => (
              <tr key={e.id} className="border-b border-gray-100">
                <td className="py-3">{e.description || 'Service'}</td>
                <td className="py-3 text-right">${Number(e.amount).toLocaleString()}</td>
              </tr>
            )) : (
              <tr className="border-b border-gray-100">
                <td className="py-3">{job.name} - Professional Services</td>
                <td className="py-3 text-right">${revenue.toLocaleString()}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold text-lg">
              <td className="py-4">Total</td>
              <td className="py-4 text-right text-blue-600">${revenue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div className="border-t pt-4 text-gray-500 text-sm">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}