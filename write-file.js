const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')
content = content.replace(
  '<nav className="bg-white border-b border-gray-200 px-6 py-4">',
  '<nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">'
)
fs.writeFileSync('app/page.tsx', content)
console.log('done')
