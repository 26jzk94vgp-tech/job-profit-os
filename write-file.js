const fs = require('fs')
let c = fs.readFileSync('app/finance/page.tsx', 'utf8')

const blockStart = c.indexOf('          <Link href="/tax"')
const blockEnd = c.lastIndexOf('</Link>') + 7
const section = c.slice(blockStart, blockEnd)

const links = []
let pos = 0
while (true) {
  const start = section.indexOf('          <Link', pos)
  if (start === -1) break
  const end = section.indexOf('</Link>', start) + 7
  links.push(section.slice(start, end))
  pos = end
}

// 新顺序：月度、现金流、年度、导入、税务
const newOrder = [2, 3, 1, 4, 0]

// 加 border-b 到除最后一个之外的所有链接
const reordered = newOrder.map((i, idx) => {
  let link = links[i]
  // 确保除最后一个外都有 border-b
  if (idx < newOrder.length - 1) {
    link = link.replace('hover:bg-gray-50">', 'hover:bg-gray-50 border-b border-gray-100">')
    link = link.replace('hover:bg-gray-50 border-b border-gray-100 border-b border-gray-100">', 'hover:bg-gray-50 border-b border-gray-100">')
  } else {
    link = link.replace(' border-b border-gray-100', '')
  }
  return link
}).join('\n')

c = c.slice(0, blockStart) + reordered + c.slice(blockEnd)
fs.writeFileSync('app/finance/page.tsx', c)
console.log('done')
