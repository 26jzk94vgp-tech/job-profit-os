'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../utils/supabase/client'
import { use } from 'react'

export default function AddEntry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [type, setType] = useState('material')
  const [description, setDescription] = useState('')
  const [workerName, setWorkerName] = useState('')
  const [hours, setHours] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tripFrom, setTripFrom] = useState('')
  const [tripTo, setTripTo] = useState('')
  const [kilometers, setKilometers] = useState('')
  const [atoMethod, setAtoMethod] = useState('cents_per_km')
  const [gstStatus, setGstStatus] = useState('inclusive')
  const [taxCategory, setTaxCategory] = useState('')

  function validatePositive(value: string, field: string) {
    if (value === '' || value === '/') { setErrors(e => { const n = {...e}; delete n[field]; return n }); return true }
    if (!/^\d+(\.\d{0,2})?$/.test(value)) {
      setErrors(e => ({ ...e, [field]: 'Only numbers (up to 2 decimal places) or / allowed.' }))
      return false
    }
    const num = Number(value)
    if (num < 0) {
      setErrors(e => ({ ...e, [field]: 'Value cannot be negative. Use / if unknown.' }))
      return false
    }
    setErrors(e => { const n = {...e}; delete n[field]; return n })
    return true
  }

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const res = await fetch('/api/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64, mediaType: file.type }) })
      const json = await res.json()
      if (json.success) { setDescription(json.data.description || ''); setAmount(json.data.amount?.toString() || ''); setType(json.data.type || 'material') } else { alert('Could not read receipt') }
      setScanning(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const entry: Record<string, unknown> = { job_id: id, owner_id: user?.id, type, description, gst_status: gstStatus, tax_category: taxCategory || null }
    if (type === 'labor') {
      entry.worker_name = workerName
      entry.hours = hours === '/' ? null : Number(hours)
      entry.hourly_rate = hourlyRate === '/' ? null : Number(hourlyRate)
      entry.amount = (hours === '/' || hourlyRate === '/') ? 0 : Number(hours) * Number(hourlyRate)
    } else if (type === 'material') {
      entry.quantity = quantity === '/' ? null : Number(quantity)
      entry.unit = unit || null
      entry.unit_price = unitPrice === '/' ? null : Number(unitPrice)
      entry.amount = (quantity === '/' || unitPrice === '/') ? (amount === '/' ? 0 : Number(amount)) : Number(quantity) * Number(unitPrice)
    } else if (type === 'fuel') {
      entry.trip_from = tripFrom
      entry.trip_to = tripTo
      entry.kilometers = kilometers === '/' ? null : Number(kilometers)
      entry.ato_method = atoMethod
      entry.amount = atoMethod === 'cents_per_km' && kilometers && kilometers !== '/' ? Number(kilometers) * 0.88 : (amount === '/' ? 0 : Number(amount))
    } else {
      entry.amount = amount === '/' ? 0 : Number(amount)
    }
    const { error } = await supabase.from('job_entries').insert(entry)
    if (error) { alert('Error: ' + error.message) } else { window.location.href = '/jobs/' + id }
    setLoading(false)
  }

  const tabs = ['labor', 'material', 'subcontract', 'invoice', 'fuel']
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => window.location.href = "/jobs/" + id} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          <h1 className="font-semibold text-gray-900">Add Entry</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6 cursor-pointer hover:border-blue-400 transition bg-white">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
          {scanning ? <span className="text-blue-500">Scanning receipt...</span> : <span className="text-gray-400">📸 Tap to scan receipt</span>}
        </label>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((t) => (
              <button key={t} onClick={() => setType(t)} className={t === type ? 'px-3 py-2 rounded-lg text-sm font-medium capitalize bg-blue-600 text-white' : 'px-3 py-2 rounded-lg text-sm font-medium capitalize bg-gray-100 text-gray-600'}>{t}</button>
            ))}
          </div>
          <p className="text-gray-400 text-xs mb-4">Tip: Use / for unknown values</p>
          <div className="space-y-4">
            {type === 'labor' ? (
              <div className="space-y-4">
                <div><label className="text-gray-700 text-sm font-medium">Worker Name</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. Tom" value={workerName} onChange={(e) => setWorkerName(e.target.value)} /></div>
                <div><label className="text-gray-700 text-sm font-medium">Hours</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 8 (or /)" value={hours} onChange={(e) => { setHours(e.target.value); validatePositive(e.target.value, 'hours') }} />{errors.hours && <p className="text-red-500 text-xs mt-1">{errors.hours}</p>}</div>
                <div><label className="text-gray-700 text-sm font-medium">Hourly Rate ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 65 (or /)" value={hourlyRate} onChange={(e) => { setHourlyRate(e.target.value); validatePositive(e.target.value, 'hourlyRate') }} />{errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>}</div>
                {hours && hourlyRate && hours !== '/' && hourlyRate !== '/' && <p className="text-green-600 text-sm font-medium">Total: ${(Number(hours) * Number(hourlyRate)).toLocaleString()}</p>}
              </div>
            ) : type === 'material' ? (
              <div className="space-y-4">
                <div><label className="text-gray-700 text-sm font-medium">Description</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. Timber" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="flex gap-3">
                  <div className="flex-1"><label className="text-gray-700 text-sm font-medium">Quantity</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 10 (or /)" value={quantity} onChange={(e) => { setQuantity(e.target.value); validatePositive(e.target.value, 'quantity') }} />{errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}</div>
                  <div className="w-24"><label className="text-gray-700 text-sm font-medium">Unit</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="m/kg" value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
                </div>
                <div><label className="text-gray-700 text-sm font-medium">Unit Price ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 12.50 (or /)" value={unitPrice} onChange={(e) => { setUnitPrice(e.target.value); validatePositive(e.target.value, 'unitPrice') }} />{errors.unitPrice && <p className="text-red-500 text-xs mt-1">{errors.unitPrice}</p>}</div>
                {quantity && unitPrice && quantity !== '/' && unitPrice !== '/' && <p className="text-green-600 text-sm font-medium">Total: ${(Number(quantity) * Number(unitPrice)).toLocaleString()}</p>}
                <div><label className="text-gray-700 text-sm font-medium">Or enter total directly</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 1200 (or /)" value={amount} onChange={(e) => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />{errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}</div>
              </div>
            ) : type === 'fuel' ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm font-medium">🚗 Itinerant Work Vehicle Expense</p>
                  <p className="text-green-600 text-xs mt-1">Travel between job sites is 100% deductible. ATO rate 2024-25: 88c/km</p>
                </div>
                <div><label className="text-gray-700 text-sm font-medium">ATO Calculation Method</label><select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={atoMethod} onChange={(e) => setAtoMethod(e.target.value)}><option value="cents_per_km">Cents per km (88c/km - ATO 2024-25)</option><option value="actual_cost">Actual Cost (fuel receipt)</option></select></div>
                <div><label className="text-gray-700 text-sm font-medium">From</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. Home / Previous job site" value={tripFrom} onChange={(e) => setTripFrom(e.target.value)} /></div>
                <div><label className="text-gray-700 text-sm font-medium">To</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 123 Main St job site" value={tripTo} onChange={(e) => setTripTo(e.target.value)} /></div>
                {atoMethod === 'cents_per_km' ? (
                  <div><label className="text-gray-700 text-sm font-medium">Distance (km)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 25 (or /)" value={kilometers} onChange={(e) => { setKilometers(e.target.value); validatePositive(e.target.value, 'kilometers') }} />{errors.kilometers && <p className="text-red-500 text-xs mt-1">{errors.kilometers}</p>}{kilometers && kilometers !== '/' && <p className="text-green-600 text-sm font-medium mt-1">Deduction: ${(Number(kilometers) * 0.88).toFixed(2)}</p>}</div>
                ) : (
                  <div><label className="text-gray-700 text-sm font-medium">Actual Fuel Cost ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 80 (or /)" value={amount} onChange={(e) => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />{errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}<p className="text-gray-400 text-xs mt-1">Keep your fuel receipt for ATO records</p></div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div><label className="text-gray-700 text-sm font-medium">Description</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder={type === 'invoice' ? 'e.g. Progress payment' : 'e.g. Subcontractor'} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div><label className="text-gray-700 text-sm font-medium">Amount ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 1200 (or /)" value={amount} onChange={(e) => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />{errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}</div>
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div>
                <label className="text-gray-700 text-sm font-medium">GST Status</label>
                <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={gstStatus} onChange={(e) => setGstStatus(e.target.value)}>
                  <option value="inclusive">Inclusive of GST (10%)</option>
                  <option value="exclusive">Exclusive of GST (add 10%)</option>
                  <option value="free">GST Free</option>
                  <option value="unknown">Unknown</option>
                </select>
                {gstStatus === 'inclusive' && <p className="text-gray-400 text-xs mt-1">Amount already includes 10% GST</p>}
                {gstStatus === 'exclusive' && <p className="text-blue-500 text-xs mt-1">GST will be added on top of the amount</p>}
                {gstStatus === 'free' && <p className="text-gray-400 text-xs mt-1">No GST applies (e.g. wages, some fresh food)</p>}
              </div>
              <div>
                <label className="text-gray-700 text-sm font-medium">ATO Tax Category</label>
                <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={taxCategory} onChange={(e) => setTaxCategory(e.target.value)}>
                  <option value="">Select category...</option>
                  <optgroup label="Income"><option value="other_income">Job Revenue / Income</option></optgroup>
                  <optgroup label="Cost of Goods Sold">
                    <option value="cogs_material">Materials (COGS)</option>
                    <option value="cogs_labour">Direct Labour (COGS)</option>
                    <option value="subcontractor">Subcontractor Costs</option>
                  </optgroup>
                  <optgroup label="Business Expenses">
                    <option value="vehicle">Vehicle & Travel</option>
                    <option value="tools_equipment">Tools & Equipment</option>
                    <option value="insurance">Insurance</option>
                    <option value="wages">Wages & Salary</option>
                    <option value="super">Superannuation</option>
                    <option value="other_expense">Other Expense</option>
                  </optgroup>
                </select>
                <p className="text-gray-400 text-xs mt-1">Used for BAS and tax reporting</p>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading || Object.keys(errors).length > 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? 'Saving...' : 'Save Entry'}</button>
          </div>
        </div>
      </main>
    </div>
  )
}