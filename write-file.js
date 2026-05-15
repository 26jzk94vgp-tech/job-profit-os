const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/entry/[entryId]/edit/page.tsx', 'utf8')

// 加新 state
content = content.replace(
  "  const [loading, setLoading] = useState(false)",
  `  const [loading, setLoading] = useState(false)
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('unpaid')`
)

// 在 useEffect 里加载付款字段
content = content.replace(
  "        setGstStatus(data.gst_status || 'inclusive')\n        setTaxCategory(data.tax_category || '')",
  `        setGstStatus(data.gst_status || 'inclusive')
        setTaxCategory(data.tax_category || '')
        setPaymentStatus(data.payment_status || 'unpaid')
        setPaymentDueDate(data.payment_due_date || '')`
)

// 在 update 里加付款字段
content = content.replace(
  "    const update: Record<string, unknown> = { description, gst_status: gstStatus, tax_category: taxCategory || null }",
  `    const update: Record<string, unknown> = { description, gst_status: gstStatus, tax_category: taxCategory || null, payment_status: type === 'invoice' ? paymentStatus : null, payment_due_date: type === 'invoice' && paymentDueDate ? paymentDueDate : null }`
)

// 在 invoice/subcontract 表单里加付款字段
content = content.replace(
  `          <div><label className="text-gray-700 text-sm font-medium">Amount ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            </div>
          )}`,
  `          <div><label className="text-gray-700 text-sm font-medium">Amount ($)</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            {type === 'invoice' && (
              <>
                <div><label className="text-gray-700 text-sm font-medium">Payment Due Date</label><input type="date" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} /></div>
                <div><label className="text-gray-700 text-sm font-medium">Payment Status</label><select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></div>
              </>
            )}
          </div>
        )}`
)

fs.writeFileSync('app/jobs/[id]/entry/[entryId]/edit/page.tsx', content)
console.log('done')
