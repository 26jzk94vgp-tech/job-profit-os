const fs = require('fs')
let content = fs.readFileSync('app/reports/monthly/page.tsx', 'utf8')

// 筛选范围
content = content.replace("'筛选范围'", "lang === 'zh' ? '筛选范围' : 'Filter Period'")
content = content.replace("'全部'", "lang === 'zh' ? '全部' : 'All Time'")
content = content.replace("'自定义'", "lang === 'zh' ? '自定义' : 'Custom'")
content = content.replace("'开始日期'", "lang === 'zh' ? '开始日期' : 'Start Date'")
content = content.replace("'结束日期'", "lang === 'zh' ? '结束日期' : 'End Date'")

// 汇总
content = content.replace("'期间汇总'", "lang === 'zh' ? '期间汇总' : 'Period Summary'")
content = content.replace("'总收入'", "lang === 'zh' ? '总收入' : 'Total Revenue'")
content = content.replace("'总支出'", "lang === 'zh' ? '总支出' : 'Total Expenses'")
content = content.replace("'净利润'", "lang === 'zh' ? '净利润' : 'Net Profit'")

// 月度卡片
content = content.replace("'个工程'", "lang === 'zh' ? '个工程' : 'job(s)'")
content = content.replace("'利润率'", "lang === 'zh' ? '利润率' : 'Margin'")
content = content.replace("'收入'", "lang === 'zh' ? '收入' : 'Revenue'")
content = content.replace("'人工'", "lang === 'zh' ? '人工' : 'Labor'")
content = content.replace("'材料'", "lang === 'zh' ? '材料' : 'Materials'")
content = content.replace("'分包'", "lang === 'zh' ? '分包' : 'Subcontract'")
content = content.replace("'车辆'", "lang === 'zh' ? '车辆' : 'Vehicle/Fuel'")
content = content.replace("'总支出'", "lang === 'zh' ? '总支出' : 'Total Expenses'")
content = content.replace("'该时间段内没有数据'", "lang === 'zh' ? '该时间段内没有数据' : 'No data for this period.'")

fs.writeFileSync('app/reports/monthly/page.tsx', content)
console.log('done')
