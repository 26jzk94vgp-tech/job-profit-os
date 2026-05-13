const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/invoice/page.tsx', 'utf8')
content = content.replace(
  '<h1 className="text-2xl font-bold mb-6">Invoice Preview</h1>',
  '<div className="flex items-center gap-3 mb-6"><a href={"javascript:history.back()"} className="text-gray-400">← Back</a><h1 className="text-2xl font-bold">Invoice Preview</h1></div>'
)
fs.writeFileSync('app/jobs/[id]/invoice/page.tsx', content)
console.log('done')
