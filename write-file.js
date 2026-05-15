const fs = require('fs')
let content = fs.readFileSync('app/api/stripe/webhook/route.ts', 'utf8')
content = content.replace(
  'const session = event.data.object as Stripe.CheckoutSession',
  'const session = event.data.object as Stripe.Checkout.Session'
)
fs.writeFileSync('app/api/stripe/webhook/route.ts', content)
console.log('done')
