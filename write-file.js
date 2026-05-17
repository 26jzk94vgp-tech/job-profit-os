const fs = require('fs')

// 修改转换时存的 notes
let c = fs.readFileSync('app/quotes/[id]/page.tsx', 'utf8')
c = c.replace(
  "notes: lang === 'zh' ? '⚠️ 报价估算，请确认实际采购价格' : '⚠️ Quote estimate — update with actual purchase price'",
  "notes: 'QUOTE_ESTIMATE'"
)
fs.writeFileSync('app/quotes/[id]/page.tsx', c)
console.log('done quotes')

// 修改工单显示时翻译
let p = fs.readFileSync('app/jobs/[id]/page.tsx', 'utf8')
p = p.replace(
  "{entry.notes && <p className=\"text-yellow-600 text-xs mt-1\">⚠️ {entry.notes}</p>}",
  "{entry.notes === 'QUOTE_ESTIMATE' && <p className=\"text-yellow-600 text-xs mt-1\">⚠️ {lang === 'zh' ? '报价估算，请确认实际采购价格' : 'Quote estimate — update with actual purchase price'}</p>}"
)
fs.writeFileSync('app/jobs/[id]/page.tsx', p)
console.log('done jobs')
