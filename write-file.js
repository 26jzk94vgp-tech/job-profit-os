const fs = require('fs')
let content = fs.readFileSync('app/quotes/page.tsx', 'utf8')
content = content.replace(
  '<Link href={"/quotes/" + quote.id} key={quote.id}>',
  '<a href={"/quotes/" + quote.id} key={quote.id}>'
)
content = content.replace(
  '</Link>\n            ))}\n          </div>',
  '</a>\n            ))}\n          </div>'
)
fs.writeFileSync('app/quotes/page.tsx', content)
console.log('done')
