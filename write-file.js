const fs = require('fs')
let nav = fs.readFileSync('app/components/BottomNav.tsx', 'utf8')

nav = nav.replace(
  `{ href: '/finance', icon: '💹', label: lang === 'zh' ? '财务' : 'Finance' },
    { href: '/tax', icon: '📊', label: lang === 'zh' ? '税务' : 'Tax' },`,
  `{ href: '/tax', icon: '📊', label: lang === 'zh' ? '税务' : 'Tax' },
    { href: '/finance', icon: '💹', label: lang === 'zh' ? '财务' : 'Finance' },`
)

fs.writeFileSync('app/components/BottomNav.tsx', nav)
console.log('done nav')
