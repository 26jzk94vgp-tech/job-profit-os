const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/page.tsx', 'utf8')
content = content.replace(
  "<Link href={'/jobs/' + id + '/add'} className=\"block w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-center mb-6\">+ Add Entry</Link>",
  "<Link href={'/jobs/' + id + '/add'} className=\"block w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-center mb-3\">+ Add Entry</Link>\n        <Link href={'/jobs/' + id + '/invoice'} className=\"block w-full bg-gray-700 text-white py-3 rounded-lg font-medium text-center mb-6\">🧾 Generate Invoice</Link>"
)
fs.writeFileSync('app/jobs/[id]/page.tsx', content)
console.log('done')
