const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

content = content
  .replace('>Clients</Link>', '>{t.clients}</Link>')
  .replace('>Quotes</Link>', '>{t.quotes}</Link>')
  .replace('>Tax Report</Link>', '>{t.taxReport}</Link>')
  .replace('>Cash Flow</Link>', '>{t.cashFlow}</Link>')
  .replace('>Sign Out</button>', '>{t.signOut}</button>')

fs.writeFileSync('app/page.tsx', content)
console.log('done')
