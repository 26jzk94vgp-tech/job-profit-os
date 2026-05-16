const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/entry/[entryId]/edit/page.tsx', 'utf8')

// 加 state
content = content.replace(
  "  const [loading, setLoading] = useState(false)",
  `  const [loading, setLoading] = useState(false)
  const [showGstInfo, setShowGstInfo] = useState(false)`
)

// 加 ? 按钮
content = content.replace(
  '<label className="text-gray-700 text-sm font-medium">GST Status</label>',
  `<div className="flex items-center gap-2">
              <label className="text-gray-700 text-sm font-medium">GST Status</label>
              <button type="button" onClick={() => setShowGstInfo(!showGstInfo)} className="text-blue-500 text-xs border border-blue-300 rounded-full w-5 h-5 flex items-center justify-center">?</button>
            </div>
            {showGstInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1 mt-1">
                <p>• <strong>Inclusive</strong>: 金额已含10% GST（例如收到 $110，其中 $10 是 GST）</p>
                <p>• <strong>Exclusive</strong>: 金额未含 GST，系统另加10%（$100 → 实收 $110）</p>
                <p>• <strong>GST Free</strong>: 无 GST，例如工资、某些食品</p>
              </div>
            )}`
)

fs.writeFileSync('app/jobs/[id]/entry/[entryId]/edit/page.tsx', content)
console.log('done')
