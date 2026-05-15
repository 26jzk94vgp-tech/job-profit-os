const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

content = content.replace(
  '<h2 className="font-semibold text-gray-900">Jobs</h2>',
  '<h2 className="font-semibold text-gray-900">{t.dashboard === "仪表盘" ? "工程列表" : "Jobs"}</h2>'
)

fs.writeFileSync('app/page.tsx', content)
console.log('done')
