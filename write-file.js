const fs = require('fs')
let content = fs.readFileSync('app/import-materials/page.tsx', 'utf8')

content = content.replace(
  `    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true })`,
  `    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })`
)

content = content.replace(
  `    reader.readAsBinaryString(file)`,
  `    reader.readAsArrayBuffer(file)`
)

fs.writeFileSync('app/import-materials/page.tsx', content)
console.log('done')
