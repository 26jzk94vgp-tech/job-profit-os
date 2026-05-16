const fs = require('fs')
let content = fs.readFileSync('app/import-materials/page.tsx', 'utf8')

content = content.replace(
  `    if (json.success) {
      setResult(json)
      setRows([])
      setFileName('')
      setRowJobs({})`,
  `    if (json.success) {
      setResult({ ...json, gstSaved: totalGst })
      setRows([])
      setFileName('')
      setRowJobs({})`
)

content = content.replace(
  `            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-medium">✅ {lang === 'zh' ? \`成功导入 \${result.count} 条材料记录！\` : \`Successfully imported \${result.count} material entries!\`}</p>
            </div>`,
  `            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <p className="text-green-800 font-medium">✅ {lang === 'zh' ? \`成功导入 \${result.count} 条材料记录！\` : \`Successfully imported \${result.count} material entries!\`}</p>
              <p className="text-green-700 text-sm">💰 {lang === 'zh' ? \`GST 抵扣：\${result.gstSaved?.toFixed(2)} — 已自动计入BAS申报\` : \`GST credit: \$\${result.gstSaved?.toFixed(2)} — automatically added to your BAS\`}</p>
              <p className="text-green-600 text-xs">{lang === 'zh' ? '这笔GST将在下次BAS申报时从应缴税款中扣除' : 'This GST will be deducted from your next BAS payment'}</p>
            </div>`
)

fs.writeFileSync('app/import-materials/page.tsx', content)
console.log('done')
