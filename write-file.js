const fs = require('fs')

// 加到 Finance 页面
let finance = fs.readFileSync('app/finance/page.tsx', 'utf8')
finance = finance.replace(
  `          <Link href="/cashflow" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">`,
  `          <Link href="/import-materials" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '导入材料清单' : 'Import Materials'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '从Bunnings等Excel文件批量导入' : 'Bulk import from Bunnings & supplier Excel files'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/cashflow" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">`
)
fs.writeFileSync('app/finance/page.tsx', finance)
console.log('done finance')

// 加到 Tax Hub 页面
let tax = fs.readFileSync('app/tax/page.tsx', 'utf8')
tax = tax.replace(
  `          <Link href="/home-office" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">`,
  `          <Link href="/import-materials" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '导入材料清单' : 'Import Materials'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '从Bunnings等Excel文件批量导入' : 'Bulk import from Bunnings & supplier Excel files'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/home-office" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">`
)
fs.writeFileSync('app/tax/page.tsx', tax)
console.log('done tax')
