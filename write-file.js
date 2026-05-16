const fs = require('fs')
let content = fs.readFileSync('app/components/BottomNav.tsx', 'utf8')
content = content.replace(
  "{ href: '/jobs/new', icon: '➕', label: lang === 'zh' ? '新建' : 'New' },",
  "{ href: '/settings', icon: '⚙️', label: lang === 'zh' ? '设置' : 'Settings' },"
)
fs.writeFileSync('app/components/BottomNav.tsx', content)
console.log('done')
