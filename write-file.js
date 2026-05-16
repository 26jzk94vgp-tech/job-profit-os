const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

// 更新 Labor 说明
content = content.replace(
  `                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-xs font-medium">💡 {lang === 'zh' ? '人工记录说明' : 'Labor Note'}</p>
                  <p className="text-blue-600 text-xs mt-1">{lang === 'zh' ? '此处仅记录支付给工人/员工的工资。如果是你自己做工，无需填写，你的劳动价值已包含在利润中。' : 'Only record wages paid to workers/employees. If you do the work yourself, skip this — your labor value is included in the profit.'}</p>
                </div>`,
  `                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                  <p className="text-blue-800 text-xs font-medium">💡 {lang === 'zh' ? '人工记录说明' : 'Labor Note'}</p>
                  <p className="text-blue-600 text-xs">{lang === 'zh' ? '• 仅用于记录支付给直接雇用工人/员工的工资' : '• Only for wages paid to directly employed workers/staff'}</p>
                  <p className="text-blue-600 text-xs">{lang === 'zh' ? '• 作为雇主，你需要代扣PAYG税款并缴纳Super养老金（员工年薪超$450/月）' : '• As employer, you must withhold PAYG tax and pay Super (for employees earning $450+/month)'}</p>
                  <p className="text-blue-600 text-xs">{lang === 'zh' ? '• 如果是你自己做工，无需填写 — 你的劳动价值已包含在利润中' : '• If you do the work yourself, skip this — your labor value is reflected in profit'}</p>
                  <p className="text-blue-600 text-xs">{lang === 'zh' ? '• 如果对方有ABN，请使用「分包」类型' : '• If the worker has an ABN, use Subcontract instead'}</p>
                </div>`
)

// 更新 Subcontract 说明
content = content.replace(
  `                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-orange-800 text-xs font-medium">💡 {lang === 'zh' ? '分包说明' : 'Subcontract Note'}</p>
                    <p className="text-orange-600 text-xs mt-1">{lang === 'zh' ? '用于支付有ABN的分包商/承包商。分包商自己处理税务。注意：每年需提交Taxable Payments Annual Report (TPAR) 给ATO。' : 'For payments to subcontractors/contractors with an ABN. They handle their own tax. Note: You must lodge a Taxable Payments Annual Report (TPAR) with the ATO annually.'}</p>
                  </div>`,
  `                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-1">
                    <p className="text-orange-800 text-xs font-medium">💡 {lang === 'zh' ? '分包说明' : 'Subcontract Note'}</p>
                    <p className="text-orange-600 text-xs">{lang === 'zh' ? '• 用于支付有ABN的分包商/承包商（非直接雇员）' : '• For payments to subcontractors/contractors with their own ABN'}</p>
                    <p className="text-orange-600 text-xs">{lang === 'zh' ? '• 分包商自己负责处理税务和Super，你无需代扣' : '• Subcontractors handle their own tax and Super — no withholding required'}</p>
                    <p className="text-orange-600 text-xs">{lang === 'zh' ? '• 重要：建筑行业每年必须向ATO提交Taxable Payments Annual Report (TPAR)' : '• Important: Building industry must lodge Taxable Payments Annual Report (TPAR) with ATO annually'}</p>
                    <p className="text-orange-600 text-xs">{lang === 'zh' ? '• 请保留所有分包商的ABN和付款记录' : '• Keep records of all subcontractor ABNs and payments'}</p>
                  </div>`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
