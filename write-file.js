const fs = require('fs')
let c = fs.readFileSync('app/finance/page.tsx', 'utf8')
c = c.replace(
  `          <Link href="/reports/monthly" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">`,
  `          <Link href="/reports/annual" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '年度汇总报表' : 'Annual Report'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '全年收支利润+工单排名' : 'Full year P&L + job ranking'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/reports/monthly" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">`
)
fs.writeFileSync('app/finance/page.tsx', c)
console.log('done')
