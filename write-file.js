const fs = require('fs')
let c = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

c = c.replace(
  `      if (json.success) { setDescription(json.data.description || ''); setAmount(json.data.amount?.toString() || ''); setType(json.data.type || 'material') } else { alert(lang === 'zh' ? '无法读取收据' : 'Could not read receipt') }`,
  `      if (json.success) {
        const d = json.data
        setDescription(d.description || '')
        setAmount(d.amount?.toString() || '')
        setType(d.type || 'material')
        setCategory(d.type === 'invoice' ? 'income' : 'expense')
        if (d.quantity) setQuantity(d.quantity.toString())
        if (d.unit_price) setUnitPrice(d.unit_price.toString())
        if (d.gst_status) setGstStatus(d.gst_status)
        const atoDefaults: Record<string, string> = { material: 'cogs_material', subcontract: 'subcontractor', fuel: 'vehicle', invoice: 'other_income' }
        if (d.type && atoDefaults[d.type]) setTaxCategory(atoDefaults[d.type])
      } else {
        alert(lang === 'zh' ? '无法读取收据' : 'Could not read receipt')
      }`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', c)
console.log('done:', c.includes('atoDefaults'))
