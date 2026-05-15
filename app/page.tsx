'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../utils/supabase/client'
import Link from 'next/link'

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data } = await supabase.from('job_summary').select('*')
    setJobs(data || [])
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  useEffect(() => { loadData() }, [])

  const totalProfit = jobs.reduce((sum, j) => sum + Number(j.profit), 0)
  const activeJobs = jobs.filter(j => j.status === 'active').length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JP</span>
            </div>
            <span className="font-semibold text-gray-900">Job Profit OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/clients" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Clients</Link>
            <Link href="/quotes" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Quotes</Link>
            <Link href="/reports" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Tax Report</Link>
            <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700 text-sm">Sign Out</button>
            <Link href="/jobs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">+ New Job</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">Total Jobs</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">Active Jobs</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{activeJobs}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">Total Profit</p>
            <p className={totalProfit >= 0 ? 'text-3xl font-bold text-green-600 mt-1' : 'text-3xl font-bold text-red-600 mt-1'}>
              {totalProfit >= 0 ? '+' : '-'}${Math.abs(totalProfit).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Jobs</h2>
          </div>
          {jobs.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-400">No jobs yet.</p>
              <Link href="/jobs/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Create your first job</Link>
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {jobs.map((job: any) => {
              const profit = Number(job.profit)
              const isProfit = profit >= 0
              return (
                <Link href={"/jobs/" + job.id} key={job.id}>
                  <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium text-gray-900">{job.name}</p>
                      <p className="text-gray-500 text-sm">{job.client_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={isProfit ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                        {isProfit ? '+' : '-'}${Math.abs(profit).toLocaleString()}
                      </p>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{job.status}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}