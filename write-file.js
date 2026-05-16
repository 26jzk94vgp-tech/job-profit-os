const fs = require('fs')
let content = fs.readFileSync('app/tax/page.tsx', 'utf8')

content = content.replace(
  `          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '净应缴GST' : 'Net GST'}</p>
            <p className={netGst >= 0 ? 'text-xl font-bold text-red-500 mt-1' : 'text-xl font-bold text-green-600 mt-1'}>\${Math.abs(netGst).toFixed(0)}</p>
          </div>`,
  `          <div className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer" onClick={() => alert(lang === 'zh' ? '应缴ATO金额说明：\\n\\n这是你每季度需要通过BAS申报交给ATO的GST净额。\\n\\n= 向客户收取的GST\\n- 向供应商支付的GST\\n\\n💡 建议：每次收到含GST的发票时，预留1/11的金额作为GST备用金，避免BAS申报时资金不足。\\n\\n如果是负数，恭喜！ATO会退税给你。' : 'GST Payable to ATO:\\n\\nThis is the net GST you need to pay to the ATO each quarter via your BAS.\\n\\n= GST collected from clients\\n- GST paid to suppliers\\n\\n💡 Tip: Set aside 1/11 of each invoice you receive to cover your GST liability.\\n\\nIf negative, ATO owes YOU a refund!')}>
            <div className="flex items-center gap-1">
              <p className="text-gray-500 text-xs">{lang === 'zh' ? '应缴ATO' : 'GST to ATO'}</p>
              <span className="text-blue-400 text-xs">ℹ️</span>
            </div>
            <p className={netGst >= 0 ? 'text-xl font-bold text-red-500 mt-1' : 'text-xl font-bold text-green-600 mt-1'}>\${Math.abs(netGst).toFixed(0)}</p>
            <p className="text-gray-400 text-xs mt-1">{netGst >= 0 ? (lang === 'zh' ? '点击了解详情' : 'Tap to learn more') : (lang === 'zh' ? '退税！点击了解' : 'Refund! Tap to learn')}</p>
          </div>`
)

fs.writeFileSync('app/tax/page.tsx', content)
console.log('done')
