const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

// 加在 Jobs 列表前面
content = content.replace(
  `        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工程列表' : 'Jobs'}</h2>
          </div>`,
  `        <div className="md:hidden space-y-3 mb-4">
          {unpaidInvoices.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{lang === 'zh' ? '最近到期应收账款' : 'Upcoming Receivables'}</p>
              <div className="space-y-2">
                {unpaidInvoices.slice(0, 3).sort((a: any, b: any) => new Date(a.payment_due_date || '9999').getTime() - new Date(b.payment_due_date || '9999').getTime()).map((e: any) => (
                  <div key={e.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{e.jobs?.name}</p>
                      {e.payment_due_date && (
                        <p className={new Date(e.payment_due_date) < new Date() ? 'text-xs text-red-500' : 'text-xs text-gray-400'}>
                          {lang === 'zh' ? '到期' : 'Due'}: {formatDate(e.payment_due_date)}
                          {new Date(e.payment_due_date) < new Date() && ' ⚠️'}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-green-600">\${Number(e.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {jobs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{lang === 'zh' ? '最近工程' : 'Recent Jobs'}</p>
              <div className="space-y-2">
                {jobs.slice(0, 3).map((job: any) => {
                  const profit = Number(job.profit)
                  return (
                    <a href={"/jobs/" + job.id} key={job.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{job.name}</p>
                        <p className="text-xs text-gray-400">{job.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className={profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                          {profit >= 0 ? '+' : '-'}\${Math.abs(profit).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">{statusLabel(job.status)}</p>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工程列表' : 'Jobs'}</h2>
          </div>`
)

fs.writeFileSync('app/page.tsx', content)
console.log('done')
