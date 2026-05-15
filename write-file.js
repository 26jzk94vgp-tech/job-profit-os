const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')
content = content.replace(
  '<Link href="/quotes" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Quotes</Link>',
  '<Link href="/quotes" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Quotes</Link>\n            <Link href="/reports" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Tax Report</Link>'
)
fs.writeFileSync('app/page.tsx', content)
console.log('done')
