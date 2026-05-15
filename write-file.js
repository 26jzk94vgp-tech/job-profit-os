const fs = require('fs')
let content = fs.readFileSync('app/layout.tsx', 'utf8')
content = content.replace(
  "import MobileHeader from './components/MobileHeader';",
  "import MobileHeader from './components/MobileHeader';\nimport InstallBanner from './components/InstallBanner';"
)
fs.writeFileSync('app/layout.tsx', content)
console.log('done')
