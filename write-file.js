const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

const oldValidate = `  function validatePositive(value: string, field: string) {
    if (value === '' || value === '/') return true
    const num = Number(value)
    if (num < 0) {
      setErrors(e => ({ ...e, [field]: 'Value cannot be negative. Use / if unknown.' }))
      return false
    }
    setErrors(e => { const n = {...e}; delete n[field]; return n })
    return true
  }`

const newValidate = `  function validatePositive(value: string, field: string) {
    if (value === '' || value === '/') { setErrors(e => { const n = {...e}; delete n[field]; return n }); return true }
    if (!/^\\d+(\\.5)?$/.test(value)) {
      setErrors(e => ({ ...e, [field]: 'Only whole numbers, x.5, or / allowed.' }))
      return false
    }
    const num = Number(value)
    if (num < 0) {
      setErrors(e => ({ ...e, [field]: 'Value cannot be negative. Use / if unknown.' }))
      return false
    }
    setErrors(e => { const n = {...e}; delete n[field]; return n })
    return true
  }`

content = content.replace(oldValidate, newValidate)
fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
