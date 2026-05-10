'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { use } from 'react'

export default function AddEntry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [type, setType] = useState('material')
  const [description, setDescription] = useState('')
  const [workerName, setWorkerName] = useState('')
  const [hours, setHours] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const mediaType = file.type
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const json = await res.json()
      if (json.success) {
        setDescription(json.data.description || '')
        setAmount(json.data.amount?.toString() || '')
        setType(json.data.type || 'material')
      } else {
        alert('Could not read receipt, please enter manually')
      }
      setScanning(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    setLoading(true)
    const entry: Record<string, unknown> = { job_id: id, owner_id: '00000000-0000-0000-0000-000000000000', type, description }
    if (type === 'labor') {
      entry.worker_name = workerName
      entry.hours = Number(hours)
      entry.hourly_rate = Number(hourlyRate)
      entry.amount = Number(hours) * Number(hourlyRate)
    } else {
      entry.amount = Number(amount)
    }
    const { error } = await supabase.from('job_entries').insert(entry)
    if (error) { alert('Error: ' + error.message) } else { router.push('/jobs/' + id) }
    setLoading(false)
  }

  const tabs = ['labor', 'material', 'subcontract', 'invoice']
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400">Back</button>
          <h1 className="text-2xl font-bold">Add Entry</h1>
        </div>
        <label className="flex items-center justify-center w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 mb-6 cursor-pointer hover:border-blue-500 transition">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
          {scanning ? <span className="text-blue-400">Scanning receipt...</span> : <span className="text-gray-400">📸 Tap to scan receipt</span>}
        </label>
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button key={t} onClick={() => setType(t)} className={t === type ? 'flex-1 py-2 rounded-lg text-sm bg-blue-600 text-white' : 'flex-1 py-2 rounded-lg text-sm bg-gray-800 text-gray-400'}>{t}</button>
          ))}
        </div>
        <div className="space-y-4">
          {type === 'labor' ? (
            <div className="space-y-4">
              <div><label className="text-gray-400 text-sm">Worker Name</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="e.g. Tom" value={workerName} onChange={(e) => setWorkerName(e.target.value)} /></div>
              <div><label className="text-gray-400 text-sm">Hours</label><input type="number" className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="e.g. 8" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
              <div><label className="text-gray-400 text-sm">Hourly Rate</label><input type="number" className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="e.g. 65" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} /></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div><label className="text-gray-400 text-sm">Description</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="e.g. Timber supply" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div><label className="text-gray-400 text-sm">Amount</label><input type="number" className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="e.g. 1200" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? 'Saving...' : 'Save Entry'}</button>
        </div>
      </div>
    </main>
  )
}