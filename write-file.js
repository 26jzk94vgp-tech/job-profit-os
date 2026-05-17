const fs = require('fs')
let c = fs.readFileSync('app/finance/page.tsx', 'utf8')

c = c.replace(
  `          <Link href="/reports/annual" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">`,
  `          <Link href="/tax" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '税务中心' : 'Tax Hub'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? 'GST、BAS、ATO分类、家庭办公室' : 'GST, BAS, ATO Categories, Home Office'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/reports/annual" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">`
)

fs.writeFileSync('app/finance/page.tsx', c)
console.log('done')
