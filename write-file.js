const part2 = `  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/tax" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '税务中心' : 'Tax Hub'}</Link>
            <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '税务报告' : 'Tax Report'}</h1>
          </div>
          <Link href="/reports/monthly" className="text-blue-600 text-sm hover:text-blue-800">{lang === 'zh' ? '月度损益表' : 'Monthly P&L'} →</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="md:hidden flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link href="/tax" className="text-gray-500 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
            <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '税务报告' : 'Tax Report'}</h1>
          </div>
          <Link href="/reports/monthly" className="text-blue-600 text-sm">{lang === 'zh' ? '月度' : 'Monthly'} →</Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">{lang === 'zh' ? '筛选范围 (BAS季度)' : 'Filter Period (BAS Quarter)'}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setFilterType('all')} className={\`px-3 py-1 rounded-full text-xs font-medium \${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}\`}>{lang === 'zh' ? '全部' : 'All Time'}</button>
            {quarters.map((q, i) => (
              <button key={i} onClick={() => setFilterType('q' + (i+1))} className={\`px-3 py-1 rounded-full text-xs font-medium \${filterType === 'q' + (i+1) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}\`}>{q.label}</button>
            ))}
            <button onClick={() => setFilterType('custom')} className={\`px-3 py-1 rounded-full text-xs font-medium \${filterType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}\`}>{lang === 'zh' ? '自定义' : 'Custom'}</button>
          </div>
          {filterType === 'custom' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-gray-500 text-xs">{lang === 'zh' ? '开始日期' : 'Start Date'}</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 text-xs">{lang === 'zh' ? '结束日期' : 'End Date'}</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}
          <p className="text-gray-400 text-xs mt-3">{lang === 'zh' ? \`当前筛选: \${filtered.length} 条记录\` : \`Showing: \${filtered.length} entries\`}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? 'GST 汇总 (BAS)' : 'GST Summary (BAS)'}</h2>
            <p className="text-gray-400 text-xs mt-1">{lang === 'zh' ? '基于所有含GST条目' : 'Based on all entries marked as GST Inclusive'}</p>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '已收GST' : 'GST Collected'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '来自发票 (1/11)' : 'From invoices (1/11 of revenue)'}</p>
              </div>
              <span className="font-semibold text-green-600">\${gstCollected.toFixed(2)}</span>
            </div>
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '已付GST (进项税抵扣)' : 'GST Paid (Input Tax Credits)'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '来自支出 (1/11)' : 'From expenses (1/11 of costs)'}</p>
              </div>
              <span className="font-semibold text-red-500">-\${gstPaid.toFixed(2)}</span>
            </div>
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">{lang === 'zh' ? '应缴ATO净GST' : 'Net GST Payable to ATO'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? 'BAS申报金额' : 'Amount to remit in BAS'}</p>
              </div>
              <span className={netGst >= 0 ? 'font-bold text-lg text-red-600' : 'font-bold text-lg text-green-600'}>
                \${Math.abs(netGst).toFixed(2)} {netGst >= 0 ? (lang === 'zh' ? '(应缴)' : '(payable)') : (lang === 'zh' ? '(退税)' : '(refund)')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? 'ATO分类明细' : 'ATO Category Breakdown'}</h2>
            <p className="text-gray-400 text-xs mt-1">{lang === 'zh' ? '用于所得税申报' : 'For income tax return preparation'}</p>
          </div>
          {Object.keys(categoryTotals).length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">
              <p>{lang === 'zh' ? '还没有分类条目' : 'No categorised entries yet.'}</p>
              <p className="text-xs mt-1">{lang === 'zh' ? '添加条目时选择ATO税务分类' : 'Add ATO Tax Category when entering costs.'}</p>
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {Object.entries(categoryTotals).map(([cat, total]) => (
              <div key={cat} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{lang === 'zh' ? categoryLabels[cat]?.zh : categoryLabels[cat]?.en || cat}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cat}</span>
                </div>
                <span className={cat === 'other_income' ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
                  {cat === 'other_income' ? '+' : '-'}\${total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-blue-800 font-medium text-sm">⚠️ {lang === 'zh' ? '免责声明' : 'Disclaimer'}</p>
          <p className="text-blue-600 text-xs mt-1">{lang === 'zh' ? '本报告仅供参考。提交BAS或税务申报前请咨询注册税务代理或CPA。' : 'This report is for reference only. Please consult a registered tax agent or CPA before lodging your BAS or tax return.'}</p>
        </div>
      </main>
    </div>
  )
}`

const existing = require('fs').readFileSync('app/reports/page.tsx', 'utf8')
require('fs').writeFileSync('app/reports/page.tsx', existing + part2)
console.log('part2 done')
