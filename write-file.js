const fs = require('fs')
let content = fs.readFileSync('app/reports/monthly/page.tsx', 'utf8')

content = content.replace(
  /const quarters = \[[\s\S]*?\]/,
  `const quarters = [
    { label: lang === 'zh' ? 'Q1 (7-9月)' : 'Q1 (Jul-Sep)', start: '-07-01', end: '-09-30' },
    { label: lang === 'zh' ? 'Q2 (10-12月)' : 'Q2 (Oct-Dec)', start: '-10-01', end: '-12-31' },
    { label: lang === 'zh' ? 'Q3 (1-3月)' : 'Q3 (Jan-Mar)', start: '-01-01', end: '-03-31' },
    { label: lang === 'zh' ? 'Q4 (4-6月)' : 'Q4 (Apr-Jun)', start: '-04-01', end: '-06-30' },
  ]`
)

fs.writeFileSync('app/reports/monthly/page.tsx', content)
console.log('done')
