'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'

export default function HomeOffice() {
  const supabase = createClient()
  const [logs, setLogs] = useState<any[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const RATE_PER_HOUR = 0.67 // ATO 2024-25 rate

  async function loadLogs() {
    const { data } = await supabase
      .from('home_office_logs')
      .select('*')
      .order('log_date', { ascending: false })
    setLogs(data || [])
  }

  async function handleAdd() {
    if (!hours) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('home_office_logs').insert({
      owner_id: user?.id,
      log_date: date,
      hours: Number(hours),
      description
    })
    if (error) { alert('Error: ' + error.message) } else {
      setHours('')
      setDescription('')
      loadLogs()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('home_office_logs').delete().eq('id', id)
    loadLogs()
  }

  useEffect(() => { loadLogs() }, [])

  const totalHours = logs.reduce((sum, l) => sum + Number(l.hours), 0)
  const totalDeduction = totalHours * RATE_PER_HOUR

  // 按月分组
  const byMonth: Record<string, { hours: number, logs: any[] }> = {}
  logs.forEach(l => {
    const key = new Date(l.log_date).toLocaleString('en-AU', { month: 'long', year: 'numeric' })
    if (!byMonth[key]) byMonth[key] = { hours: 0, logs: [] }
    byMonth[key].hours += Number(l.hours)
    byMonth[key].logs.push(l)
  })
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← 首页 / Home</Link>
            <h1 className="font-semibold text-gray-900">家庭办公室 / Home Office</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-blue-800 font-medium text-sm">💡 ATO Fixed Rate Method 2024-25</p>
          <p className="text-blue-600 text-xs mt-1">每小时记录在家工作的时间，ATO 标准扣除率为 67分/小时。适用于报税、做账、处理发票等在家工作时间。/ Record hours working from home. ATO allows 67c/hour deduction for eligible home office expenses.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">今年总工时 / Total Hours</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">可抵扣金额 / Total Deduction</p>
            <p className="text-3xl font-bold text-green-600 mt-1">${totalDeduction.toFixed(2)}</p>
            <p className="text-gray-400 text-xs mt-1">@ 67c/hr</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">记录工时 / Add Hours</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-gray-700 text-sm font-medium">日期 / Date</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="w-32">
                <label className="text-gray-700 text-sm font-medium">工时 / Hours</label>
                <input type="number" step="0.5" min="0" max="24" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 2" value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">描述 / Description</label>
              <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 处理发票和报价单 / Processing invoices and quotes" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {hours && <p className="text-green-600 text-sm">可抵扣 / Deduction: ${(Number(hours) * RATE_PER_HOUR).toFixed(2)}</p>}
            <button onClick={handleAdd} disabled={loading || !hours} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
              {loading ? '保存中...' : '添加记录 / Add Entry'}
            </button>
          </div>
        </div>

        {Object.entries(byMonth).map(([month, data]) => (
          <div key={month} className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">{month}</h3>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">{data.hours.toFixed(1)}h</p>
                <p className="text-xs text-green-600">${(data.hours * RATE_PER_HOUR).toFixed(2)}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {data.logs.map((log: any) => (
                <div key={log.id} className="px-6 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-gray-900 text-sm">{log.log_date} — {log.hours}h</p>
                    {log.description && <p className="text-gray-400 text-xs">{log.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-sm">${(Number(log.hours) * RATE_PER_HOUR).toFixed(2)}</span>
                    <button onClick={() => handleDelete(log.id)} className="text-red-400 text-xs hover:text-red-600">删除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center text-gray-400">
            还没有记录 / No entries yet. Start tracking your home office hours!
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <p className="text-yellow-800 font-medium text-sm">⚠️ ATO 要求 / ATO Requirements</p>
          <p className="text-yellow-600 text-xs mt-1">使用 Fixed Rate Method 需要保留记录证明您在家工作的时间。本页面的记录可以作为您的工时日志。/ Using the Fixed Rate Method requires you to keep records of actual hours worked from home. This log serves as your evidence.</p>
        </div>

      </main>
    </div>
  )
}