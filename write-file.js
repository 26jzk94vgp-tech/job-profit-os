const fs = require('fs')
let content = fs.readFileSync('app/tax/page.tsx', 'utf8')

// 把 ATO分类卡片改成 净应缴GST
content = content.replace(
  `          <a href="/reports" className="bg-white rounded-xl border border-gray-200 p-4 block hover:bg-gray-50">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? 'ATO分类 →' : 'ATO Category →'}</p>
            <p className={categoryCompleteness >= 80 ? 'text-xl font-bold text-green-600 mt-1' : 'text-xl font-bold text-yellow-500 mt-1'}>{categoryCompleteness}%</p>
          </a>`,
  `          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '净应缴GST' : 'Net GST'}</p>
            <p className={netGst >= 0 ? 'text-xl font-bold text-red-500 mt-1' : 'text-xl font-bold text-green-600 mt-1'}>\${Math.abs(netGst).toFixed(0)}</p>
          </div>`
)

fs.writeFileSync('app/tax/page.tsx', content)
console.log('done')
