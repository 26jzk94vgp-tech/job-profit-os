const fs = require('fs')
let content = fs.readFileSync('app/page.tsx', 'utf8')

// 加 super 提醒逻辑（在 statusLabel 函数后面）
content = content.replace(
  `  const statusLabel = (status: string) => {`,
  `  // Super 供款提醒
  const SUPER_CAP = 30000 // 2024-25 concessional cap
  const TAX_THRESHOLD = 45001 // 32.5% tax bracket
  const superReminder = totalProfit > TAX_THRESHOLD

  const statusLabel = (status: string) => {`
)

// 加 super 提醒 UI（在坏账预警后面）
content = content.replace(
  `        {totalReceivable > 0 && (`,
  `        {superReminder && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-purple-800">
                  💰 {lang === 'zh' ? 'Super 供款节税提醒' : 'Super Contribution Tax Tip'}
                </p>
                <p className="text-purple-600 text-sm mt-1">
                  {lang === 'zh'
                    ? \`您的利润已超过 $\${TAX_THRESHOLD.toLocaleString()}，考虑增加 Super 供款最多可节省 \${((totalProfit * 0.325) - ((totalProfit - Math.min(SUPER_CAP, totalProfit * 0.15)) * 0.325)).toFixed(0)} 澳元税款\`
                    : \`Your profit exceeds $\${TAX_THRESHOLD.toLocaleString()}. Consider topping up super (up to $\${SUPER_CAP.toLocaleString()} cap) to reduce your tax bill.\`
                  }
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500">{lang === 'zh' ? '2024-25 供款上限' : '2024-25 Concessional Cap'}</p>
                <p className="font-bold text-purple-700">\$30,000</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500">{lang === 'zh' ? 'Super 税率 vs 个人税率' : 'Super Tax Rate vs Personal'}</p>
                <p className="font-bold text-purple-700">15% vs 32.5%+</p>
              </div>
            </div>
            <p className="text-purple-500 text-xs mt-3">
              {lang === 'zh' ? '⚠️ 请在6月30日前供款以抵扣本财年收入。建议咨询税务代理。' : '⚠️ Contribute before 30 June to claim this financial year. Consult your tax agent.'}
            </p>
          </div>
        )}

        {totalReceivable > 0 && (`
)

fs.writeFileSync('app/page.tsx', content)
console.log('done')
