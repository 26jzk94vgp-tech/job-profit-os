const fs = require('fs')
let content = fs.readFileSync('app/components/BottomNav.tsx', 'utf8')
content = content.replace(
  "{ href: '/settings', icon: '⚙️', label: lang === 'zh' ? '设置' : 'Settings' },",
  "{ href: '/jobs/new', icon: '➕', label: lang === 'zh' ? '新建' : 'New' },"
)
fs.writeFileSync('app/components/BottomNav.tsx', content)
console.log('done')
