const fs = require('fs')
let c = fs.readFileSync('app/jobs/[id]/edit/page.tsx', 'utf8')

// 加 notes state
c = c.replace(
  "  const [clientName, setClientName] = useState('')",
  `  const [clientName, setClientName] = useState('')
  const [notes, setNotes] = useState('')`
)

// 加载 notes
c = c.replace(
  "        setClientName(data.client_name || '')",
  `        setClientName(data.client_name || '')
        setNotes(data.notes || '')`
)

// 保存 notes
c = c.replace(
  "      client_name: clientName",
  `      client_name: clientName,
      notes: notes || null`
)

fs.writeFileSync('app/jobs/[id]/edit/page.tsx', c)
console.log('done edit')
