const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')
content = content.replace(
  '<Link href="/cashflow" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t.cashFlow}</Link>',
  '<Link href="/cashflow" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t.cashFlow}</Link>\n            <Link href="/home-office" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === \'zh\' ? \'家庭办公\' : \'Home Office\'}</Link>'
)
fs.writeFileSync('app/page.tsx', content)
console.log('done')
