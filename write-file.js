const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')

// 移除现有的小链接
c = c.replace(
  `<h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工单列表' : 'Jobs'}</h2>
            <Link href="/archive" className="text-gray-400 text-xs hover:text-gray-600">📦 {lang === 'zh' ? '归档' : 'Archive'} →</Link>`,
  `<h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工单列表' : 'Jobs'}</h2>`
)

// 在工单列表底部加归档中心卡片
c = c.replace(
  `          </div>
        </div>
      </main>
    </div>
  )
}`,
  `          </div>
          <Link href="/archive" className="flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 border-t border-gray-200 rounded-b-xl transition">
            <div className="flex items-center gap-3">
              <span className="text-xl">📦</span>
              <div>
                <p className="font-medium text-gray-700 text-sm">{lang === 'zh' ? '归档中心' : 'Archive Centre'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '查看已归档和已取消的工单' : 'View archived and cancelled jobs'}</p>
              </div>
            </div>
            <span className="text-gray-400 text-sm">→</span>
          </Link>
        </div>
      </main>
    </div>
  )
}`
)

fs.writeFileSync('app/page.tsx', c)
console.log('done')
