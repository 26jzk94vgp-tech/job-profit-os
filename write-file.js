const fs = require('fs')
let content = fs.readFileSync('app/jobs/[id]/add/page.tsx', 'utf8')

// 在 Save Entry 按钮前加 GST 和分类选择
content = content.replace(
  "            <button onClick={handleSubmit} disabled={loading || Object.keys(errors).length > 0}",
  `            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div>
                <label className="text-gray-700 text-sm font-medium">GST Status</label>
                <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={gstStatus} onChange={(e) => setGstStatus(e.target.value)}>
                  <option value="inclusive">Inclusive of GST (10%)</option>
                  <option value="exclusive">Exclusive of GST (add 10%)</option>
                  <option value="free">GST Free</option>
                  <option value="unknown">Unknown</option>
                </select>
                {gstStatus === 'inclusive' && <p className="text-gray-400 text-xs mt-1">Amount already includes 10% GST</p>}
                {gstStatus === 'exclusive' && <p className="text-blue-500 text-xs mt-1">GST will be added on top of the amount</p>}
                {gstStatus === 'free' && <p className="text-gray-400 text-xs mt-1">No GST applies (e.g. wages, some fresh food)</p>}
              </div>
              <div>
                <label className="text-gray-700 text-sm font-medium">ATO Tax Category</label>
                <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={taxCategory} onChange={(e) => setTaxCategory(e.target.value)}>
                  <option value="">Select category...</option>
                  <optgroup label="Income">
                    <option value="other_income">Job Revenue / Income</option>
                  </optgroup>
                  <optgroup label="Cost of Goods Sold">
                    <option value="cogs_material">Materials (COGS)</option>
                    <option value="cogs_labour">Direct Labour (COGS)</option>
                    <option value="subcontractor">Subcontractor Costs</option>
                  </optgroup>
                  <optgroup label="Business Expenses">
                    <option value="vehicle">Vehicle & Travel</option>
                    <option value="tools_equipment">Tools & Equipment</option>
                    <option value="insurance">Insurance</option>
                    <option value="wages">Wages & Salary</option>
                    <option value="super">Superannuation</option>
                    <option value="other_expense">Other Expense</option>
                  </optgroup>
                </select>
                <p className="text-gray-400 text-xs mt-1">Used for BAS and tax reporting</p>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading || Object.keys(errors).length > 0}`
)

fs.writeFileSync('app/jobs/[id]/add/page.tsx', content)
console.log('done ui')
