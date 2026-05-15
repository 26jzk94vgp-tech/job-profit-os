const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

// 加坏账预警数据
content = content.replace(
  "    const { data: entryData } = await supabase\n      .from('job_entries')\n      .select('*, jobs(name)')\n      .in('type', ['invoice', 'material', 'subcontract'])\n    setEntries(entryData || [])",
  `    const { data: entryData } = await supabase
      .from('job_entries')
      .select('*, jobs(name)')
      .in('type', ['invoice', 'material', 'subcontract'])
    setEntries(entryData || [])
    const { data: overdueData } = await supabase
      .from('overdue_invoices')
      .select('*')
    setBadDebts(overdueData || [])`
)

// 加 state
content = content.replace(
  "  const [entries, setEntries] = useState<any[]>([])",
  `  const [entries, setEntries] = useState<any[]>([])
  const [badDebts, setBadDebts] = useState<any[]>([])`
)

// 加坏账提醒 UI（在应收账款提醒后面）
content = content.replace(
  `        {totalReceivable > 0 && (`,
  `        {badDebts.filter(e => e.days_overdue > 90).length > 0 && (
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
                \${badDebts.filter(e => e.days_overdue > 90).reduce((sum: number, e: any) => sum + Number(e.amount), 0).toLocaleString()}
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
                    <span className="font-medium text-red-800">\${Number(e.amount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-red-500 text-xs mt-3">
              {lang === 'zh' ? '💡 提示：逾期90天以上的发票可向ATO申报坏账抵扣，请咨询您的税务代理。' : '💡 Tip: Invoices overdue 90+ days may be written off as bad debts for tax purposes. Consult your tax agent.'}
            </p>
          </div>
        )}

        {totalReceivable > 0 && (`
)

fs.writeFileSync('app/page.tsx', content)
console.log('done')
