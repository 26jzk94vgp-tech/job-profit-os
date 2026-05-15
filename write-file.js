const fs = require('fs')
let content = fs.readFileSync('app/api/stripe/checkout/route.ts', 'utf8')
content = content.replace(
  'const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)',
  '// stripe initialized per request'
)
content = content.replace(
  'try {',
  `try {\n    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)`
)
fs.writeFileSync('app/api/stripe/checkout/route.ts', content)
console.log('done checkout')

let webhook = fs.readFileSync('app/api/stripe/webhook/route.ts', 'utf8')
webhook = webhook.replace(
  'const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)',
  '// stripe initialized per request'
)
webhook = webhook.replace(
  'const body = await request.text()',
  `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)\n  const body = await request.text()`
)
fs.writeFileSync('app/api/stripe/webhook/route.ts', webhook)
console.log('done webhook')
