'use client'
import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../utils/supabase/client'

export default function PublicInvoice({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const supabase = createClient()
  const [job, setJob] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, profiles(*)')
        .eq('public_token', token)
        .single()

      if (!jobData) { setNotFound(true); return }
      setJob(jobData)
      setProfile(jobData.profiles)

      const { data: entryData } = await supabase
        .from('job_entries')
        .select('*')
        .eq('job_id', jobData.id)
        .eq('type', 'invoice')

      setEntries(entryData || [])
    }
    load()
  }, [token])

  if (notFound) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-700 mb-2">Invoice Not Found</p>
        <p className="text-gray-400 text-sm">This link may have expired or been removed.</p>
      </div>
    </div>
  )

  if (!job) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  const invoiceEntries = entries
  const subTotal = invoiceEntries.reduce((sum, e) => sum + Number(e.amount), 0)
  const gst = subTotal * 0.1
  const total = subTotal + gst

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-10">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">From</p>
            <p className="font-bold text-xl text-gray-900">{profile?.company_name || 'Your Company'}</p>
            {profile?.company_address && <p className="text-sm text-gray-600 mt-1">{profile.company_address}</p>}
            {profile?.company_email && <p className="text-sm text-gray-600">{profile.company_email}</p>}
            {profile?.company_phone && <p className="text-sm text-gray-600">{profile.company_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-800 tracking-wide">INVOICE</p>
            <p className="text-sm text-gray-600 mt-2">Date: {new Date().toLocaleDateString('en-AU')}</p>
          </div>
        </div>

        {/* Payment Details */}
        {profile?.account_name && (
          <div className="mb-4 bg-blue-50 rounded-lg p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Details</p>
            <p className="text-sm text-gray-700">Account Name: <span className="font-medium">{profile.account_name}</span></p>
            {profile.bsb && <p className="text-sm text-gray-700">BSB: <span className="font-medium">{profile.bsb}</span></p>}
            {profile.account_number && <p className="text-sm text-gray-700">Account No: <span className="font-medium">{profile.account_number}</span></p>}
            {profile.abn && <p className="text-sm text-gray-700">ABN: <span className="font-medium">{profile.abn}</span></p>}
          </div>
        )}

        {/* Bill To */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
          <p className="text-sm font-semibold text-gray-900">{job.client_name || '—'}</p>
          {job.site_address && <p className="text-sm text-gray-600">{job.site_address}</p>}
        </div>

        {/* Items */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border border-gray-400 bg-gray-100">
              <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Description</th>
              <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-16">QTY</th>
              <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold w-24">Unit Price</th>
              <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceEntries.length > 0 ? invoiceEntries.map(e => (
              <tr key={e.id} className="border border-gray-300">
                <td className="border border-gray-300 px-3 py-2 text-sm">{e.description || 'Service'}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-center">{e.quantity || 1}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-right">${(e.unit_price || e.amount).toFixed(2)}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-right">${Number(e.amount).toFixed(2)}</td>
              </tr>
            )) : (
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-3 py-2 text-sm">{job.name} - Professional Services</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-center">1</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-right">${subTotal.toFixed(2)}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm text-right">${subTotal.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <table className="border-collapse">
            <tbody>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-6 py-2 text-sm font-medium">Sub Total:</td>
                <td className="border border-gray-300 px-6 py-2 text-sm text-right w-32">${subTotal.toFixed(2)}</td>
              </tr>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 px-6 py-2 text-sm font-medium">GST (10%):</td>
                <td className="border border-gray-300 px-6 py-2 text-sm text-right">${gst.toFixed(2)}</td>
              </tr>
              <tr className="border border-gray-300 bg-gray-50">
                <td className="border border-gray-300 px-6 py-2 text-sm font-bold">Total Inc. GST:</td>
                <td className="border border-gray-300 px-6 py-2 text-sm font-bold text-right">${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-xs text-gray-400">Generated by CIMO · cimo.app</p>
        </div>
      </div>
    </div>
  )
}
