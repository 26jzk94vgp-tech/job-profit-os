const fs = require('fs')
let content = fs.readFileSync('app/tax/page.tsx', 'utf8')

content = content.replace(
  `                <p className="font-medium text-gray-900">{lang === 'zh' ? 'GST & BAS 申报' : 'GST & BAS'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '净应缴GST' : 'Net GST Payable'}: \${netGst.toFixed(2)}</p>`,
  `                <p className="font-medium text-gray-900">{lang === 'zh' ? 'GST、BAS & ATO分类申报' : 'GST, BAS & ATO Categories'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '净应缴GST' : 'Net GST Payable'}: \${netGst.toFixed(2)}</p>`
)

fs.writeFileSync('app/tax/page.tsx', content)
console.log('done')
