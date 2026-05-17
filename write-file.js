const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')
c = c.replace(
 'thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)',
 'thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 15)'
)
c = c.replace(
 'const thirtyDaysAgo = new Date()',
 'const thirtyDaysAgo = new Date()'
)
fs.writeFileSync('app/page.tsx', c)
console.log('done')
