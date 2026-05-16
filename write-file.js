node -e "
const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')
c = c.replace(
  \"{lang === 'zh' ? '财务' : 'Finance'}\",
  \"{lang === 'zh' ? '财务中心' : 'Finance'}\"
)
fs.writeFileSync('app/page.tsx', c)
console.log('done')
"
