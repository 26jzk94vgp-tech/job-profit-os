const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

content = content.replace(
  `                <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={taxCategory} onChange={(e) => setTaxCategory(e.target.value)}>
                  <option value="">{t.selectCategory}</option>
                  <optgroup label={lang === 'zh' ? '收入' : 'Income'}><option value="other_income">{lang === 'zh' ? '工单收入' : 'Job Revenue / Income'}</option></optgroup>
                  <optgroup label={lang === 'zh' ? '销售成本' : 'Cost of Goods Sold'}>
                    <option value="cogs_material">{lang === 'zh' ? '材料成本' : 'Materials (COGS)'}</option>
                    <option value="cogs_labour">{lang === 'zh' ? '直接人工' : 'Direct Labour (COGS)'}</option>
                    <option value="subcontractor">{lang === 'zh' ? '分包费用' : 'Subcontractor Costs'}</option>
                  </optgroup>
                  <optgroup label={lang === 'zh' ? '业务支出' : 'Business Expenses'}>
                    <option value="vehicle">{lang === 'zh' ? '车辆交通' : 'Vehicle & Travel'}</option>
                    <option value="tools_equipment">{lang === 'zh' ? '工具设备' : 'Tools & Equipment'}</option>
                    <option value="insurance">{lang === 'zh' ? '保险' : 'Insurance'}</option>
                    <option value="wages">{lang === 'zh' ? '工资薪酬' : 'Wages & Salary'}</option>
                    <option value="super">{lang === 'zh' ? '养老金' : 'Superannuation'}</option>
                    <option value="other_expense">{lang === 'zh' ? '其他支出' : 'Other Expense'}</option>
                  </optgroup>
                </select>`,
  `                <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={taxCategory} onChange={(e) => setTaxCategory(e.target.value)}>
                  <option value="">{t.selectCategory}</option>
                  {category === 'income' ? (
                    <optgroup label={lang === 'zh' ? '收入' : 'Income'}>
                      <option value="other_income">{lang === 'zh' ? '工单收入' : 'Job Revenue / Income'}</option>
                    </optgroup>
                  ) : (
                    <>
                      <optgroup label={lang === 'zh' ? '销售成本' : 'Cost of Goods Sold'}>
                        <option value="cogs_material">{lang === 'zh' ? '材料成本' : 'Materials (COGS)'}</option>
                        <option value="cogs_labour">{lang === 'zh' ? '直接人工' : 'Direct Labour (COGS)'}</option>
                        <option value="subcontractor">{lang === 'zh' ? '分包费用' : 'Subcontractor Costs'}</option>
                      </optgroup>
                      <optgroup label={lang === 'zh' ? '业务支出' : 'Business Expenses'}>
                        <option value="vehicle">{lang === 'zh' ? '车辆交通' : 'Vehicle & Travel'}</option>
                        <option value="tools_equipment">{lang === 'zh' ? '工具设备' : 'Tools & Equipment'}</option>
                        <option value="insurance">{lang === 'zh' ? '保险' : 'Insurance'}</option>
                        <option value="wages">{lang === 'zh' ? '工资薪酬' : 'Wages & Salary'}</option>
                        <option value="super">{lang === 'zh' ? '养老金' : 'Superannuation'}</option>
                        <option value="other_expense">{lang === 'zh' ? '其他支出' : 'Other Expense'}</option>
                      </optgroup>
                    </>
                  )}
                </select>`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done')
