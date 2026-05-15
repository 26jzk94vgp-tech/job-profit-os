const fs = require('fs')
let content = fs.readFileSync('app/pricing/page.tsx', 'utf8')
content = content.replace(
  "priceId: 'price_business_monthly'",
  "priceId: 'price_1TXOES3P1ANC7pnyJ5rPVfnf'"
)
fs.writeFileSync('app/pricing/page.tsx', content)
console.log('done')
