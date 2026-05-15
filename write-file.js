const fs = require('fs')
let content = fs.readFileSync('app/reports/page.tsx', 'utf8')
content = content.replace(
  '<h2 className="font-semibold text-gray-900">GST Summary (BAS)</h2>',
  `<div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">GST Summary (BAS)</h2>
            <Link href="/reports/monthly" className="text-blue-600 text-sm hover:text-blue-800">Monthly P&L →</Link>
          </div>`
)
fs.writeFileSync('app/reports/page.tsx', content)
console.log('done')
