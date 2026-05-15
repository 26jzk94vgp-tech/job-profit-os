const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

content = content.replace(
  '<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{job.status}</span>',
  '<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{job.status === "active" ? (t.dashboard === "仪表盘" ? "进行中" : "active") : job.status === "completed" ? (t.dashboard === "仪表盘" ? "已完成" : "completed") : (t.dashboard === "仪表盘" ? "暂停" : "paused")}</span>'
)

fs.writeFileSync('app/page.tsx', content)
console.log('done')
