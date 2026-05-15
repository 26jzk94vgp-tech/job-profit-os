const fs = require('fs')
let content = fs.readFileSync('app/cashflow/page.tsx', 'utf8')

content = content.replace(
  `                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">{month}</h3>
                    <span className={net >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                      Net: {net >= 0 ? '+' : '-'}\${Math.abs(net).toLocaleString()}
                    </span>
                  </div>`,
  `                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">{month}</h3>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const monthKeys = Object.keys(months)
                        const currentIndex = monthKeys.indexOf(month)
                        if (currentIndex > 0) {
                          const prevNet = months[monthKeys[currentIndex - 1]].income - months[monthKeys[currentIndex - 1]].expenses
                          if (prevNet !== 0) {
                            const change = ((net - prevNet) / Math.abs(prevNet)) * 100
                            return (
                              <span className={change >= 0 ? 'text-sm text-green-600 font-medium' : 'text-sm text-red-500 font-medium'}>
                                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(0)}% vs last month
                              </span>
                            )
                          }
                        }
                        return null
                      })()}
                      <span className={net >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                        Net: {net >= 0 ? '+' : '-'}\${Math.abs(net).toLocaleString()}
                      </span>
                    </div>
                  </div>`
)

fs.writeFileSync('app/cashflow/page.tsx', content)
console.log('done')
