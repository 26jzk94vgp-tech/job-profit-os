const fs = require('fs')
let c = fs.readFileSync('app/tax/page.tsx', 'utf8')

// 移除月度损益表
const monthlyStart = c.indexOf('          <Link href="/reports/monthly"')
const monthlyEnd = c.indexOf('</Link>', monthlyStart) + 7
c = c.slice(0, monthlyStart) + c.slice(monthlyEnd)

// 移除导入材料
const importStart = c.indexOf('          <Link href="/import-materials"')
const importEnd = c.indexOf('</Link>', importStart) + 7
c = c.slice(0, importStart) + c.slice(importEnd)

fs.writeFileSync('app/tax/page.tsx', c)
console.log('done')
