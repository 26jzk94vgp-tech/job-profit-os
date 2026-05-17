const fs = require('fs')
let c = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')
c = c.replace(
  '<input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />',
  '<input type="file" accept="image/*" className="hidden" onChange={handleScan} />'
)
fs.writeFileSync('app/jobs/[id]/add/page.tsx', c)
console.log('done')
