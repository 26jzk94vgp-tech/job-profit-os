const fs = require('fs')
let content = fs.readFileSync('app/quotes/[id]/page.tsx', 'utf8')
content = content.replace(
  '<Link href="/quotes" className="text-gray-500 hover:text-gray-700 text-sm">← Back</Link>',
  '<a href="/quotes" className="text-gray-500 hover:text-gray-700 text-sm">← Back</a>'
)
fs.writeFileSync('app/quotes/[id]/page.tsx', content)
console.log('done')
