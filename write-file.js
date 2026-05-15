const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')
content = content.replace(
  '<button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>',
  '<button onClick={() => window.location.href = "/jobs/" + id} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>'
)
fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
