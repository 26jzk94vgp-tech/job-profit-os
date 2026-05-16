const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')
content = content.replace(
  '<Link href="/settings" className="text-gray-600 hover:text-gray-900 text-sm font-medium">⚙️ Settings</Link>',
  '<Link href="/settings" className="text-gray-600 hover:text-gray-900 text-sm font-medium">⚙️ {lang === \'zh\' ? \'设置\' : \'Settings\'}</Link>'
)
fs.writeFileSync('app/page.tsx', content)
console.log('done')
