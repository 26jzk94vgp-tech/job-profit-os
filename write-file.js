const fs = require('fs')
let content = fs.readFileSync('app/tax/page.tsx', 'utf8')

// 找到两个section并交换
const quarterly = content.match(/<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">\s*<div className="px-6 py-3 bg-gray-50 border-b border-gray-100">\s*<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">\{lang === 'zh' \? '季度申报' : 'Quarterly'\}<\/p>\s*<\/div>[\s\S]*?<\/div>\s*<\/div>/)?.[0]

const daily = content.match(/<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">\s*<div className="px-6 py-3 bg-gray-50 border-b border-gray-100">\s*<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">\{lang === 'zh' \? '日常记录' : 'Daily Records'\}<\/p>\s*<\/div>[\s\S]*?<\/div>\s*<\/div>/)?.[0]

if (quarterly && daily) {
  content = content.replace(quarterly, '___QUARTERLY___')
  content = content.replace(daily, '___DAILY___')
  content = content.replace('___QUARTERLY___', daily)
  content = content.replace('___DAILY___', quarterly)
  fs.writeFileSync('app/tax/page.tsx', content)
  console.log('done')
} else {
  console.log('sections not found')
}
