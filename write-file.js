const fs = require('fs')
let content = fs.readFileSync('app/reports/page.tsx', 'utf8')

content = content.replace(
  `  const gstCollected = filtered.filter(e => e.type === 'invoice' && e.gst_status === 'inclusive').reduce((sum: number, e: any) => sum + Number(e.amount) / 11, 0)
  const gstPaid = filtered.filter(e => e.type !== 'invoice' && e.gst_status === 'inclusive').reduce((sum: number, e: any) => {
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    return sum + amount / 11
  }, 0)`,
  `  // GST Collected from invoices (inclusive = amount/11, exclusive = amount*10%)
  const gstCollected = filtered.filter(e => e.type === 'invoice').reduce((sum: number, e: any) => {
    if (e.gst_status === 'inclusive') return sum + Number(e.amount) / 11
    if (e.gst_status === 'exclusive') return sum + Number(e.amount) * 0.1
    return sum
  }, 0)

  // GST Paid on expenses (inclusive = amount/11, exclusive = amount*10%)
  const gstPaid = filtered.filter(e => e.type !== 'invoice').reduce((sum: number, e: any) => {
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    if (e.gst_status === 'inclusive') return sum + amount / 11
    if (e.gst_status === 'exclusive') return sum + amount * 0.1
    return sum
  }, 0)`
)

fs.writeFileSync('app/reports/page.tsx', content)
console.log('done reports')

// 同样修复 tax/page.tsx
let taxContent = fs.readFileSync('app/tax/page.tsx', 'utf8')
taxContent = taxContent.replace(
  `  const gstCollected = entries.filter(e => e.type === 'invoice' && e.gst_status === 'inclusive').reduce((sum: number, e: any) => sum + Number(e.amount) / 11, 0)
  const gstPaid = entries.filter(e => e.type !== 'invoice' && e.gst_status === 'inclusive').reduce((sum: number, e: any) => {
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    return sum + amount / 11
  }, 0)`,
  `  const gstCollected = entries.filter((e: any) => e.type === 'invoice').reduce((sum: number, e: any) => {
    if (e.gst_status === 'inclusive') return sum + Number(e.amount) / 11
    if (e.gst_status === 'exclusive') return sum + Number(e.amount) * 0.1
    return sum
  }, 0)
  const gstPaid = entries.filter((e: any) => e.type !== 'invoice').reduce((sum: number, e: any) => {
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    if (e.gst_status === 'inclusive') return sum + amount / 11
    if (e.gst_status === 'exclusive') return sum + amount * 0.1
    return sum
  }, 0)`
)
fs.writeFileSync('app/tax/page.tsx', taxContent)
console.log('done tax')
