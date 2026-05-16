const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

content = content.replace(
  `                <div><label className="text-gray-700 text-sm font-medium">{t.workerName}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. Tom" value={workerName} onChange={(e) => setWorkerName(e.target.value)} /></div>`,
  `                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-xs font-medium">💡 {lang === 'zh' ? '人工记录说明' : 'Labor Note'}</p>
                  <p className="text-blue-600 text-xs mt-1">{lang === 'zh' ? '此处仅记录支付给工人/员工的工资。如果是你自己做工，无需填写，你的劳动价值已包含在利润中。' : 'Only record wages paid to workers/employees. If you do the work yourself, skip this — your labor value is included in the profit.'}</p>
                </div>
                <div><label className="text-gray-700 text-sm font-medium">{t.workerName}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. Tom" value={workerName} onChange={(e) => setWorkerName(e.target.value)} /></div>`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
