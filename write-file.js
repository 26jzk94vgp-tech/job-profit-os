const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/page.tsx', 'utf8')

// 加 updatePayment 函数
content = content.replace(
  `  const unpaidInvoices = entries.filter((e: any) => e.type === 'invoice' && e.payment_status !== 'paid')`,
  `  async function updatePaymentStatus(entryId: string, status: string, received?: number) {
    const update: Record<string, unknown> = { payment_status: status }
    if (received !== undefined) update.payment_received = received
    if (status === 'paid') update.payment_date = new Date().toISOString().split('T')[0]
    await supabase.from('job_entries').update(update).eq('id', entryId)
    setEntries(entries.map((e: any) => e.id === entryId ? { ...e, payment_status: status, payment_received: received ?? e.payment_received } : e))
  }

  const unpaidInvoices = entries.filter((e: any) => e.type === 'invoice' && e.payment_status !== 'paid')`
)

// 加快捷按钮在发票条目里
content = content.replace(
  `  {entry.type === 'invoice' && entry.payment_status === 'partial' && entry.payment_received > 0 && (
                    <p className="text-blue-500 text-xs">{lang === 'zh' ? '已收' : 'Received'}: \${Number(entry.payment_received).toLocaleString()} · {lang === 'zh' ? '未收' : 'Outstanding'}: \${(Number(entry.amount) - Number(entry.payment_received)).toLocaleString()}</p>
                  )}`,
  `  {entry.type === 'invoice' && entry.payment_status === 'partial' && entry.payment_received > 0 && (
                    <p className="text-blue-500 text-xs">{lang === 'zh' ? '已收' : 'Received'}: \${Number(entry.payment_received).toLocaleString()} · {lang === 'zh' ? '未收' : 'Outstanding'}: \${(Number(entry.amount) - Number(entry.payment_received)).toLocaleString()}</p>
                  )}
                  {entry.type === 'invoice' && entry.payment_status !== 'paid' && (
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => updatePaymentStatus(entry.id, 'paid')} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full hover:bg-green-200">
                        ✓ {lang === 'zh' ? '标记已付' : 'Mark​​​​​​​​​​​​​​​​
