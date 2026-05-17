const fs = require('fs')
let c = fs.readFileSync('app/reports/annual/page.tsx', 'utf8')

// 加 sortBy state
c = c.replace(
  "  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())",
  `  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [sortBy, setSortBy] = useState('profit')`
)

// 更新排序逻辑
c = c.replace(
  "  })).sort((a, b) => b.profit - a.profit)",
  `  })).sort((a, b) => {
    if (sortBy === 'profit') return b.profit - a.profit
    if (sortBy === 'revenue') return b.revenue - a.revenue
    if (sortBy === 'margin') return Number(b.margin) - Number(a.margin)
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return b.profit - a.profit
  })`
)

// 加排序按钮在工单排名标题旁
c = c.replace(
  `            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工单盈亏排名' : 'Job Profitability Ranking'}</h2>`,
  `            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工单盈亏排名' : 'Job Profitability Ranking'}</h2>
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="profit">{lang === 'zh' ? '按利润' : 'By Profit'}</option>
                <option value="revenue">{lang === 'zh' ? '按收入' : 'By Revenue'}</option>
                <option value="margin">{lang === 'zh' ? '按利润率' : 'By Margin'}</option>
                <option value="name">{lang === 'zh' ? '按名称' : 'By Name'}</option>
              </select>
            </div>`
)

fs.writeFileSync('app/reports/annual/page.tsx', c)
console.log('done')
