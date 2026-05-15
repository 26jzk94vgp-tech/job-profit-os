const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')
content = content.replace(
  '<Link href="/reports" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Tax Report</Link>',
  '<Link href="/reports" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Tax Report</Link>\n            <Link href="/cashflow" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Cash Flow</Link>'
)
fs.writeFileSync('app/page.tsx', content)
console.log('done')
