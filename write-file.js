const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

content = content
  .replace('<Link href="/reports" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t.taxReport}</Link>', '<Link href="/tax" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === \'zh\' ? \'税务中心\' : \'Tax Hub\'}</Link>')
  .replace('\n            <Link href="/home-office" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === \'zh\' ? \'家庭办公\' : \'Home Office\'}</Link>', '')
  .replace('\n            <Link href="/tax-checklist" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === \'zh\' ? \'年度税务\' : \'Tax Checklist\'}</Link>', '')

fs.writeFileSync('app/page.tsx', content)
console.log('done')
