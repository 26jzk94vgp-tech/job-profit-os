const fs = require('fs')
let content = fs.readFileSync('app/components/MobileHeader.tsx', 'utf8')
content = content.replace(
  'className="text-xs font-medium px-2 py-1 rounded-lg bg-red-50 text-red-600"',
  'className="text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-600 active:bg-red-100"'
)
fs.writeFileSync('app/components/MobileHeader.tsx', content)
console.log('done')
