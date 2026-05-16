const part2 = `  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '现金流' : 'Cash Flow'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="md:hidden flex items-center gap-3 mb-2">
          <Link href="/" className="text-gray-500 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '现金流' : 'Cash Flow'}</h1>
        </div>

        {totalUnpaid > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-yellow-800">💰 {lang === 'zh' ? '未收款项' : 'Outstanding Receivables'}</p>
                <p className="text-yellow-600 text-sm mt-1">{unpaidInvoices.length} {lang === 'zh' ? '张未付发票' : 'unpaid invoice(s)'}</p>
              </div>
              <span className="text-2xl font-bold text-yellow-800">\${totalUnpaid.toLocaleString()}</span>
            </div>
            <div className="mt-4 space-y-2">
              {unpaidInvoices.map((e: any) => (
                <div key={e.id} className="flex justify-between text-sm">
                  <span className="text-yellow-700">{e.jobs?.name} — {e.description || (lang === 'zh' ? '发票' : 'Invoice')}</span>
                  <div className="flex items-center gap-3">
                    {e.payment_due_date && <span className={new Date(e.payment_due_date) < new Date() ? 'text-red-600 font-medium text-xs' : 'text-yellow-600 text-xs'}>{lang === 'zh' ? '到期' : 'Due'}: {e.payment_due_date}</span>}
                    <span className="font-medium text-yellow-800">\${Number(e.amount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '3个月预测' : '3-Month Forecast'}</h2>
            <p className="text-gray-400 text-xs mt-1">{lang === 'zh' ? '基于已录入条目' : 'Based on recorded entries'}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(months).map(([month, data]) => {
              const net = data.income - data.expenses
              return (
                <div key={month} className="px-6 py-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">{month}</h3>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const monthKeys = Object.keys(months)
                        const currentIndex = monthKeys.indexOf(month)
                        if (currentIndex > 0) {
                          const prevNet = months[monthKeys[currentIndex - 1]].income - months[monthKeys[currentIndex - 1]].expenses
                          if (prevNet !== 0) {
                            const change = ((net - prevNet) / Math.abs(prevNet)) * 100
                            return (
                              <span className={change >= 0 ? 'text-sm text-green-600 font-medium' : 'text-sm text-red-500 font-medium'}>
                                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(0)}% {lang === 'zh' ? '环比' : 'vs last month'}
                              </span>
                            )
                          }
                        }
                        return null
                      })()}
                      <span className={net >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                        {lang === 'zh' ? '净额' : 'Net'}: {net >= 0 ? '+' : '-'}\${Math.abs(net).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-gray-500">{lang === 'zh' ? '收入' : 'Income'}</span>
                      <span className="font-medium text-green-600">\${data.income.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-gray-500">{lang === 'zh' ? '支出' : 'Expenses'}</span>
                      <span className="font-medium text-red-500">\${data.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: data.income > 0 ? Math.min(100, (data.income / (data.income + data.expenses)) * 100) + '%' : '0%' }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-blue-800 font-medium text-sm">💡 {lang === 'zh' ? '提示' : 'Tip'}</p>
          <p className="text-blue-600 text-xs mt-1">{lang === 'zh' ? '保持发票付款日期更新，可以获得更准确的现金流预测。' : 'Keep your invoice payment dates up to date for a more accurate forecast.'}</p>
        </div>
      </main>
    </div>
  )
}`

const existing = require('fs').readFileSync('app/cashflow/page.tsx', 'utf8')
require('fs').writeFileSync('app/cashflow/page.tsx', existing + part2)
console.log('part2 done')
