const fs = require('fs')
let c = fs.readFileSync('app/page.tsx', 'utf8')

// 更新排序下拉框
c = c.replace(
  `<select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">{lang === 'zh' ? '按日期' : 'By Date'}</option>
              <option value="profit">{lang === 'zh' ? '按利润' : 'By Profit'}</option>
              <option value="revenue">{lang === 'zh' ? '按收入' : 'By Revenue'}</option>
              <option value="name">{lang === 'zh' ? '按名称' : 'By Name'}</option>
            </select>`,
  `<select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">{lang === 'zh' ? '最新创建' : 'Newest First'}</option>
              <option value="due">{lang === 'zh' ? '到期日最近' : 'Due Date'}</option>
            </select>`
)

// 更新排序函数
c = c.replace(
  `  function sortJobs(jobList: any[]) {
    return [...jobList].sort((a, b) => {
      if (sortBy === 'profit') return Number(b.profit) - Number(a.profit)
      if (sortBy === 'revenue') return Number(b.revenue) - Number(a.revenue)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }`,
  `  function sortJobs(jobList: any[]) {
    return [...jobList].sort((a, b) => {
      if (sortBy === 'due') {
        const aDue = a.earliest_due_date || '9999-12-31'
        const bDue = b.earliest_due_date || '9999-12-31'
        return new Date(aDue).getTime() - new Date(bDue).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }`
)

fs.writeFileSync('app/page.tsx', c)
console.log('done')
