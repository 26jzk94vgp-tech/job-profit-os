const fs = require('fs')
let c = fs.readFileSync('app/finance/page.tsx', 'utf8')

c = c.replace(
  `          <Link href="/tax" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">`,
  `          <Link href="/tax" className="md:hidden flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">`
)

fs.writeFileSync('app/finance/page.tsx', c)
console.log('done')
