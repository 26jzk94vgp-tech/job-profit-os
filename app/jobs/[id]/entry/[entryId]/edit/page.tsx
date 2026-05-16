'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../../../../utils/supabase/client'
import { useLanguage } from '../../../../../../lib/i18n/LanguageContext'

export default function EditEntry({ params }: { params: Promise<{ id: string, entryId: string }> }) {
  const { id, entryId } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [workerName, setWorkerName] = useState('')
  const [hours, setHours] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [gstStatus, setGstStatus] = useState('inclusive')
  const [taxCategory, setTaxCategory] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('unpaid')
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [paymentReceived, setPaymentReceived] = useState('')
  const [showGstInfo, setShowGstInfo] = useState(false)
  const [loading, setLoading] = useState(false)

  const t = {
    back: lang === 'zh' ? '返回' : 'Back',
    editEntry: lang === 'zh' ? '编辑条目' : 'Edit Entry',
    workerName: lang === 'zh' ? '工人姓名' : 'Worker Name',
    hours: lang === 'zh' ? '工时' : 'Hours',
    hourlyRate: lang === 'zh' ? '时薪 ($)' : 'Hourly Rate ($)',
    total: lang === 'zh' ? '合计' : 'Total',
    description: lang === 'zh' ? '描述' : 'Description',
    quantity: lang === 'zh' ? '数量' : 'Quantity',
    unit: lang === 'zh' ? '单位' : 'Unit',
    unitPrice: lang === 'zh' ? '单价 ($)' : 'Unit Price ($)',
    amount: lang === 'zh' ? '金额 ($)' : 'Amount ($)',
    paymentDueDate: lang === 'zh' ? '付款到期日' : 'Payment Due Date',
    paymentStatus: lang === 'zh' ? '付款状态' : 'Payment Status',
    amountReceived: lang === 'zh' ? '已收金额 ($)' : 'Amount Received ($)',
    outstanding: lang === 'zh' ? '未收余额' : 'Outstanding',
    gstStatus: lang === 'zh' ? 'GST 状态' : 'GST Status',
    atoCategory: lang === 'zh' ? 'ATO 税务分类' : 'ATO Tax Category',
    selectCategory: lang === 'zh' ? '选择分类...' : 'Select category...',
    saving: lang === 'zh' ? '保存中...' : 'Saving...',
    save: lang === 'zh' ? '保存修改' : 'Save Changes',
    unpaid: lang === 'zh' ? '未付' : 'Unpaid',
    partial: lang === 'zh' ? '部分付款' : 'Partial Payment',
    paid: lang === 'zh' ? '已付' : 'Paid',
    overdue: lang === 'zh' ? '逾期' : 'Overdue',
    gstInclusive: lang === 'zh' ? '含GST (10%)' : 'Inclusive of GST (10%)',
    gstExclusive: lang === 'zh' ? '不含GST（另加10%）' : 'Exclusive of GST (add 10%)',
    gstFree: lang === 'zh' ? '免GST' : 'GST Free',
    gstUnknown: lang === 'zh' ? '不确定' : 'Unknown',
    gstInclusiveHint: lang === 'zh' ? '金额已包含10% GST' : 'Amount already includes 10% GST',
    gstExclusiveHint: lang === 'zh' ? 'GST将在金额基础上另收' : 'GST will be added on top',
    gstFreeHint: lang === 'zh' ? '无GST（如工资、某些食品）' : 'No GST applies',
    gstInfoInclusive: lang === 'zh' ? '金额已含10% GST（例如收到 $110，其中 $10 是 GST）' : 'Amount includes 10% GST (e.g. receive $110, $10 is GST)',
    gstInfoExclusive: lang === 'zh' ? '金额未含GST，系统另加10%' : 'GST added on top (e.g. $100 → total $110)',
    gstInfoFree: lang === 'zh' ? '无GST，例如工资、某些食品' : 'No GST e.g. wages, fresh food',
  }

  useEffect(() => {
    supabase.from('job_entries').select('*').eq('id', entryId).single().then(({ data }: { data: any }) => {
      if (data) {
        setType(data.type || '')
        setDescription(data.description || '')
        setWorkerName(data.worker_name || '')
        setHours(data.hours?.toString() || '')
        setHourlyRate(data.hourly_rate?.toString() || '')
        setAmount(data.amount?.toString() || '')
        setQuantity(data.quantity?.toString() || '')
        setUnit(data.unit || '')
        setUnitPrice(data.unit_price?.toString() || '')
        setGstStatus(data.gst_status || 'inclusive')
        setTaxCategory(data.tax_category || '')
        setPaymentStatus(data.payment_status || 'unpaid')
        setPaymentDueDate(data.payment_due_date || '')
        setPaymentReceived(data.payment_received ? String(data.payment_received) : '')
      }
    })
  }, [entryId])

  async function handleSave() {
    setLoading(true)
    const update: Record<string, unknown> = {
      description, gst_status: gstStatus, tax_category: taxCategory || null,
      payment_status: type === 'invoice' ? paymentStatus : null,
      payment_due_date: type === 'invoice' && paymentDueDate ? paymentDueDate : null,
      payment_received: type === 'invoice' && paymentReceived ? Number(paymentReceived) : 0
    }
    if (type === 'labor') {
      update.worker_name = workerName
      update.hours = Number(hours)
      update.hourly_rate = Number(hourlyRate)
      update.amount = Number(hours) * Number(hourlyRate)
    } else if (type === 'material') {
      update.quantity = Number(quantity)
      update.unit = unit
      update.unit_price = Number(unitPrice)
      update.amount = quantity && unitPrice ? Number(quantity) * Number(unitPrice) : Number(amount)
    } else {
      update.amount = Number(amount)
    }
    const { error } = await supabase.from('job_entries').update(update).eq('id', entryId)
    if (error) { alert('Error: ' + error.message) } else { window.location.href = '/jobs/' + id }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => window.location.href = '/jobs/' + id} className="text-gray-500 hover:text-gray-700 text-sm">← {t.back}</button>
          <h1 className="font-semibold text-gray-900">{t.editEntry}</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="md:hidden flex items-center gap-3 mb-6">
          <button onClick={() => window.location.href = '/jobs/' + id} className="text-gray-500 text-sm">← {t.back}</button>
          <h1 className="font-semibold text-gray-900">{t.editEntry}</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {type === 'labor' && (
            <>
              <div><label className="text-gray-700 text-sm font-medium">{t.workerName}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={workerName} onChange={(e) => setWorkerName(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">{t.hours}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">{t.hourlyRate}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} /></div>
              {hours && hourlyRate && <p className="text-green-600 text-sm font-medium">{t.total}: ${(Number(hours) * Number(hourlyRate)).toLocaleString()}</p>}
            </>
          )}
          {type === 'material' && (
            <>
              <div><label className="text-gray-700 text-sm font-medium">{t.description}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-gray-700 text-sm font-medium">{t.quantity}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
                <div className="w-24"><label className="text-gray-700 text-sm font-medium">{t.unit}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
              </div>
              <div><label className="text-gray-700 text-sm font-medium">{t.unitPrice}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">{t.amount}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            </>
          )}
          {(type === 'invoice' || type === 'subcontract') && (
            <>
              <div><label className="text-gray-700 text-sm font-medium">{t.description}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div><label className="text-gray-700 text-sm font-medium">{t.amount}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              {type === 'invoice' && (
                <>
                  <div><label className="text-gray-700 text-sm font-medium">{t.paymentDueDate}</label><input type="date" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} /></div>
                  <div><label className="text-gray-700 text-sm font-medium">{t.paymentStatus}</label><select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}><option value="unpaid">{t.unpaid}</option><option value="partial">{t.partial}</option><option value="paid">{t.paid}</option><option value="overdue">{t.overdue}</option></select></div>
                  {paymentStatus === 'partial' && (
                    <div>
                      <label className="text-gray-700 text-sm font-medium">{t.amountReceived}</label>
                      <input type="number" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={paymentReceived} onChange={(e) => setPaymentReceived(e.target.value)} />
                      {paymentReceived && amount && <p className="text-xs text-gray-500 mt-1">{t.outstanding}: ${(Number(amount) - Number(paymentReceived)).toLocaleString()}</p>}
                    </div>
                  )}
                </>
              )}
            </>
          )}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <label className="text-gray-700 text-sm font-medium">{t.gstStatus}</label>
                <button type="button" onClick={() => setShowGstInfo(!showGstInfo)} className="text-blue-500 text-xs border border-blue-300 rounded-full w-5 h-5 flex items-center justify-center">?</button>
              </div>
              {showGstInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1 mt-1">
                  <p>• <strong>Inclusive</strong>: {t.gstInfoInclusive}</p>
                  <p>• <strong>Exclusive</strong>: {t.gstInfoExclusive}</p>
                  <p>• <strong>GST Free</strong>: {t.gstInfoFree}</p>
                </div>
              )}
              <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={gstStatus} onChange={(e) => setGstStatus(e.target.value)}>
                <option value="inclusive">{t.gstInclusive}</option>
                <option value="exclusive">{t.gstExclusive}</option>
                <option value="free">{t.gstFree}</option>
                <option value="unknown">{t.gstUnknown}</option>
              </select>
              {gstStatus === 'inclusive' && <p className="text-gray-400 text-xs mt-1">{t.gstInclusiveHint}</p>}
              {gstStatus === 'exclusive' && <p className="text-blue-500 text-xs mt-1">{t.gstExclusiveHint}</p>}
              {gstStatus === 'free' && <p className="text-gray-400 text-xs mt-1">{t.gstFreeHint}</p>}
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">{t.atoCategory}</label>
              <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={taxCategory} onChange={(e) => setTaxCategory(e.target.value)}>
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
              </select>
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? t.saving : t.save}</button>
        </div>
      </main>
    </div>
  )
}