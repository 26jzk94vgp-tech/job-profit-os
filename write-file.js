const fs = require('fs')
const files = [
  'app/page.tsx',
  'app/components/BottomNav.tsx',
  'lib/i18n/zh.ts',
  'app/jobs/new/page.tsx',
  'app/jobs/[id]/page.tsx',
  'app/clients/page.tsx',
  'app/quotes/page.tsx',
  'app/quotes/new/page.tsx',
  'app/quotes/[id]/page.tsx',
  'app/quotes/[id]/edit/page.tsx',
  'app/cashflow/page.tsx',
  'app/finance/page.tsx',
  'app/tax/page.tsx',
  'app/tax-checklist/page.tsx',
  'app/reports/page.tsx',
  'app/reports/monthly/page.tsx',
  'app/jobs/[id]/add/page.tsx',
  'app/jobs/[id]/entry/[entryId]/edit/page.tsx',
  'app/jobs/[id]/invoice/page.tsx',
  'app/jobs/[id]/edit/page.tsx',
]

let count = 0
files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8')
    if (content.includes('工程')) {
      content = content.replaceAll('工程', '工单')
      fs.writeFileSync(file, content)
      console.log('updated: ' + file)
      count++
    }
  } catch(e) {
    console.log('skip: ' + file)
  }
})
console.log('done, updated ' + count + ' files')
