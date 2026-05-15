const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

// 加 state
content = content.replace(
  "  const [badDebts, setBadDebts] = useState<any[]>([])",
  `  const [badDebts, setBadDebts] = useState<any[]>([])
  const [showPricingBanner, setShowPricingBanner] = useState(true)`
)

// 加关闭按钮
content = content.replace(
  `        <Link href="/pricing" className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 mb-2 flex justify-between items-center hover:from-blue-700 hover:to-blue-800 transition">
          <div>
            <p className="font-semibold text-sm">🚀 {lang === 'zh' ? '升级到专业版' : 'Upgrade to Pro'}</p>
            <p className="text-blue-100 text-xs mt-0.5">{lang === 'zh' ? '无限工程 · OCR收据扫描 · 税务报告 · $19/月' : 'Unlimited jobs · Receipt OCR · Tax reports · $19/mo'}</p>
          </div>
          <span className="text-white font-bold text-sm whitespace-nowrap ml-4">{lang === 'zh' ? '查看方案 →' : 'View Plans →'}</span>
        </Link>`,
  `        {showPricingBanner && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 mb-2 flex justify-between items-center">
            <Link href="/pricing" className="flex-1 flex justify-between items-center hover:opacity-90 transition">
              <div>
                <p className="font-semibold text-sm">🚀 {lang === 'zh' ? '升级到专业版' : 'Upgrade to Pro'}</p>
                <p className="text-blue-100 text-xs mt-0.5">{lang === 'zh' ? '无限工程 · OCR收据扫描 · 税务报告 · $19/月' : 'Unlimited jobs · Receipt OCR · Tax reports · $19/mo'}</p>
              </div>
              <span className="text-white font-bold text-sm whitespace-nowrap ml-4">{lang === 'zh' ? '查看方案 →' : 'View Plans →'}</span>
            </Link>
            <button onClick={() => setShowPricingBanner(false)} className="ml-3 text-blue-200 hover:text-white text-lg leading-none">✕</button>
          </div>
        )}`
)

fs.writeFileSync('app/page.tsx', content)
console.log('done')
