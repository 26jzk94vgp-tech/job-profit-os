'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Jobs() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [jobs, setJobs] = useState<any[]>([])
  const [sortBy, setSortBy] = useState('date')
  const [search, setSearch] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    const { data } = await supabase.from('job_summary').select('*').order('created_at', { ascending: false })
    setJobs(data || [])
  }

  function sortJobs(jobList: any[]) {
    return [...jobList].sort((a: any, b: any) => {
      if (sortBy === 'profit') return Number(b.profit) - Number(a.profit)
      if (sortBy === 'revenue') return Number(b.revenue) - Number(a.revenue)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  function statusLabel(status: string) {
    if (lang === 'zh') {
      const labels: Record<string, string> = { active: '进行中', completed: '已完成', paused: '暂停', archived: '归档' }
      return labels[status] || status
    }
    const labels: Record<string, string> = { active: 'Active', completed: 'Completed', paused: 'Paused', archived: 'Archived' }
    return labels[status] || status
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const visibleIds = filtered.filter(j => !['archived'].includes(j.status)).map(j => j.id)
    if (selected.size === visibleIds.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visibleIds))
    }
  }

  function exitBulkMode() {
    setBulkMode(false)
    setSelected(new Set())
    setConfirmDelete(false)
  }

  async function bulkUpdateStatus(status: string) {
    if (selected.size === 0) return
    setBulkLoading(true)
    await Promise.all([...selected].map(id => supabase.from('jobs').update({ status }).eq('id', id)))
    await loadJobs()
    exitBulkMode()
    setBulkLoading(false)
  }

  async function bulkDelete() {
    if (selected.size === 0) return
    setBulkLoading(true)
    await Promise.all([...selected].map(id => supabase.from('jobs').delete().eq('id', id)))
    await loadJobs()
    exitBulkMode()
    setBulkLoading(false)
  }

  const filtered = jobs.filter(j => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return j.name?.toLowerCase().includes(q) || j.client_name?.toLowerCase().includes(q)
  })

  const activeJobs = sortJobs(filtered.filter(j => ['active', 'paused'].includes(j.status)))
  const completedJobs = sortJobs(filtered.filter(j => j.status === 'completed'))
  const visibleIds = filtered.filter(j => !['archived'].includes(j.status)).map(j => j.id)
  const allSelected = visibleIds.length > 0 && selected.size === visibleIds.length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← {lang==="zh"?"返回主页":"Back"}</Link>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '工单列表' : 'Jobs'}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()) }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${bulkMode ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {bulkMode ? (lang === 'zh' ? '退出批量' : 'Cancel') : (lang === 'zh' ? '批量操作' : 'Select')}
            </button>
            <Link href="/jobs/new" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              + {lang === 'zh' ? '新建工单' : 'New Job'}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-16 pb-6 md:pt-6 space-y-4">
        <div className="md:hidden flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 dark:text-white text-lg">{lang === 'zh' ? '工单列表' : 'Jobs'}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${bulkMode ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
            >
              {bulkMode ? (lang === 'zh' ? '退出' : 'Cancel') : (lang === 'zh' ? '批量' : 'Select')}
            </button>
            <Link href="/jobs/new" className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
              + {lang === 'zh' ? '新建' : 'New'}
            </Link>
          </div>
        </div>

        {/* 批量操作工具栏 */}
        {bulkMode && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">
            {/* 全选 */}
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                {allSelected && <span className="text-white text-xs">✓</span>}
              </div>
              {lang === 'zh' ? '全选' : 'All'}
            </button>

            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selected.size} {lang === 'zh' ? '已选' : 'selected'}
            </span>

            {selected.size > 0 && (
              <>
                <div className="flex-1" />
                {/* 改状态 */}
                <button
                  onClick={() => bulkUpdateStatus('active')}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors disabled:opacity-50"
                >
                  → {lang === 'zh' ? '进行中' : 'Active'}
                </button>
                <button
                  onClick={() => bulkUpdateStatus('completed')}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors disabled:opacity-50"
                >
                  → {lang === 'zh' ? '已完成' : 'Completed'}
                </button>
                <button
                  onClick={() => bulkUpdateStatus('archived')}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  📦 {lang === 'zh' ? '归档' : 'Archive'}
                </button>
                {/* 删除 */}
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={bulkLoading}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    🗑 {lang === 'zh' ? '删除' : 'Delete'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl px-3 py-1.5">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {lang === 'zh' ? `确认删除 ${selected.size} 个工单？` : `Delete ${selected.size} jobs?`}
                    </span>
                    <button
                      onClick={bulkDelete}
                      disabled={bulkLoading}
                      className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 disabled:opacity-50"
                    >
                      {lang === 'zh' ? '确认' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {lang === 'zh' ? '取消' : 'Cancel'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 搜索框 */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'zh' ? '搜索工单名称或客户...' : 'Search jobs or clients...'}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/40 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs">✕</button>
          )}
        </div>

        {/* 排序 + 计数 */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400 dark:text-gray-500 text-xs">
            {search
              ? `${filtered.filter(j => !['archived'].includes(j.status)).length} ${lang === 'zh' ? '个结果' : 'results'}`
              : `${jobs.filter(j => !['archived'].includes(j.status)).length} ${lang === 'zh' ? '个工单' : 'jobs'}`
            }
          </p>
          <select
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">{lang === 'zh' ? '最新创建' : 'Newest First'}</option>
            <option value="profit">{lang === 'zh' ? '按利润' : 'By Profit'}</option>
            <option value="revenue">{lang === 'zh' ? '按收入' : 'By Revenue'}</option>
          </select>
        </div>

        {/* 无结果 */}
        {search && filtered.filter(j => !['archived'].includes(j.status)).length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 px-6 py-12 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {lang === 'zh' ? `没有找到"${search}"相关工单` : `No jobs found for "${search}"`}
            </p>
            <button onClick={() => setSearch('')} className="mt-3 text-blue-500 text-sm">{lang === 'zh' ? '清除搜索' : 'Clear search'}</button>
          </div>
        )}

        {/* 空状态 */}
        {!search && jobs.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 px-6 py-16 text-center">
            <p className="text-gray-400 dark:text-gray-500 mb-4">{lang === 'zh' ? '还没有工单' : 'No jobs yet.'}</p>
            <Link href="/jobs/new" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">{lang === 'zh' ? '新建工单' : 'New Job'}</Link>
          </div>
        )}

        {/* 进行中 */}
        {activeJobs.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {lang === 'zh' ? '进行中' : 'Active'} ({activeJobs.length})
              </p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {activeJobs.map((job: any) => {
                const profit = Number(job.profit)
                const isSelected = selected.has(job.id)
                return (
                  <div
                    key={job.id}
                    className={`flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    {bulkMode && (
                      <button onClick={() => toggleSelect(job.id)} className="mr-4 shrink-0">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      </button>
                    )}
                    <Link href={'/jobs/' + job.id} className="flex-1 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {search ? highlight(job.name, search) : job.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          {search ? highlight(job.client_name, search) : job.client_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={profit >= 0 ? 'font-semibold text-[#30D158]' : 'font-semibold text-[#FF453A]'}>
                          {profit >= 0 ? '+' : '-'}${Math.abs(profit).toLocaleString()}
                        </p>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          {statusLabel(job.status)}
                        </span>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 已完成 */}
        {completedJobs.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-green-50 dark:bg-green-900/20 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">
                {lang === 'zh' ? '已完成' : 'Completed'} ({completedJobs.length})
              </p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {completedJobs.map((job: any) => {
                const profit = Number(job.profit)
                const unpaid = Number(job.unpaid_amount || 0)
                const isSelected = selected.has(job.id)
                return (
                  <div
                    key={job.id}
                    className={`flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${unpaid > 0 && !isSelected ? 'border-l-4 border-[#FF453A]' : ''}`}
                  >
                    {bulkMode && (
                      <button onClick={() => toggleSelect(job.id)} className="mr-4 shrink-0">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      </button>
                    )}
                    <Link href={'/jobs/' + job.id} className={`flex-1 flex justify-between items-center ${!isSelected && unpaid === 0 ? 'opacity-80' : ''}`}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {search ? highlight(job.name, search) : job.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          {search ? highlight(job.client_name, search) : job.client_name}
                        </p>
                        {unpaid > 0 && (
                          <p className="text-[#FF453A] text-xs">
                            💰 {lang === 'zh' ? `未收 $${unpaid.toLocaleString()}` : `Unpaid $${unpaid.toLocaleString()}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={profit >= 0 ? 'font-semibold text-[#30D158]' : 'font-semibold text-[#FF453A]'}>
                          {profit >= 0 ? '+' : '-'}${Math.abs(profit).toLocaleString()}
                        </p>
                        <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                          {statusLabel(job.status)}
                        </span>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 归档入口 */}
        <Link
          href="/archive"
          className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📦</span>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-200 text-sm">{lang === 'zh' ? '工单历史' : 'Job History'}</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">{lang === 'zh' ? '查看已归档和已暂停的工单' : 'View archived and paused jobs'}</p>
            </div>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-sm">→</span>
        </Link>
      </main>
    </div>
  )
}

function highlight(text: string, query: string) {
  if (!text || !query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-700/60 text-gray-900 dark:text-white rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
