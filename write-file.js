const fs = require('fs')
let c = fs.readFileSync('app/jobs/[id]/page.tsx', 'utf8')

// 加 activeTab state
c = c.replace(
  "  const [entries, setEntries] = useState<any[]>([])",
  `  const [entries, setEntries] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')`
)

fs.writeFileSync('app/jobs/[id]/page.tsx', c)
console.log('done state')
