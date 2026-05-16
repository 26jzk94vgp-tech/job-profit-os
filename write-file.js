const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

content = content.replace(
  `<Link href="/finance" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === 'zh' ? '财务' : 'Finance'}</Link>`,
  `<Link href="/finance" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === 'zh' ? '财务' : 'Finance'}</Link>
            <Link href="/import-materials" className="text-gray-600 hover:text-gray-900 text-sm font-medium">{lang === 'zh' ? '导入材料' : 'Import'}</Link>`
)

fs.writeFileSync('app/page.tsx', content)
console.log('done')
