const fs = require('fs')
let content = fs.readFileSync('app/api/stripe/checkout/route.ts', 'utf8')
content = content.replace(
  "success_url: process.env.NEXT_PUBLIC_APP_URL + '/settings?subscription=success'",
  "success_url: 'https://job-profit-os-git-main-26jzk94vgp-techs-projects.vercel.app/settings?subscription=success'"
)
content = content.replace(
  "cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/pricing'",
  "cancel_url: 'https://job-profit-os-git-main-26jzk94vgp-techs-projects.vercel.app/pricing'"
)
fs.writeFileSync('app/api/stripe/checkout/route.ts', content)
console.log('done')
