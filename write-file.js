node -e "
const fs = require('fs')
let c = fs.readFileSync('app/jobs/[id]/page.tsx', 'utf8')

// 加 updatePaymentStatus 函数
c = c.replace(
  'const unpaidInvoices = entries.filter((e: any) => e.type === \'invoice\' && e.payment_status !== \'paid\')',
  \`async function updatePaymentStatus(entryId: string, status: string, received?: number) {
    const update: Record<string, unknown> = { payment_status: status }
    if (received !== undefined) update.payment_received = received
    await supabase.from('job_entries').update(update).eq('id', entryId)
    setEntries((prev: any[]) => prev.map((e: any) => e.id === entryId ? { ...e, payment_status: status, payment_received: received ?? e.payment_received } : e))
  }

  const unpaidInvoices = entries.filter((e: any) => e.type === 'invoice' && e.payment_status !== 'paid')\`
)

fs.writeFileSync('app/jobs/[id]/page.tsx', c)
console.log('done')
"
