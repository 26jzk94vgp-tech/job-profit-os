const fs = require('fs')
let content = fs.readFileSync('app/components/BottomNav.tsx', 'utf8')
content = content.replace(
  'className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50"',
  'className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-[100] shadow-lg"'
)
fs.writeFileSync('app/components/BottomNav.tsx', content)
console.log('done')
