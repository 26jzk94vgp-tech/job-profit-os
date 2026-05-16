const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')
c = c.replace(
  "{lang === 'zh' ? '新功能：一键导入收据（如Bunnings）' : 'New: Import receipts in seconds (e.g. Bunnings)'}",
  "{lang === 'zh' ? '告别手动录入！批量导入收据，GST自动计算' : 'Skip the paperwork — import receipts instantly'}"
)
fs.writeFileSync('app/page.tsx', c)
console.log('done')
