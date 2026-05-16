const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

// 切换到 labor 时设置 GST Free
content = content.replace(
  "const defaults: Record<string, string> = { labor: 'cogs_labour', material: 'cogs_material', subcontract: 'subcontractor', fuel: 'vehicle', invoice: 'other_income' }",
  "const defaults: Record<string, string> = { labor: 'cogs_labour', material: 'cogs_material', subcontract: 'subcontractor', fuel: 'vehicle', invoice: 'other_income' }\n                  const gstDefaults: Record<string, string> = { labor: 'free', material: 'inclusive', subcontract: 'inclusive', fuel: 'free', invoice: 'inclusive' }\n                  setGstStatus(gstDefaults[tab.key] || 'inclusive')"
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
