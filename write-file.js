const fs = require('fs')
let c = fs.readFileSync('app/api/ocr/route.ts', 'utf8')
c = c.replace(
  "model: 'claude-opus-4-5'",
  "model: 'claude-opus-4-5-20251101'"
)
fs.writeFileSync('app/api/ocr/route.ts', c)
console.log('done')
