const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')
content = content.replace(
  '<Link href="/home-office" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === \'zh\' ? \'家庭办公\' : \'Home Office\'}</Link>',
  '<Link href="/home-office" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === \'zh\' ? \'家庭办公\' : \'Home Office\'}</Link>\n            <Link href="/tax-checklist" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === \'zh\' ? \'年度税务\' : \'Tax Checklist\'}</Link>'
)
fs.writeFileSync('app/page.tsx', content)
console.log('done')
