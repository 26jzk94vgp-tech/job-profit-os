const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

// 加 category state
content = content.replace(
  "  const [type, setType] = useState('material')",
  `  const [category, setCategory] = useState('expense')
  const [type, setType] = useState('material')`
)

// 替换 tabs 部分
content = content.replace(
  `  const tabs = [
    { key: 'labor', label: t.labor },
    { key: 'material', label: t.material },
    { key: 'subcontract', label: t.subcontract },
    { key: 'invoice', label: t.invoice },
    { key: 'fuel', label: t.fuel },
  ]`,
  `  const tabs = category === 'income'
    ? [{ key: 'invoice', label: t.invoice }]
    : [
        { key: 'labor', label: t.labor },
        { key: 'material', label: t.material },
        { key: 'subcontract', label: t.subcontract },
        { key: 'fuel', label: t.fuel },
      ]`
)

// 加 category 切换 UI（在 tabs 前面）
content = content.replace(
  `          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setType(tab.key)} className={tab.key === type ? 'px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white' : 'px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600'}>{tab.label}</button>
            ))}
          </div>`,
  `          <div className="flex gap-3 mb-4">
            <button
              onClick={() => { setCategory('expense'); setType('material') }}
              className={\`flex-1 py-3 rounded-xl text-sm font-medium transition \${category === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}\`}
            >
              📤 {lang === 'zh' ? '支出' : 'Expense'}
            </button>
            <button
              onClick={() => { setCategory('income'); setType('invoice') }}
              className={\`flex-1 py-3 rounded-xl text-sm font-medium transition \${category === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}\`}
            >
              📥 {lang === 'zh' ? '收入' : 'Income'}
            </button>
          </div>
          {category === 'expense' && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setType(tab.key)} className={tab.key === type ? 'px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white' : 'px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600'}>{tab.label}</button>
              ))}
            </div>
          )}`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
