const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

content = content
  .replace('>Dashboard</h1>', '>{t.dashboard}</h1>')
  .replace('>Total Jobs</p>', '>{t.totalJobs}</p>')
  .replace('>Active Jobs</p>', '>{t.activeJobs}</p>')
  .replace('>Total Profit</p>', '>{t.totalProfit}</p>')
  .replace('<h2 className="font-semibold text-gray-900">Jobs</h2>', '<h2 className="font-semibold text-gray-900">Jobs</h2>')

fs.writeFileSync('app/page.tsx', content)
console.log('done')
