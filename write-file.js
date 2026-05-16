const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

content = content.replace(
  `                <p className="text-white font-medium text-sm">{lang === 'zh' ? '新功能：批量导入Bunnings材料清单' : 'New: Bulk import Bunnings material lists'}</p>
                <p className="text-green-100 text-xs">{lang === 'zh' ? '上传Excel文件，自动识别材料和GST' : 'Upload Excel file, auto-detect materials & GST'}</p>`,
  `                <p className="text-white font-medium text-sm">{lang === 'zh' ? '新功能：一键导入Bunnings收据' : 'New: Import your Bunnings receipts in seconds'}</p>`
)

fs.writeFileSync('app/page.tsx', content)
console.log('done')
