'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../../../utils/supabase/client'
import { use } from 'react'

export default function EditEntry({ params }: { params: Promise<{ id: string, entryId: string }> }) {
  const { id, entryId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [entry, setEntry] = useState<any>(null)
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [workerName, setWorkerName] = useState('')
  const [hours, setHours] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [tripFrom, setTripFrom] = useState('')
  const [tripTo, setTripTo] = useState('')
  const [kilometers, setKilometers] = useState('')
  const [atoMethod, setAtoMethod] = useState('cents_per_km')
  const [gstStatus, setGstStatus] = useState('inclusive')
  const [taxCategory, setTaxCategory] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('job_entries').select('*').eq('id', entryId).single().then(({ data }) => {
      if (data) {
        setEntry(data)
        setType(data.type || '')
        setDescription(data.description || '')
        setWorkerName(data.worker_name || '')
        setHours(data.hours?.toString() || '')
        setHourlyRate(data.hourly_rate?.toString() || '')
        setAmount(data.amount?.toString() || '')
        setQuantity(data.quantity?.toString() || '')
        setUnit(data.unit || '')
        setUnitPrice(data.unit_price?.toString() || '')
        setTripFrom(data.trip_from || '')
        setTripTo(data.trip_to || '')
        setKilometers(data.kilometers?.toString() || '')
        setAtoMethod(data.ato_method || 'cents_per_km')
        setGstStatus(data.gst_status || 'inclusive')
        setTaxCategory(data.tax_category || '')
      }
    })
  }, [entryId])

  async function handleSubmit() {
    setLoading(true)
    const update: Record<string, unknown> = { description, gst_status: gstStatus, tax_category: taxCategory || null }
    if (type === 'labor') {
      update.worker_name = workerName
      update.hours = Number(hours)
      update.hourly_rate = Number(hourlyRate)
      update.amount = Number(hours) * Number(hourlyRate)
    } else if (type === 'material') {
      update.quantity = quantity ? Number(quantity) : null
      update.unit = unit || null
      update.unit_price = unitPrice ? Number(unitPrice) : null
      update.amount = quantity && unitPrice ? Number(quantity) * Number(unitPrice) : Number(amount)
    } else if (type === 'fuel') {
      update.trip_from = tripFrom
      update.trip_to = tripTo
      update.kilometers = kilometers ? Number(kilometers) : null
      update.ato_method = atoMethod
      update.amount = atoMethod === 'cents_per_km' && kilometers ? Number(kilometers) * 0.88 : Number(amount)
    } else {
      update.amount = Number(amount)
    }
    const { error } = await supabase.from('job_entries').update(update).eq('id', entryId)
    if (error) { alert('Error: ' + error.message) } else { window.location.href = '/jobs/' + id }
    setLoading(false)
  }

  if (!entry) return <div className="p-6 text-gray-500">Loading...</div>
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          <h1 className="font-semibold text-gray-900">Edit Entry</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full uppercase">{type}</span>
          </div>
          {type === 'labor' && (
            <div className="space-y-4">
              <div><label className="text-gray-700 text-sm font-medium">Worker Name</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={workerName} onChange={(e) => setWorkerName(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">Hours</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">Hourly Rate ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} /></div>
              {hours && hourlyRate && <p className="text-green-600 text-sm">Total: ${(Number(hours) * Number(hourlyRate)).toLocaleString()}</p>}
            </div>
          )}
          {type === 'material' && (
            <div className="space-y-4">
              <div><label className="text-gray-700 text-sm font-medium">Description</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-gray-700 text-sm font-medium">Quantity</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
                <div className="w-24"><label className="text-gray-700 text-sm font-medium">Unit</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
              </div>
              <div><label className="text-gray-700 text-sm font-medium">Unit Price ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">Or total amount ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            </div>
          )}
          {type === 'fuel' && (
            <div className="space-y-4">
              <div><label className="text-gray-700 text-sm font-medium">ATO Method</label><select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={atoMethod} onChange={(e) => setAtoMethod(e.target.value)}><option value="cents_per_km">Cents per km (88c/km)</option><option value="actual_cost">Actual Cost</option></select></div>
              <div><label className="text-gray-700 text-sm font-medium">From</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={tripFrom} onChange={(e) => setTripFrom(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">To</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={tripTo} onChange={(e) => setTripTo(e.target.value)} /></div>
              {atoMethod === 'cents_per_km' ? (
                <div><label className="text-gray-700 text-sm font-medium">Distance (km)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={kilometers} onChange={(e) => setKilometers(e.target.value)} />{kilometers && <p className="text-green-600 text-sm mt-1">Deduction: ${(Number(kilometers) * 0.88).toFixed(2)}</p>}</div>
              ) : (
                <div><label className="text-gray-700 text-sm font-medium">Actual Cost ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              )}
            </div>
          )}
          {(type === 'subcontract' || type === 'invoice') && (
            <div className="space-y-4">
              <div><label className="text-gray-700 text-sm font-medium">Description</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">Amount ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            </div>
          )}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div><label className="text-gray-700 text-sm font-medium">GST Status</label><select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={gstStatus} onChange={(e) => setGstStatus(e.target.value)}><option value="inclusive">Inclusive of GST (10%)</option><option value="exclusive">Exclusive of GST</option><option value="free">GST Free</option><option value="unknown">Unknown</option></select></div>
            <div><label className="text-gray-700 text-sm font-medium">ATO Tax Category</label><select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={taxCategory} onChange={(e) => setTaxCategory(e.target.value)}><option value="">Select category...</option><optgroup label="Income"><option value="other_income">Job Revenue / Income</option></optgroup><optgroup label="Cost of Goods Sold"><option value="cogs_material">Materials (COGS)</option><option value="cogs_labour">Direct Labour (COGS)</option><option value="subcontractor">Subcontractor Costs</option></optgroup><optgroup label="Business Expenses"><option value="vehicle">Vehicle & Travel</option><option value="tools_equipment">Tools & Equipment</option><option value="insurance">Insurance</option><option value="wages">Wages & Salary</option><option value="super">Superannuation</option><option value="other_expense">Other Expense</option></optgroup></select></div>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </main>
    </div>
  )
}