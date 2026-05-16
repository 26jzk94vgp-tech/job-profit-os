const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

// 切换类型时自动设置默认 ATO 分类
content = content.replace(
  `<button key={tab.key} onClick={() => { setType(tab.key); setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate('') }} className={tab.key === type ? 'px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white' : 'px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600'}>{tab.label}</button>`,
  `<button key={tab.key} onClick={() => {
                  setType(tab.key)
                  setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate('')
                  const defaults: Record<string, string> = { labor: 'cogs_labour', material: 'cogs_material', subcontract: 'subcontractor', fuel: 'vehicle', invoice: 'other_income' }
                  setTaxCategory(defaults[tab.key] || '')
                }} className={tab.key === type ? 'px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white' : 'px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600'}>{tab.label}</button>`
)

// 切换 income/expense 时也自动设置
content = content.replace(
  `onClick={() => { setCategory('expense'); setType('material'); setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate('') }}`,
  `onClick={() => { setCategory('expense'); setType('material'); setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate(''); setTaxCategory('cogs_material') }}`
)
content = content.replace(
  `onClick={() => { setCategory('income'); setType('invoice'); setAmount(''); setQuantity(''); setUnitPrice('') }}`,
  `onClick={() => { setCategory('income'); setType('invoice'); setAmount(''); setQuantity(''); setUnitPrice(''); setTaxCategory('other_income') }}`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
