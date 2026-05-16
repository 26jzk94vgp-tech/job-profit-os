'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../utils/supabase/client'
import Link from 'next/link'
import { useLanguage, LangToggle } from '../lib/i18n/LanguageContext'
import { formatDate } from '../lib/utils'

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [badDebts, setBadDebts] = useState<any[]>([])
  const [showPricingBanner, setShowPricingBanner] = useState(true)
  const [showImportTip, setShowImportTip] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const { t, lang } = useLanguage()

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data: jobData } = await supabase.from('job_summary').select('*')
    setJobs(jobData || [])
    const { data: entryData } = await supabase
      .from('job_entries')
      .select('*, jobs(name)')
      .in('type', ['invoice', 'material', 'subcontract'])
    setEntries(entryData || [])
    const { data: overdueData } = await supabase
      .from('overdue_invoices')
      .select('*')
    setBadDebts(overdueData || [])
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  useEffect(() => { loadData() }, [])

  const totalProfit = jobs.reduce((sum, j) => sum + Number(j.profit), 0)
  const activeJobs = jobs.filter(j => j.status === 'active').length

  // 应收账款 - 未付发票
  const unpaidInvoices = entries.filter(e => e.type === 'invoice' && e.payment_status !== 'paid')
  const totalReceivable = unpaidInvoices.reduce((sum, e) => sum + Number(e.amount), 0)
  const overdueInvoices = unpaidInvoices.filter(e => e.payment_due_date && new Date(e.payment_due_date) < new Date())

  // Super 供款提醒
  const SUPER_CAP = 30000 // 2024-25 concessional cap
  const TAX_THRESHOLD = 45001 // 32.5% tax bracket
  const superReminder = totalProfit > TAX_THRESHOLD

  const statusLabel = (status: string) => {
    if (lang === 'zh') {
      return status === 'active' ? '进行中' : status === 'completed' ? '已完成' : '暂停'
    }
    return status
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JP</span>
            </div>
            <span className="font-semibold text-gray-900">Job Profit OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/clients" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t.clients}</Link>
            <Link href="/quotes" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t.quotes}</Link>
            <Link href="/finance" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === 'zh' ? '财务中心' : 'Finance'}</Link>
            <Link href="/tax" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === 'zh' ? '税务中心' : 'Tax Hub'}</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">💳 {lang === 'zh' ? '订阅' : 'Pricing'}</Link>
            <Link href="/settings" className="text-gray-600 hover:text-gray-900 text-sm font-medium">⚙️ {lang === 'zh' ? '设置' : 'Settings'}</Link>
            
            <Link href="/jobs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">{t.newJob}</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t.dashboard}</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">{t.totalJobs}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">{t.activeJobs}</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{activeJobs}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-gray-500 text-sm">{t.totalProfit}</p>
            <p className={totalProfit >= 0 ? 'text-3xl font-bold text-green-600 mt-1' : 'text-3xl font-bold text-red-600 mt-1'}>
              {totalProfit >= 0 ? '+' : '-'}${Math.abs(totalProfit).toLocaleString()}
            </p>
          </div>
        </div>

        {showImportTip && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <p className="text-white font-medium text-sm">{lang === 'zh' ? '告别手动录入！批量导入收据，GST自动计算' : 'Skip the paperwork — import receipts instantly!'}</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="/import-materials" className="bg-white text-green-600 text-xs font-medium px-3 py-1.5 rounded-lg">{lang === 'zh' ? '立即使用 →' : 'Try it →'}</a>
              <button onClick={() => setShowImportTip(false)} className="text-green-100 hover:text-white text-lg">✕</button>
            </div>
          </div>
        )}
        {showPricingBanner && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 mb-2 flex justify-between items-center">
            <Link href="/pricing" className="flex-1 flex justify-between items-center hover:opacity-90 transition">
              <div>
                <p className="font-semibold text-sm">🚀 {lang === 'zh' ? '升级到专业版' : 'Upgrade to Pro'}</p>
                <p className="text-blue-100 text-xs mt-0.5">{lang === 'zh' ? '无限工单 · OCR收据扫描 · 税务报告 · $19/月' : 'Unlimited jobs · Receipt OCR · Tax reports · $19/mo'}</p>
              </div>
              <span className="text-white font-bold text-sm whitespace-nowrap ml-4">{lang === 'zh' ? '查看方案 →' : 'View Plans →'}</span>
            </Link>
            <button onClick={() => setShowPricingBanner(false)} className="ml-3 text-blue-200 hover:text-white text-lg leading-none">✕</button>
          </div>
        )}

        {badDebts.filter(e => e.days_overdue > 90).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-semibold text-red-800">
                  🚨 {lang === 'zh' ? '潜在坏账警告' : 'Potential Bad Debt Warning'}
                </p>
                <p className="text-red-600 text-sm mt-1">
                  {badDebts.filter(e => e.days_overdue > 90).length} {lang === 'zh' ? '张发票逾期超过90天，可申报坏账抵扣' : 'invoices overdue 90+ days — may be claimable as bad debt'}
                </p>
              </div>
              <span className="text-xl font-bold text-red-800">
                ${badDebts.filter(e => e.days_overdue > 90).reduce((sum: number, e: any) => sum + Number(e.amount), 0).toLocaleString()}
              </span>
            </div>
            <div className="space-y-2">
              {badDebts.filter(e => e.days_overdue > 90).map((e: any) => (
                <div key={e.id} className="flex justify-between text-sm bg-white rounded-lg px-3 py-2">
                  <span className="text-gray-700">{e.job_name} — {e.description || (lang === 'zh' ? '发票' : 'Invoice')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 font-medium text-xs">
                      {e.days_overdue} {lang === 'zh' ? '天逾期' : 'days overdue'}
                    </span>
                    <span className="font-medium text-red-800">${Number(e.amount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-red-500 text-xs mt-3">
              {lang === 'zh' ? '💡 提示：逾期90天以上的发票可向ATO申报坏账抵扣，请咨询您的税务代理。' : '💡 Tip: Invoices overdue 90+ days may be written off as bad debts for tax purposes. Consult your tax agent.'}
            </p>
          </div>
        )}

        {superReminder && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-purple-800">
                  💰 {lang === 'zh' ? 'Super 供款节税提醒' : 'Super Contribution Tax Tip'}
                </p>
                <p className="text-purple-600 text-sm mt-1">
                  {lang === 'zh'
                    ? `您的利润已超过 ${TAX_THRESHOLD.toLocaleString()}，考虑增加 Super 供款最多可节省 ${((totalProfit * 0.325) - ((totalProfit - Math.min(SUPER_CAP, totalProfit * 0.15)) * 0.325)).toFixed(0)} 澳元税款`
                    : `Your profit exceeds ${TAX_THRESHOLD.toLocaleString()}. Consider topping up super (up to ${SUPER_CAP.toLocaleString()} cap) to reduce your tax bill.`
                  }
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500">{lang === 'zh' ? '2024-25 供款上限' : '2024-25 Concessional Cap'}</p>
                <p className="font-bold text-purple-700">$30,000</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500">{lang === 'zh' ? 'Super 税率 vs 个人税率' : 'Super Tax Rate vs Personal'}</p>
                <p className="font-bold text-purple-700">15% vs 32.5%+</p>
              </div>
            </div>
            <p className="text-purple-500 text-xs mt-3">
              {lang === 'zh' ? '⚠️ 请在6月30日前供款以抵扣本财年收入。建议咨询税务代理。' : '⚠️ Contribute before 30 June to claim this financial year. Consult your tax agent.'}
            </p>
          </div>
        )}

        {totalReceivable > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-semibold text-yellow-800">
                  💰 {lang === 'zh' ? '应收账款到期提醒' : 'Accounts Receivable Due'}
                </p>
                <p className="text-yellow-600 text-sm mt-1">
                  {unpaidInvoices.length} {lang === 'zh' ? '张未付发票' : 'unpaid invoice(s)'}
                  {overdueInvoices.length > 0 && (
                    <span className="text-red-600 font-medium ml-2">
                      · {overdueInvoices.length} {lang === 'zh' ? '张已逾期！' : 'overdue!'}
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xl font-bold text-yellow-800">${totalReceivable.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              {unpaidInvoices.slice(0, 3).map((e: any) => (
                <div key={e.id} className="flex justify-between text-sm bg-white rounded-lg px-3 py-2">
                  <span className="text-gray-700">{e.jobs?.name} — {e.description || (lang === 'zh' ? '发票' : 'Invoice')}</span>
                  <div className="flex items-center gap-3">
                    {e.payment_due_date && (
                      <span className={new Date(e.payment_due_date) < new Date() ? 'text-red-600 font-medium text-xs' : 'text-gray-500 text-xs'}>
                        {lang === 'zh' ? '到期' : 'Due'}: {formatDate(e.payment_due_date)}
                        {new Date(e.payment_due_date) < new Date() && (lang === 'zh' ? ' ⚠️逾期' : ' ⚠️Overdue')}
                      </span>
                    )}
                    <span className="font-medium text-yellow-800">${Number(e.amount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="md:hidden space-y-3 mb-4">
          {unpaidInvoices.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{lang === 'zh' ? '最近到期应收账款' : 'Upcoming Receivables'}</p>
              <div className="space-y-2">
                {unpaidInvoices.slice(0, 3).sort((a: any, b: any) => new Date(a.payment_due_date || '9999').getTime() - new Date(b.payment_due_date || '9999').getTime()).map((e: any) => (
                  <div key={e.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{e.jobs?.name}</p>
                      {e.payment_due_date && (
                        <p className={new Date(e.payment_due_date) < new Date() ? 'text-xs text-red-500' : 'text-xs text-gray-400'}>
                          {lang === 'zh' ? '到期' : 'Due'}: {formatDate(e.payment_due_date)}
                          {new Date(e.payment_due_date) < new Date() && ' ⚠️'}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-green-600">${Number(e.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {jobs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{lang === 'zh' ? '最近工单' : 'Recent Jobs'}</p>
              <div className="space-y-2">
                {jobs.slice(0, 3).map((job: any) => {
                  const profit = Number(job.profit)
                  return (
                    <a href={"/jobs/" + job.id} key={job.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{job.name}</p>
                        <p className="text-xs text-gray-400">{job.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className={profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                          {profit >= 0 ? '+' : '-'}${Math.abs(profit).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">{statusLabel(job.status)}</p>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工单列表' : 'Jobs'}</h2>
          </div>
          {jobs.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-400">{t.noJobs}</p>
              <Link href="/jobs/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">{t.newJob}</Link>
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
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{statusLabel(job.status)}</span>
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