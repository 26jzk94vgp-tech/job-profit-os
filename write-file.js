const fs = require('fs')
let c = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

c = c.replace(
  `        <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6 cursor-pointer hover:border-blue-400 transition bg-white">
          <input type="file" accept="image/*" className="hidden" onChange={handleScan} />
          {scanning ? <span className="text-blue-500">{t.scanning}</span> : <span className="text-gray-400">📸 {t.scanReceipt}</span>}
        </label>`,
  `        <div className="flex items-center justify-center w-full border-2 border-dashed border-gray-200 rounded-xl p-6 mb-6 bg-white">
          <div className="text-center">
            <p className="text-gray-300 text-2xl mb-1">📸</p>
            <p className="text-gray-300 text-sm">{lang === 'zh' ? '收据扫描功能升级中，敬请期待' : 'Receipt scanning coming soon'}</p>
          </div>
        </div>`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', c)
console.log('done')
