const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

content = content.replace(
  `          <div className="flex gap-3 mb-4">
            <button
              onClick={() => { setCategory('expense'); setType('material') }}`,
  `          <div className="flex gap-3 mb-4">
            <button
              onClick={() => { setCategory('expense'); setType('material'); setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate('') }}`,
)

content = content.replace(
  `              onClick={() => { setCategory('income'); setType('invoice') }}`,
  `              onClick={() => { setCategory('income'); setType('invoice'); setAmount(''); setQuantity(''); setUnitPrice('') }}`
)

// 也在切换 expense tab 时清空
content = content.replace(
  `<button key={tab.key} onClick={() => setType(tab.key)} className={tab.key === type ? 'px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white' : 'px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600'}>{tab.label}</button>`,
  `<button key={tab.key} onClick={() => { setType(tab.key); setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate('') }} className={tab.key === type ? 'px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white' : 'px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600'}>{tab.label}</button>`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
