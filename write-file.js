node -e "
const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')

// 加 showImportTip state
c = c.replace(
  'const [showPricingBanner, setShowPricingBanner] = useState(true)',
  \`const [showPricingBanner, setShowPricingBanner] = useState(true)
  const [showImportTip, setShowImportTip] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('importTipDismissed')
    if (!dismissed) setShowImportTip(true)
  }, [])\`
)

// 加提示条在升级横幅前面
c = c.replace(
  '<div className=\"bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 mb-2 flex justify-between items-center\">',
  \`{showImportTip && (
          <div className=\"bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 mb-2 flex items-center justify-between\">
            <div className=\"flex items-center gap-3\">
              <span className=\"text-2xl\">📊</span>
              <p className=\"text-white font-medium text-sm\">{lang === 'zh' ? '新功能：一键导入Bunnings收据' : 'New: Import your Bunnings receipts in seconds'}</p>
            </div>
            <div className=\"flex items-center gap-3\">
              <a href=\"/import-materials\" className=\"bg-white text-green-600 text-xs font-medium px-3 py-1.5 rounded-lg\">{lang === 'zh' ? '立即使用 →' : 'Try it →'}</a>
              <button onClick={() => { localStorage.setItem('importTipDismissed', '1'); setShowImportTip(false) }} className=\"text-green-100 hover:text-white text-lg\">✕</button>
            </div>
          </div>
        )}
        <div className=\"bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 mb-2 flex justify-between items-center\">\`
)

fs.writeFileSync('app/page.tsx', c)
console.log('done')
"
