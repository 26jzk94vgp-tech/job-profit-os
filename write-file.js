const fs = require('fs')
let content = fs.readFileSync('app/finance/page.tsx', 'utf8')

content = content.replace(
  `          <Link href="/cashflow" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '现金流预测' : 'Cash Flow Forecast'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '3个月收支预测' : '3-month income & expense forecast'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>`,
  `          <Link href="/cashflow" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '现金流预测' : 'Cash Flow Forecast'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '3个月收支预测' : '3-month income & expense forecast'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/import-materials" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '导入材料清单' : 'Import Materials'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '从Bunnings等Excel文件批量导入' : 'Bulk import from Bunnings Excel files'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>`
)

fs.writeFileSync('app/finance/page.tsx', content)
console.log('done')
