const fs = require('fs')
let content = fs.readFileSync('app/quotes/[id]/page.tsx', 'utf8')
content = content.replace(
  '<button onClick={() => window.print()} className="ml-auto px-4 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">',
  '<a href={"/quotes/" + id + "/edit"} className="px-4 py-1 rounded-lg text-xs font-medium bg-gray-700 text-white">{lang === \'zh\' ? \'✏️ 编辑\' : \'✏️ Edit\'}</a>\n          <button onClick={() => window.print()} className="ml-auto px-4 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">'
)
fs.writeFileSync('app/quotes/[id]/page.tsx', content)
console.log('done')
