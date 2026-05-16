const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')
content = content.replace(
  "\n            <LangToggle />",
  ''
)
fs.writeFileSync('app/page.tsx', content)
console.log('done')
