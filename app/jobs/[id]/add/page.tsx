'use client'

import { useState } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import { use } from 'react'
import { useLanguage } from '../../../../lib/i18n/LanguageContext'

export default function AddEntry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [category, setCategory] = useState('expense')
  const [type, setType] = useState('material')
  const [description, setDescription] = useState('')
  const [workerName, setWorkerName] = useState('')
  const [hours, setHours] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tripFrom, setTripFrom] = useState('')
  const [tripTo, setTripTo] = useState('')
  const [kilometers, setKilometers] = useState('')
  const [atoMethod, setAtoMethod] = useState('cents_per_km')
  const [gstStatus, setGstStatus] = useState('inclusive')
  const [showGstInfo, setShowGstInfo] = useState(false)
  const [showAtoInfo, setShowAtoInfo] = useState(false)
  const [paymentDueDate, setPaymentDueDate] = useState('')

  const [taxCategory, setTaxCategory] = useState('')

  const t = {
    back: lang === 'zh' ? '返回' : 'Back',
    addEntry: lang === 'zh' ? '添加条目' : 'Add Entry',
    scanReceipt: lang === 'zh' ? '拍照扫描收据' : 'Tap to scan receipt',
    scanning: lang === 'zh' ? '正在扫描...' : 'Scanning...',
    tip: lang === 'zh' ? '提示：未知数值填 /' : 'Tip: Use / for unknown values',
    workerName: lang === 'zh' ? '工人姓名' : 'Worker Name',
    hours: lang === 'zh' ? '工时' : 'Hours',
    hourlyRate: lang === 'zh' ? '时薪 ($)' : 'Hourly Rate ($)',
    total: lang === 'zh' ? '合计' : 'Total',
    description: lang === 'zh' ? '描述' : 'Description',
    quantity: lang === 'zh' ? '数量' : 'Quantity',
    unit: lang === 'zh' ? '单位' : 'Unit',
    unitPrice: lang === 'zh' ? '单价 ($)' : 'Unit Price ($)',
    orTotal: lang === 'zh' ? '或直接输入总金额' : 'Or enter total directly',
    amount: lang === 'zh' ? '金额 ($)' : 'Amount ($)',
    paymentDueDate: lang === 'zh' ? '付款到期日' : 'Payment Due Date',
    paymentStatus: lang === 'zh' ? '付款状态' : 'Payment Status',
    amountReceived: lang === 'zh' ? '已收金额 ($)' : 'Amount Received ($)',
    outstanding: lang === 'zh' ? '未收余额' : 'Outstanding',
    atoMethod: lang === 'zh' ? 'ATO计算方式' : 'ATO Calculation Method',
    from: lang === 'zh' ? '出发地' : 'From',
    to: lang === 'zh' ? '目的地' : 'To',
    distance: lang === 'zh' ? '距离 (公里)' : 'Distance (km)',
    deduction: lang === 'zh' ? '可抵扣金额' : 'Deduction',
    actualCost: lang === 'zh' ? '实际油费 ($)' : 'Actual Fuel Cost ($)',
    keepReceipt: lang === 'zh' ? '请保留油费收据' : 'Keep your fuel receipt for ATO records',
    gstStatus: lang === 'zh' ? 'GST 状态' : 'GST Status',
    atoCategory: lang === 'zh' ? 'ATO 税务分类' : 'ATO Tax Category',
    selectCategory: lang === 'zh' ? '选择分类...' : 'Select category...',
    usedForBas: lang === 'zh' ? '用于BAS和税务申报' : 'Used for BAS and tax reporting',
    saving: lang === 'zh' ? '保存中...' : 'Saving...',
    save: lang === 'zh' ? '保存条目' : 'Save Entry',

    labor: lang === 'zh' ? '人工' : 'Labor',
    material: lang === 'zh' ? '材料' : 'Material',
    subcontract: lang === 'zh' ? '分包' : 'Subcontract',
    invoice: lang === 'zh' ? '发票' : 'Invoice',
    fuel: lang === 'zh' ? '油费' : 'Fuel',
    fuelTitle: lang === 'zh' ? '流动工作车辆费用' : 'Itinerant Work Vehicle Expense',
    fuelHint: lang === 'zh' ? '工地间行驶100%可抵税。ATO 2024-25：88分/公里' : 'Travel between job sites is 100% deductible. ATO 2024-25: 88c/km',
    centsPerKm: lang === 'zh' ? '按公里计算 (88分/km)' : 'Cents per km (88c/km - ATO 2024-25)',
    actualCostMethod: lang === 'zh' ? '实际油费（凭收据）' : 'Actual Cost (fuel receipt)',
    gstInclusive: lang === 'zh' ? '含GST (10%)' : 'Inclusive of GST (10%)',
    gstExclusive: lang === 'zh' ? '不含GST（另加10%）' : 'Exclusive of GST (add 10%)',
    gstFree: lang === 'zh' ? '免GST' : 'GST Free',
    gstUnknown: lang === 'zh' ? '不确定' : 'Unknown',
    gstInclusiveHint: lang === 'zh' ? '金额已包含10% GST' : 'Amount already includes 10% GST',
    gstExclusiveHint: lang === 'zh' ? 'GST将在金额基础上另收' : 'GST will be added on top of the amount',
    gstFreeHint: lang === 'zh' ? '无GST（如工资、某些食品）' : 'No GST applies (e.g. wages, some fresh food)',
    gstInfoInclusive: lang === 'zh' ? '金额已含10% GST（例如收到 $110，其中 $10 是 GST）' : 'Amount includes 10% GST (e.g. receive $110, $10 is GST)',
    gstInfoExclusive: lang === 'zh' ? '金额未含 GST，系统另加10%（$100 → 实收 $110）' : 'GST added on top (e.g. $100 → total $110)',
    gstInfoFree: lang === 'zh' ? '无 GST，例如工资、某些食品' : 'No GST e.g. wages, some fresh food',
  }

  function validatePositive(value: string, field: string) {
    if (value === '' || value === '/') { setErrors(e => { const n = {...e}; delete n[field]; return n }); return true }
    if (!/^\d+(\.\d{0,2})?$/.test(value)) {
      setErrors(e => ({ ...e, [field]: lang === 'zh' ? '只能输入数字或 /' : 'Numbers or / only.' }))
      return false
    }
    if (Number(value) < 0) {
      setErrors(e => ({ ...e, [field]: lang === 'zh' ? '不能为负数' : 'Cannot be negative.' }))
      return false
    }
    setErrors(e => { const n = {...e}; delete n[field]; return n })
    return true
  }

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const res = await fetch('/api/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64, mediaType: file.type }) })
      const json = await res.json()
      if (json.success) { setDescription(json.data.description || ''); setAmount(json.data.amount?.toString() || ''); setType(json.data.type || 'material') } else { alert(lang === 'zh' ? '无法读取收据' : 'Could not read receipt') }
      setScanning(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const entry: Record<string, unknown> = { job_id: id, owner_id: user?.id, type, description, gst_status: gstStatus, tax_category: taxCategory || null }
    if (type === 'labor') {
      entry.worker_name = workerName
      entry.hours = hours === '/' ? null : Number(hours)
      entry.hourly_rate = hourlyRate === '/' ? null : Number(hourlyRate)
      entry.amount = (hours === '/' || hourlyRate === '/') ? 0 : Number(hours) * Number(hourlyRate)
    } else if (type === 'material') {
      entry.quantity = quantity === '/' ? null : Number(quantity)
      entry.unit = unit || null
      entry.unit_price = unitPrice === '/' ? null : Number(unitPrice)
      entry.amount = (quantity === '/' || unitPrice === '/') ? (amount === '/' ? 0 : Number(amount)) : Number(quantity) * Number(unitPrice)
    } else if (type === 'fuel') {
      entry.trip_from = tripFrom
      entry.trip_to = tripTo
      entry.kilometers = kilometers === '/' ? null : Number(kilometers)
      entry.ato_method = atoMethod
      entry.amount = atoMethod === 'cents_per_km' && kilometers && kilometers !== '/' ? Number(kilometers) * 0.88 : (amount === '/' ? 0 : Number(amount))
    } else {
      entry.amount = amount === '/' ? 0 : Number(amount)
      if (type === 'invoice') {
        entry.payment_status = 'unpaid'
        entry.payment_due_date = paymentDueDate || null
      }
    }
    const { error } = await supabase.from('job_entries').insert(entry)
    if (error) { alert('Error: ' + error.message) } else { window.location.href = '/jobs/' + id }
    setLoading(false)
  }

  const tabs = category === 'income'
    ? [{ key: 'invoice', label: t.invoice }]
    : [
        { key: 'labor', label: t.labor },
        { key: 'material', label: t.material },
        { key: 'subcontract', label: t.subcontract },
        { key: 'fuel', label: t.fuel },
      ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => window.location.href = "/jobs/" + id} className="text-gray-500 hover:text-gray-700 text-sm">← {t.back}</button>
          <h1 className="font-semibold text-gray-900">{t.addEntry}</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="md:hidden flex items-center gap-3 mb-6">
          <button onClick={() => window.location.href = "/jobs/" + id} className="text-gray-500 text-sm">← {t.back}</button>
          <h1 className="font-semibold text-gray-900">{t.addEntry}</h1>
        </div>
        <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6 cursor-pointer hover:border-blue-400 transition bg-white">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
          {scanning ? <span className="text-blue-500">{t.scanning}</span> : <span className="text-gray-400">📸 {t.scanReceipt}</span>}
        </label>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => { setCategory('expense'); setType('material'); setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate(''); setTaxCategory('cogs_material') }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${category === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              📤 {lang === 'zh' ? '支出' : 'Expense'}
            </button>
            <button
              onClick={() => { setCategory('income'); setType('invoice'); setAmount(''); setQuantity(''); setUnitPrice(''); setTaxCategory('other_income') }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${category === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              📥 {lang === 'zh' ? '收入' : 'Income'}
            </button>
          </div>
          {category === 'expense' && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => {
                  setType(tab.key)
                  setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate('')
                  const defaults: Record<string, string> = { labor: 'cogs_labour', material: 'cogs_material', subcontract: 'subcontractor', fuel: 'vehicle', invoice: 'other_income' }
                  const gstDefaults: Record<string, string> = { labor: 'free', material: 'inclusive', subcontract: 'inclusive', fuel: 'free', invoice: 'inclusive' }
                  setGstStatus(gstDefaults[tab.key] || 'inclusive')
                  setTaxCategory(defaults[tab.key] || '')
                }} className={tab.key === type ? 'px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white' : 'px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600'}>{tab.label}</button>
              ))}
            </div>
          )}
          <p className="text-gray-400 text-xs mb-4">{t.tip}</p>
          <div className="space-y-4">
            {type === 'labor' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                  <p className="text-blue-800 text-xs font-medium">💡 {lang === 'zh' ? '人工记录说明' : 'Labor Note'}</p>
                  <p className="text-blue-600 text-xs">{lang === 'zh' ? '• 仅用于记录支付给直接雇用工人/员工的工资' : '• Only for wages paid to directly employed workers/staff'}</p>
                  <p className="text-blue-600 text-xs">{lang === 'zh' ? '• 作为雇主，你需要代扣PAYG税款并缴纳Super养老金（员工年薪超$450/月）' : '• As employer, you must withhold PAYG tax and pay Super (for employees earning $450+/month)'}</p>
                  <p className="text-blue-600 text-xs">{lang === 'zh' ? '• 如果是你自己做工，无需填写 — 你的劳动价值已包含在利润中' : '• If you do the work yourself, skip this — your labor value is reflected in profit'}</p>
                  <p className="text-blue-600 text-xs">{lang === 'zh' ? '• 如果对方有ABN，请使用「分包」类型' : '• If the worker has an ABN, use Subcontract instead'}</p>
                </div>
                <div><label className="text-gray-700 text-sm font-medium">{t.workerName}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. Tom" value={workerName} onChange={(e) => setWorkerName(e.target.value)} /></div>
                <div><label className="text-gray-700 text-sm font-medium">{t.hours}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 8 (or /)" value={hours} onChange={(e) => { setHours(e.target.value); validatePositive(e.target.value, 'hours') }} />{errors.hours && <p className="text-red-500 text-xs mt-1">{errors.hours}</p>}</div>
                <div><label className="text-gray-700 text-sm font-medium">{t.hourlyRate}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 65 (or /)" value={hourlyRate} onChange={(e) => { setHourlyRate(e.target.value); validatePositive(e.target.value, 'hourlyRate') }} />{errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>}</div>
                {hours && hourlyRate && hours !== '/' && hourlyRate !== '/' && <p className="text-green-600 text-sm font-medium">{t.total}: ${(Number(hours) * Number(hourlyRate)).toLocaleString()}</p>}
              </div>
            ) : type === 'material' ? (
              <div className="space-y-4">
                <div><label className="text-gray-700 text-sm font-medium">{t.description}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. Timber" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="flex gap-3">
                  <div className="flex-1"><label className="text-gray-700 text-sm font-medium">{t.quantity}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 10" value={quantity} onChange={(e) => { setQuantity(e.target.value); validatePositive(e.target.value, 'quantity') }} />{errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}</div>
                  <div className="w-24"><label className="text-gray-700 text-sm font-medium">{t.unit}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="m/kg" value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
                </div>
                <div><label className="text-gray-700 text-sm font-medium">{t.unitPrice}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 12.50" value={unitPrice} onChange={(e) => { setUnitPrice(e.target.value); validatePositive(e.target.value, 'unitPrice') }} />{errors.unitPrice && <p className="text-red-500 text-xs mt-1">{errors.unitPrice}</p>}</div>
                {quantity && unitPrice && quantity !== '/' && unitPrice !== '/' && <p className="text-green-600 text-sm font-medium">{t.total}: ${(Number(quantity) * Number(unitPrice)).toLocaleString()}</p>}
                <div><label className="text-gray-700 text-sm font-medium">{t.orTotal}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 1200 (or /)" value={amount} onChange={(e) => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />{errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}</div>
              </div>
            ) : type === 'fuel' ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm font-medium">🚗 {t.fuelTitle}</p>
                  <p className="text-green-600 text-xs mt-1">{t.fuelHint}</p>
                </div>
                <div><label className="text-gray-700 text-sm font-medium">{t.atoMethod}</label><select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={atoMethod} onChange={(e) => setAtoMethod(e.target.value)}><option value="cents_per_km">{t.centsPerKm}</option><option value="actual_cost">{t.actualCostMethod}</option></select></div>
                <div><label className="text-gray-700 text-sm font-medium">{t.from}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={tripFrom} onChange={(e) => setTripFrom(e.target.value)} /></div>
                <div><label className="text-gray-700 text-sm font-medium">{t.to}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={tripTo} onChange={(e) => setTripTo(e.target.value)} /></div>
                {atoMethod === 'cents_per_km' ? (
                  <div><label className="text-gray-700 text-sm font-medium">{t.distance}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 25" value={kilometers} onChange={(e) => { setKilometers(e.target.value); validatePositive(e.target.value, 'kilometers') }} />{errors.kilometers && <p className="text-red-500 text-xs mt-1">{errors.kilometers}</p>}{kilometers && kilometers !== '/' && <p className="text-green-600 text-sm font-medium mt-1">{t.deduction}: ${(Number(kilometers) * 0.88).toFixed(2)}</p>}</div>
                ) : (
                  <div><label className="text-gray-700 text-sm font-medium">{t.actualCost}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 80" value={amount} onChange={(e) => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />{errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}<p className="text-gray-400 text-xs mt-1">{t.keepReceipt}</p></div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {type === 'subcontract' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-1">
                    <p className="text-orange-800 text-xs font-medium">💡 {lang === 'zh' ? '分包说明' : 'Subcontract Note'}</p>
                    <p className="text-orange-600 text-xs">{lang === 'zh' ? '• 用于支付有ABN的分包商/承包商（非直接雇员）' : '• For payments to subcontractors/contractors with their own ABN'}</p>
                    <p className="text-orange-600 text-xs">{lang === 'zh' ? '• 分包商自己负责处理税务和Super，你无需代扣' : '• Subcontractors handle their own tax and Super — no withholding required'}</p>
                    <p className="text-orange-600 text-xs">{lang === 'zh' ? '• 重要：建筑行业每年必须向ATO提交Taxable Payments Annual Report (TPAR)' : '• Important: Building industry must lodge Taxable Payments Annual Report (TPAR) with ATO annually'}</p>
                    <p className="text-orange-600 text-xs">{lang === 'zh' ? '• 请保留所有分包商的ABN和付款记录' : '• Keep records of all subcontractor ABNs and payments'}</p>
                  </div>
                )}
                <div><label className="text-gray-700 text-sm font-medium">{t.description}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder={type === 'invoice' ? (lang === 'zh' ? '例如：进度款' : 'e.g. Progress payment') : (lang === 'zh' ? '例如：分包商' : 'e.g. Subcontractor')} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div><label className="text-gray-700 text-sm font-medium">{t.amount}</label><input type="text" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder="e.g. 1200 (or /)" value={amount} onChange={(e) => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />{errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}</div>
                {type === 'invoice' && (
                  <>
                    <div><label className="text-gray-700 text-sm font-medium">{t.paymentDueDate}</label><input type="date" className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} /></div>

                  </>
                )}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 text-sm font-medium">{t.gstStatus}</label>
                  <button type="button" onClick={() => setShowGstInfo(!showGstInfo)} className="text-blue-500 text-xs border border-blue-300 rounded-full w-5 h-5 flex items-center justify-center">?</button>
                </div>
                {showGstInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-2 mt-1">
                    <p className="font-semibold">{lang === 'zh' ? 'GST（商品及服务税）是什么？' : 'What is GST (Goods and Services Tax)?'}</p>
                    <p>{lang === 'zh' ? 'GST 是澳洲的消费税，税率10%。大多数商品和服务价格已包含GST。你可以在收据或发票底部找到GST金额，如Bunnings收据会单独列出GST小计。' : "GST is Australia's 10% consumption tax. Most prices include GST. Check the bottom of your receipt or invoice — e.g. Bunnings receipts list the GST amount separately."}</p>
                    <p className="font-semibold">{lang === 'zh' ? '如何选择：' : 'How to choose:'}</p>
                    <p>• <strong>Inclusive</strong>: {t.gstInfoInclusive} {lang === 'zh' ? '— 收据价格已含GST，最常见' : '— Price on receipt includes GST, most common'}</p>
                    <p>• <strong>Exclusive</strong>: {t.gstInfoExclusive} {lang === 'zh' ? '— 价格未含GST，系统自动加10%' : '— Price excludes GST, system adds 10%'}</p>
                    <p>• <strong>GST Free</strong>: {t.gstInfoFree} {lang === 'zh' ? '— 无GST，如工资' : '— No GST, e.g. wages'}</p>
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
                <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                <label className="text-gray-700 text-sm font-medium">{t.atoCategory}</label>
                <button type="button" onClick={() => setShowAtoInfo(!showAtoInfo)} className="text-blue-500 text-xs border border-blue-300 rounded-full w-5 h-5 flex items-center justify-center">?</button>
              </div>
              {showAtoInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1 mt-1">
                  <p className="font-semibold">{lang === 'zh' ? 'ATO（澳洲税务局）税务分类' : 'ATO (Australian Taxation Office) Tax Category'}</p>
                  <p>{lang === 'zh' ? '帮助你正确申报收支，用于BAS（商业税务申报表）季度申报和年度所得税申报。' : 'Helps you correctly report income and expenses for BAS (Business Activity Statement) and annual tax return.'}</p>
                  <p>{lang === 'zh' ? 'BAS = 每季度向ATO申报GST的表格' : 'BAS = quarterly form you lodge with the ATO to report GST'}</p>
                  <p className="text-blue-600">{lang === 'zh' ? '💡 系统已根据条目类型自动设置，一般无需修改' : '💡 Auto-set based on entry type — usually no need to change'}</p>
                </div>
              )}
                <button type="button" onClick={() => setShowAtoInfo(!showAtoInfo)} className="text-blue-500 text-xs border border-blue-300 rounded-full w-5 h-5 flex items-center justify-center">?</button>
              </div>
              {showAtoInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1 mt-1">
                  <p className="font-semibold">{lang === 'zh' ? 'ATO（澳洲税务局）税务分类' : 'ATO (Australian Taxation Office) Tax Category'}</p>
                  <p>{lang === 'zh' ? '帮助你正确申报收支，用于BAS（商业税务申报表）季度申报和年度所得税申报。' : 'Helps you correctly report income and expenses for BAS (Business Activity Statement) and annual tax return.'}</p>
                  <p>{lang === 'zh' ? 'BAS = 每季度向ATO申报GST的表格' : 'BAS = quarterly form you lodge with the ATO to report GST'}</p>
                  <p className="text-blue-600">{lang === 'zh' ? '💡 系统已根据条目类型自动设置，一般无需修改' : '💡 Auto-set based on entry type — usually no need to change'}</p>
                </div>
              )}
                <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={taxCategory} onChange={(e) => setTaxCategory(e.target.value)}>
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
                </select>
                <p className="text-gray-400 text-xs mt-1">{t.usedForBas}</p>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading || Object.keys(errors).length > 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? t.saving : t.save}</button>
          </div>
        </div>
      </main>
    </div>
  )
}