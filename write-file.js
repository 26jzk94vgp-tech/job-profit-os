const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/page.tsx', 'utf8')

// 更新 statusLabel 函数加 partial
content = content.replace(
  "  const statusLabel = (status: string) => {\n    if (lang !== 'zh') return status\n    const labels: Record<string, string> = { paid: '已付', unpaid: '未付', overdue: '逾期' }\n    return labels[status] || status\n  }",
  `  const statusLabel = (status: string) => {
    if (lang !== 'zh') {
      const enLabels: Record<string, string> = { paid: 'Paid', unpaid: 'Unpaid', overdue: 'Overdue', partial: 'Partial' }
      return enLabels[status] || status
    }
    const labels: Record<string, string> = { paid: '已付', unpaid: '未付', overdue: '逾期', partial: '部分付款' }
    return labels[status] || status
  }`
)

// 加 partial 样式
content = content.replace(
  "entry.payment_status === 'paid' ? 'text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full' :\n                        entry.payment_status === 'overdue' ? 'text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full' :\n                        'text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full'",
  `entry.payment_status === 'paid' ? 'text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full' :
                        entry.payment_status === 'overdue' ? 'text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full' :
                        entry.payment_status === 'partial' ? 'text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full' :
                        'text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full'`
)

// 显示已收金额和未收余额
content = content.replace(
  "  {entry.type === 'invoice' && entry.payment_due_date && <p className=\"text-gray-400 text-xs\">{lang === 'zh' ? '到期' : 'Due'}: {formatDate(entry.payment_due_date)}</p>}",
  `  {entry.type === 'invoice' && entry.payment_due_date && <p className="text-gray-400 text-xs">{lang === 'zh' ? '到期' : 'Due'}: {formatDate(entry.payment_due_date)}</p>}
                  {entry.type === 'invoice' && entry.payment_status === 'partial' && entry.payment_received > 0 && (
                    <p className="text-blue-500 text-xs">{lang === 'zh' ? '已收' : 'Received'}: \${Number(entry.payment_received).toLocaleString()} · {lang === 'zh' ? '未收' : 'Outstanding'}: \${(Number(entry.amount) - Number(entry.payment_received)).toLocaleString()}</p>
                  )}`
)

fs.writeFileSync('app/jobs/[id]/page.tsx', content)
console.log('done')
