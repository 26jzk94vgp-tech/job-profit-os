const fs = require('fs')

// 更新底部导航
let nav = fs.readFileSync('app/components/BottomNav.tsx', 'utf8')
nav = nav.replace(
  "{ href: '/cashflow', icon: '💰', label: lang === 'zh' ? '现金流' : 'Cash' },",
  "{ href: '/finance', icon: '💹', label: lang === 'zh' ? '财务' : 'Finance' },"
)
fs.writeFileSync('app/components/BottomNav.tsx', nav)
console.log('done bottom nav')

// 更新首页导航
let page = fs.readFileSync('app/page.tsx', 'utf8')
page = page.replace(
  '<Link href="/cashflow" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{t.cashFlow}</Link>',
  '<Link href="/finance" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === \'zh\' ? \'财务\' : \'Finance\'}</Link>'
)
fs.writeFileSync('app/page.tsx', page)
console.log('done page')
