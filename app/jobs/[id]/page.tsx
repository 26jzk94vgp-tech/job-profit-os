import { createClient } from '../../../utils/supabase/server'
import Link from 'next/link'

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase.from('job_summary').select('*').eq('id', id).single()
  const { data: entries } = await supabase.from('job_entries').select('*').eq('job_id', id).order('created_at', { ascending: false })

  if (!job) return <div className="p-6">Job not found</div>

  const revenue = Number(job.revenue)
  const labor = Number(job.labor_cost)
  const material = Number(job.material_cost)
  const subcontract = Number(job.subcontract_cost)
  const profit = Number(job.profit)
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Home</Link>
            <h1 className="font-semibold text-gray-900">{job.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={'/jobs/' + id + '/invoice'} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">🧾 Invoice</Link>
            <Link href={'/jobs/' + id + '/add'} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">+ Add Entry</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-gray-500 mb-6">{job.client_name}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">${revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">Profit</p>
            <p className={profit >= 0 ? 'text-2xl font-bold text-green-600 mt-1' : 'text-2xl font-bold text-red-600 mt-1'}>${profit.toLocaleString()} ({margin}%)</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Cost Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-3 flex justify-between"><span className="text-gray-600">Labor</span><span className="text-red-500">-${labor.toLocaleString()}</span></div>
            <div className="px-6 py-3 flex justify-between"><span className="text-gray-600">Materials</span><span className="text-red-500">-${material.toLocaleString()}</span></div>
            <div className="px-6 py-3 flex justify-between"><span className="text-gray-600">Subcontract</span><span className="text-red-500">-${subcontract.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Entries</h2>
          </div>
          {!entries?.length && <div className="px-6 py-8 text-center text-gray-400">No entries yet.</div>}
          <div className="divide-y divide-gray-100">
            {entries?.map((entry: any) => (
              <div key={entry.id} className="px-6 py-4 flex justify-between items-start">
                <div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase">{entry.type}</span>
                  <p className="text-gray-900 mt-1">{entry.description || entry.worker_name || entry.type}</p>
                  <p className="text-gray-400 text-sm">{entry.entry_date}</p>
                </div>
                <span className="text-red-500 font-medium">
                  -${entry.type === 'labor' ? (Number(entry.hours) * Number(entry.hourly_rate)).toLocaleString() : Number(entry.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}