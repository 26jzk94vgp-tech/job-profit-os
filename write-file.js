const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

// 更新 usedForBas 说明
content = content.replace(
  `    usedForBas: lang === 'zh' ? '用于BAS和税务申报' : 'Used for BAS and tax reporting',`,
  `    usedForBas: lang === 'zh' ? '用于BAS（商业税务申报表）和年度税务申报' : 'Used for BAS (Business Activity Statement) and annual tax return',`
)

// 更新 GST info 弹窗内容
content = content.replace(
  `                {showGstInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1 mt-1">
                    <p>• <strong>Inclusive</strong>: {t.gstInfoInclusive}</p>
                    <p>• <strong>Exclusive</strong>: {t.gstInfoExclusive}</p>
                    <p>• <strong>GST Free</strong>: {t.gstInfoFree}</p>
                  </div>
                )}`,
  `                {showGstInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-2 mt-1">
                    <p className="font-semibold">{lang === 'zh' ? 'GST（商品及服务税）是什么？' : 'What is GST (Goods and Services Tax)?'}</p>
                    <p>{lang === 'zh' ? 'GST 是澳洲的消费税，税率为10%。大多数商品和服务的价格都已包含GST。你可以在收据或发票上找到GST金额。' : 'GST is Australia\'s consumption tax at 10%. Most prices include GST. You can find the GST amount on your receipt or invoice.'}</p>
                    <p className="font-semibold mt-1">{lang === 'zh' ? '如何选择：' : 'How to choose:'}</p>
                    <p>• <strong>Inclusive（含GST）</strong>: {t.gstInfoInclusive} {lang === 'zh' ? '— 收据上的价格已含GST，最常见' : '— Price on receipt already includes GST, most common'}</p>
                    <p>• <strong>Exclusive（不含GST）</strong>: {t.gstInfoExclusive} {lang === 'zh' ? '— 价格未含GST，系统自动加10%' : '— Price excludes GST, system adds 10%'}</p>
                    <p>• <strong>GST Free（免GST）</strong>: {t.gstInfoFree} {lang === 'zh' ? '— 无需缴纳GST，如工资' : '— No GST applies, e.g. wages'}</p>
                    <p className="text-blue-600 mt-1">{lang === 'zh' ? '💡 收据上通常会显示「GST」或「Tax」金额，如Bunnings收据底部会列出GST小计' : '💡 Receipts usually show a GST or Tax amount at the bottom, e.g. Bunnings receipts list GST separately'}</p>
                  </div>
                )}`
)

// 加 ATO info 按钮和说明
content = content.replace(
  `              <label className="text-gray-700 text-sm font-medium">{t.atoCategory}</label>`,
  `              <div className="flex items-center gap-2">
                <label className="text-gray-700 text-sm font-medium">{t.atoCategory}</label>
                <button type="button" onClick={() => setShowAtoInfo(!showAtoInfo)} className="text-blue-500 text-xs border border-blue-300 rounded-full w-5 h-5 flex items-center justify-center">?</button>
              </div>
              {showAtoInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-2 mt-1">
                  <p className="font-semibold">{lang === 'zh' ? 'ATO（澳洲税务局）税务分类是什么？' : 'What is the ATO (Australian Taxation Office) Tax Category?'}</p>
                  <p>{lang === 'zh' ? 'ATO 是澳洲税务局。税务分类帮助你正确申报收入和支出，用于：' : 'The ATO is Australia\'s tax authority. Categories help you correctly report income and expenses for:'}</p>
                  <p>• {lang === 'zh' ? 'BAS（商业税务申报表）— 每季度向ATO申报GST' : 'BAS (Business Activity Statement) — quarterly GST report to ATO'}</p>
                  <p>• {lang === 'zh' ? '年度所得税申报 — 计算应税利润' : 'Annual tax return — calculate taxable profit'}</p>
                  <p className="text-blue-600">{lang === 'zh' ? '💡 系统会根据你选择的条目类型自动设置，一般无需手动修改' : '💡 This is auto​​​​​​​​​​​​​​​​
