import { supabase } from './lib/supabase'
import Link from 'next/link'

export default async function Home() {
  const { data: jobs } = await supabase.from('job_summary').select('*')

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Job Profit OS</h1>
          <Link href="/jobs/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + New Job
          </Link>
        </div>
        {jobs?.length === 0 && (
          <p className="text-gray-400 text-center mt-20">No jobs yet. Create your first job!</p>
        )}
        <div className="space-y-3">
          {jobs?.map((job) => {
            const profit = Number(job.profit)
            const isProfit = profit >= 0
            return (
              <Link href={`/jobs/${job.id}`} key={job.id}>
                <div className="bg-gray-900 rounded-xl p-4 flex justify-between items-center hover:bg-gray-800 transition">
                  <div>
                    <p className="font-semibold">{job.name}</p>
                    <p className="text-gray-400 text-sm">{job.client_name}</p>
                  </div>
                  <span className={`font-bold text-lg ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : '-'}${Math.abs(profit).toLocaleString()}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
