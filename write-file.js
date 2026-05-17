const fs = require('fs')

// 改首页归档中心描述
let page = fs.readFileSync('app/page.tsx', 'utf8')
page = page.replace(
  "{lang === 'zh' ? '查看已归档和已取消的工单' : 'View archived and cancelled jobs'}",
  "{lang === 'zh' ? '查看已归档和已暂停的工单' : 'View archived and paused jobs'}"
)
fs.writeFileSync('app/page.tsx', page)
console.log('done page')

// 改归档中心页面描述
let archive = fs.readFileSync('app/archive/page.tsx', 'utf8')
archive = archive.replace(
  "{lang === 'zh' ? '将工单状态设为「归档」或「取消」后会显示在这里' : 'Jobs marked as Archived or Cancelled will appear here'}",
  "{lang === 'zh' ? '将工单状态设为「归档」或「暂停」后会显示在这里' : 'Jobs marked as Archived or Paused will appear here'}"
)
fs.writeFileSync('app/archive/page.tsx', archive)
console.log('done archive')
