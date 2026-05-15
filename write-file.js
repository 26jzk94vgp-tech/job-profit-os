const fs = require('fs')
let content = fs.readFileSync('app/components/MobileHeader.tsx', 'utf8')
content = content.replace(
  '<button\n          onClick={handleSignOut}',
  `<a href="/settings" className="text-xs font-medium px-3 py-2 rounded-lg bg-gray-100 text-gray-700">⚙️</a>
        <button
          onClick={handleSignOut}`
)
fs.writeFileSync('app/components/MobileHeader.tsx', content)
console.log('done mobile header')
