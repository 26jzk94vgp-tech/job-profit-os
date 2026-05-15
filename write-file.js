const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')
content = content.replace(
  `        {badDebts.filter(e => e.days_overdue > 90).length > 0 && (`,
  `        <Link href="/pricing" className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 mb-2 flex justify-between items-center hover:from-blue-700 hover:to-blue-800 transition">
          <div>
            <p className="font-semibold text-sm">🚀 {lang === 'zh' ? '升级到专业版' : 'Upgrade to Pro'}</p>
            <p className="text-blue-100 text-xs mt-0.5">{lang === 'zh' ? '无限工程 · OCR收据扫描 · 税务报告 · $19/月' : 'Unlimited jobs · Receipt OCR · Tax reports · $19/mo'}</p>
          </div>
          <span className="text-white font-bold text-sm whitespace-nowrap ml-4">{lang === 'zh' ? '查看方案 →' : 'View Plans →'}</span>
        </Link>

        {badDebts.filter(e => e.days_overdue > 90).length > 0 && (`
)
fs.writeFileSync('app/page.tsx', content)
console.log('done')
