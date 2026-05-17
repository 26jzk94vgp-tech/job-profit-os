const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')

// 移除升级横幅 state
c = c.replace(
  "\n  const [showPricingBanner, setShowPricingBanner] = useState(true)",
  ''
)

// 移除升级横幅 UI
const bannerStart = c.indexOf('        {showPricingBanner && (')
const bannerEnd = c.indexOf('        )}', bannerStart) + 10
if (bannerStart !== -1) {
  c = c.slice(0, bannerStart) + c.slice(bannerEnd)
}

fs.writeFileSync('app/page.tsx', c)
console.log('done')
