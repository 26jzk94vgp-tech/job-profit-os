const fs = require('fs')
let c = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')
// 删掉重复的 showAtoInfo
c = c.replace(
  'const [showAtoInfo, setShowAtoInfo] = useState(false)\n  const [showAtoInfo, setShowAtoInfo] = useState(false)',
  'const [showAtoInfo, setShowAtoInfo] = useState(false)'
)
fs.writeFileSync('app/jobs/[id]/add/page.tsx', c)
console.log('done')
