const fs = require('fs')
let content = fs.readFileSync('app/reports/page.tsx', 'utf8')

content = content.replace(
  `  const categoryTotals: Record<string, number> = {}
  filtered.forEach((e: any) => {
    if (!e.tax_category) return
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    categoryTotals[e.tax_category] = (categoryTotals[e.tax_category] || 0) + amount
  })`,
  `  const categoryTotals: Record<string, number> = {}
  filtered.forEach((e: any) => {
    if (!e.tax_category) return
    // other_income only applies to invoice entries
    if (e.tax_category === 'other_income' && e.type !== 'invoice') return
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    categoryTotals[e.tax_category] = (categoryTotals[e.tax_category] || 0) + amount
  })`
)

fs.writeFileSync('app/reports/page.tsx', content)
console.log('done')
