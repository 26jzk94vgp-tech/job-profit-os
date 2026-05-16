const fs = require('fs')
let content = fs.readFileSync('app/reports/page.tsx', 'utf8')

content = content.replace(
  `          <div className="divide-y divide-gray-100">
            {Object.entries(categoryTotals).map(([cat, total]) => (
              <div key={cat} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{lang === 'zh' ? categoryLabels[cat]?.zh : categoryLabels[cat]?.en || cat}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cat}</span>
                </div>
                <span className={cat === 'other_income' ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
                  {cat === 'other_income' ? '+' : '-'}\${total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>`,
  `          <div className="divide-y divide-gray-100">
            <div className="px-6 py-3 bg-green-50">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">📥 {lang === 'zh' ? '收入' : 'Income'}</p>
            </div>
            {Object.entries(categoryTotals).filter(([cat]) => cat === 'other_income').map(([cat, total]) => (
              <div key={cat} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{lang === 'zh' ? categoryLabels[cat]?.zh : categoryLabels[cat]?.en || cat}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cat}</span>
                </div>
                <span className="font-semibold text-green-600">\${total.toLocaleString()}</span>
              </div>
            ))}
            <div className="px-6 py-3 bg-red-50">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">📤 {lang === 'zh' ? '支出' : 'Expenses'}</p>
            </div>
            {Object.entries(categoryTotals).filter(([cat]) => cat !== 'other_income').map(([cat, total]) => (
              <div key={cat} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{lang === 'zh' ? categoryLabels[cat]?.zh : categoryLabels[cat]?.en || cat}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cat}</span>
                </div>
                <span className="font-semibold text-red-500">\${total.toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(categoryTotals).length > 0 && (
              <div className="px-6 py-4 flex justify-between items-center bg-gray-50">
                <p className="font-bold text-gray-900">💰 {lang === 'zh' ? '应税利润' : 'Taxable Profit'}</p>
                <span className={
                  (categoryTotals['other_income'] || 0) - Object.entries(categoryTotals).filter(([cat]) => cat !== 'other_income').reduce((sum, [, v]) => sum + v, 0) >= 0
                  ? 'font-bold text-green-600'
                  : 'font-bold text-red-600'
                }>
                  \${((categoryTotals['other_income'] || 0) - Object.entries(categoryTotals).filter(([cat]) => cat !== 'other_income').reduce((sum, [, v]) => sum + v, 0)).toLocaleString()}
                </span>
              </div>
            )}
          </div>`
)

fs.writeFileSync('app/reports/page.tsx', content)
console.log('done')
