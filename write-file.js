const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

content = content.replace(
  '<label className="text-gray-700 text-sm font-medium">GST Status</label>',
  `<div className="flex items-center gap-2">
                  <label className="text-gray-700 text-sm font-medium">GST Status</label>
                  <div className="group relative">
                    <span className="text-blue-500 text-xs cursor-pointer border border-blue-300 rounded-full w-4 h-4 flex items-center justify-center">?</span>
                    <div className="hidden group-hover:block absolute left-0 top-6 bg-gray-900 text-white text-xs rounded-lg p-3 w-64 z-10 shadow-lg">
                      <p className="font-medium mb-1">GST Status 解释：</p>
                      <p className="mb-1">• <strong>Inclusive</strong>: 金额已含10% GST。例如收到 $110，其中 $10 是 GST。</p>
                      <p className="mb-1">• <strong>Exclusive</strong>: 金额未含 GST，系统会另外加10%。例如 $100 → 实收 $110。</p>
                      <p>• <strong>GST Free</strong>: 无 GST，例如工资、某些食品。</p>
                    </div>
                  </div>
                </div>`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
