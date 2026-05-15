const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')
content = content.replace(
  '<LangToggle />',
  '<Link href="/settings" className="text-gray-600 hover:text-gray-900 text-sm font-medium">⚙️ Settings</Link>\n            <LangToggle />'
)
fs.writeFileSync('app/page.tsx', content)
console.log('done')
