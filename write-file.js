const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')

// 移除底部链接
c = c.replace(
  `          <div className="px-6 py-3 border-t border-gray-100 text-center">
            <Link href="/archive" className="text-gray-400 text-xs hover:text-gray-600">📦 {lang === 'zh' ? '归档中心' : 'Archive'} →</Link>
          </div>`,
  ''
)

// 在工单列表标题旁加归档链接
c = c.replace(
  `<h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工单列表' : 'Jobs'}</h2>`,
  `<h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工单列表' : 'Jobs'}</h2>
            <Link href="/archive" className="text-gray-400 text-xs hover:text-gray-600">📦 {lang === 'zh' ? '归档' : 'Archive'} →</Link>`
)

fs.writeFileSync('app/page.tsx', c)
console.log('done')
