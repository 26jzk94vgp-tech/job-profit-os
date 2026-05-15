const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')
content = content.replace(
  `    if (!/^\\d+(\\.5)?$/.test(value)) {
      setErrors(e => ({ ...e, [field]: 'Only whole numbers, x.5, or / allowed.' }))
      return false
    }`,
  `    if (!/^\\d+(\\.\\d{0,2})?$/.test(value)) {
      setErrors(e => ({ ...e, [field]: 'Only numbers (up to 2 decimal places) or / allowed.' }))
      return false
    }`
)
fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
