const fs = require('fs')
let c = fs.readFileSync('app/tax/page.tsx', 'utf8')

c = c.replace(
  `            <span className="text-gray-400">→</span>
          </Link>

        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{lang === 'zh' ? '季度申报' : 'Quarterly'}</p>`,
  `            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/import-materials" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '导入材料清单' : 'Import Materials'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '从Bunnings等Excel文件批量导入' : 'Bulk import from Bunnings & supplier Excel files'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{lang === 'zh' ? '季度申报' : 'Quarterly'}</p>`
)

fs.writeFileSync('app/tax/page.tsx', c)
console.log('done, count:', (c.match(/import-materials/g) || []).length)
