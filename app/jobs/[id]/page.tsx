import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: job } = await supabase.from('job_summary').select('*').eq('id', id).single()
  const { data: entries } = await supabase.from('job_entries').select('*').eq('job_id', id).order('created_at', { ascending: false })
  if (!job) return <div className="text-white p-6">Job not found</div>
  const revenue = Number(job.revenue)
  const labor = Number(job.labor_cost)
  const material = Number(job.material_cost)
  const subcontract = Number(job.subcontract_cost)
  const profit = Number(job.profit)
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-white">Back</Link>
          <h1 className="text-2xl font-bold">{job.name}</h1>
        </div>
        <p className="text-gray-400 mb-6">{job.client_name}</p>
        <div className="bg-gray-900 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex justify-between"><span className="text-gray-400">Revenue</span><span className="text-green-400">{revenue}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Labor</span><span className="text-red-400">-{labor}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Materials</span><span className="text-red-400">-{material}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Subcontract</span><span className="text-red-400">-{subcontract}</span></div>
          <div className="border-t border-gray-700 pt-3 flex justify-between">
            <span className="font-bold">Profit</span>
            <span className={profit >= 0 ? 'font-bold text-lg text-green-400' : 'font-bold text-lg text-red-400'}>{profit} ({margin}%)</span>
          </div>
        </div>
        <Link href={'/jobs/' + id + '/add'} className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-center mb-6">+ Add Entry</Link>
        <div className="space-y-3">
          {entries?.map((entry) => (
            <div key={entry.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded-full uppercase">{entry.type}</span>
                  <p className="mt-1">{entry.description || entry.worker_name || entry.type}</p>
                  <p className="text-gray-400 text-sm">{entry.entry_date}</p>
                </div>
                <span className="text-red-400 font-medium">-{entry.type === 'labor' ? (Number(entry.hours) * Number(entry.hourly_rate)).toLocaleString() : Number(entry.amount).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}