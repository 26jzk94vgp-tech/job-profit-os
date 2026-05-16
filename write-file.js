const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

content = content.replace(
  `              <div className="space-y-4">
                <div><label className="text-gray-700 text-sm font-medium">{t.description}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder={type === 'invoice' ? (lang === 'zh' ? '例如：进度款' : 'e.g. Progress payment') : (lang === 'zh' ? '例如：分包商' : 'e.g. Subcontractor')} value={description} onChange={(e) => setDescription(e.target.value)} /></div>`,
  `              <div className="space-y-4">
                {type === 'subcontract' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-orange-800 text-xs font-medium">💡 {lang === 'zh' ? '分包说明' : 'Subcontract Note'}</p>
                    <p className="text-orange-600 text-xs mt-1">{lang === 'zh' ? '用于支付有ABN的分包商/承包商。分包商自己处理税务。注意：每年需提交Taxable Payments Annual Report (TPAR) 给ATO。' : 'For payments to subcontractors/contractors with an ABN. They handle their own tax. Note: You must lodge a Taxable Payments Annual Report (TPAR) with the ATO annually.'}</p>
                  </div>
                )}
                <div><label className="text-gray-700 text-sm font-medium">{t.description}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder={type === 'invoice' ? (lang === 'zh' ? '例如：进度款' : 'e.g. Progress payment') : (lang === 'zh' ? '例如：分包商' : 'e.g. Subcontractor')} value={description} onChange={(e) => setDescription(e.target.value)} /></div>`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
