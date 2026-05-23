'use client'

import { useState } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import { use } from 'react'
import { useLanguage } from '../../../../lib/i18n/LanguageContext'

export default function AddEntry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()

  // ✅ 读取 ?type=invoice 参数，自动预选收入+发票
  const isInvoicePreset = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('type') === 'invoice'

  const [category, setCategory] = useState(isInvoicePreset ? 'income' : 'expense')
  const [type, setType] = useState(isInvoicePreset ? 'invoice' : 'material')
  const [description, setDescription] = useState('')
  const [suggestedType, setSuggestedType] = useState<string | null>(null)
  const [classifying, setClassifying] = useState(false)
  const [workerName, setWorkerName] = useState('')
  const [hours, setHours] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tripFrom, setTripFrom] = useState('')
  const [tripTo, setTripTo] = useState('')
  const [kilometers, setKilometers] = useState('')
  const [atoMethod, setAtoMethod] = useState('cents_per_km')
  const [gstStatus, setGstStatus] = useState('inclusive')
  const [showGstInfo, setShowGstInfo] = useState(false)
  const [showAtoInfo, setShowAtoInfo] = useState(false)
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('unpaid')
  const [taxCategory, setTaxCategory] = useState(isInvoicePreset ? 'other_income' : '')

  const t = {
    back: lang === 'zh' ? '返回' : 'Back',
    addEntry: lang === 'zh' ? '添加条目' : 'Add Entry',
    tip: lang === 'zh' ? '提示：未知数值填 /' : 'Tip: Use / for unknown values',
    workerName: lang === 'zh' ? '工人姓名 *' : 'Worker Name *',
    hours: lang === 'zh' ? '工时 *' : 'Hours *',
    hourlyRate: lang === 'zh' ? '时薪 ($) *' : 'Hourly Rate ($) *',
    total: lang === 'zh' ? '合计' : 'Total',
    description: lang === 'zh' ? '描述 *' : 'Description *',
    quantity: lang === 'zh' ? '数量 *' : 'Quantity *',
    unit: lang === 'zh' ? '单位' : 'Unit',
    unitPrice: lang === 'zh' ? '单价 ($) *' : 'Unit Price ($) *',
    orTotal: lang === 'zh' ? '或直接输入总金额 *' : 'Or enter total directly *',
    amount: lang === 'zh' ? '金额 ($) *' : 'Amount ($) *',
    paymentDueDate: lang === 'zh' ? '收款日 / 收款到期日' : 'Payment Received / Due Date',
    paymentStatusLabel: lang === 'zh' ? '收款状态 *' : 'Collection Status *',
    collected: lang === 'zh' ? '已收款' : 'Collected',
    uncollected: lang === 'zh' ? '未收款' : 'Not Yet Collected',
    atoMethod: lang === 'zh' ? 'ATO计算方式' : 'ATO Calculation Method',
    from: lang === 'zh' ? '出发地 *' : 'From *',
    to: lang === 'zh' ? '目的地 *' : 'To *',
    distance: lang === 'zh' ? '距离 (公里) *' : 'Distance (km) *',
    deduction: lang === 'zh' ? '可抵扣金额' : 'Deduction',
    actualCost: lang === 'zh' ? '实际油费 ($) *' : 'Actual Fuel Cost ($) *',
    keepReceipt: lang === 'zh' ? '请保留油费收据' : 'Keep your fuel receipt for records',
    gstStatus: lang === 'zh' ? 'GST 状态 *' : 'GST (Goods and Services Tax) Status *',
    atoCategory: lang === 'zh' ? 'ATO 税务分类 *' : 'Tax Category *',
    selectCategory: lang === 'zh' ? '选择分类...' : 'Select category...',
    usedForBas: lang === 'zh'
      ? '用于季度 BAS（商业税务申报表）和年度所得税申报'
      : 'Used for your quarterly BAS (Business Activity Statement) and annual income tax return',
    saving: lang === 'zh' ? '保存中...' : 'Saving...',
    save: lang === 'zh' ? '保存条目' : 'Save Entry',
    labor: lang === 'zh' ? '人工' : 'Labor',
    material: lang === 'zh' ? '材料' : 'Material',
    subcontract: lang === 'zh' ? '分包' : 'Subcontract',
    invoice: lang === 'zh' ? '发票/收入' : 'Invoice / Income',
    fuel: lang === 'zh' ? '油费' : 'Fuel',
    fuelTitle: lang === 'zh' ? '流动工作车辆费用' : 'Vehicle Expense (Itinerant Work)',
    fuelHint: lang === 'zh' ? '工地间行驶100%可抵税。ATO 2024-25：88分/公里' : 'Travel between job sites is 100% deductible. ATO 2024-25 rate: 88c/km',
    centsPerKm: lang === 'zh' ? '按公里计算 (88分/km)' : 'Cents per km (88c/km — ATO 2024-25 rate)',
    actualCostMethod: lang === 'zh' ? '实际油费（凭收据）' : 'Actual Cost (with fuel receipt)',
    gstInclusive: lang === 'zh' ? '含GST (10%)' : 'Inclusive of GST (10%)',
    gstExclusive: lang === 'zh' ? '不含GST（另加10%）' : 'Exclusive of GST (add 10%)',
    gstFree: lang === 'zh' ? '免GST' : 'GST Free',
    gstUnknown: lang === 'zh' ? '不确定' : 'Unknown',
    gstInclusiveHint: lang === 'zh' ? '金额已包含10% GST' : 'Amount already includes 10% GST',
    gstExclusiveHint: lang === 'zh' ? 'GST将在金额基础上另收' : 'GST will be added on top of the amount',
    gstFreeHint: lang === 'zh' ? '无GST（如工资、某些食品）' : 'No GST applies (e.g. wages, some fresh food)',
  }

  async function lookupHistoricalPrice(desc: string) {
    if (!desc || desc.length < 2 || category !== 'expense') return
    setClassifying(true)
    setSuggestedType(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: entries } = await supabase
        .from('job_entries')
        .select('amount, quantity, unit_price, description')
        .eq('owner_id', user.id)
        .eq('type', 'material')
        .ilike('description', '%' + desc + '%')
        .order('created_at', { ascending: false })
        .limit(10)
      if (entries && entries.length > 0) {
        const prices = entries
          .map((e: any) => Number(e.unit_price) || (Number(e.amount) / (Number(e.quantity) || 1)))
          .filter((p: number) => p > 0)
        if (prices.length > 0) {
          const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length
          setSuggestedType(`$${avg.toFixed(2)} avg (${prices.length} records)`)
        }
      }
    } catch {}
    setClassifying(false)
  }

  function validatePositive(value: string, field: string) {
    if (value === '' || value === '/') { setErrors(e => { const n = {...e}; delete n[field]; return n }); return true }
    if (!/^\d+(\.\d{0,2})?$/.test(value)) {
      setErrors(e => ({ ...e, [field]: lang === 'zh' ? '请输入正数（不能为负数）' : 'Must be a positive number (no negatives)' }))
      return false
    }
    setErrors(e => { const n = {...e}; delete n[field]; return n }); return true
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}
    const req = lang === 'zh' ? '此项为必填' : 'This field is required'

    if (!taxCategory) newErrors.taxCategory = req

    if (type === 'labor') {
      if (!workerName) newErrors.workerName = req
      if (!hours || hours === '/') newErrors.hours = req
      if (!hourlyRate || hourlyRate === '/') newErrors.hourlyRate = req
    } else if (type === 'material') {
      if (!description) newErrors.description = req
      const hasQtyPrice = quantity && quantity !== '/' && unitPrice && unitPrice !== '/'
      const hasAmount = amount && amount !== '/'
      if (!hasQtyPrice && !hasAmount) newErrors.amount = lang === 'zh' ? '请填写数量+单价，或直接填写总金额' : 'Enter quantity + unit price, or a total amount'
    } else if (type === 'fuel') {
      if (!tripFrom) newErrors.tripFrom = req
      if (!tripTo) newErrors.tripTo = req
      if (atoMethod === 'cents_per_km' && (!kilometers || kilometers === '/')) newErrors.kilometers = req
      if (atoMethod === 'actual_cost' && (!amount || amount === '/')) newErrors.amount = req
    } else if (type === 'invoice' || type === 'subcontract') {
      if (!description) newErrors.description = req
      if (!amount || amount === '/') newErrors.amount = req
    }

    if (type !== 'invoice' && (!gstStatus || gstStatus === '')) newErrors.gstStatus = req

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validateForm()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const entry: Record<string, unknown> = {
      job_id: id, owner_id: user?.id, type, description,
      gst_status: type === 'invoice' ? 'inclusive' : gstStatus,
      tax_category: taxCategory || null
    }
    if (type === 'labor') {
      entry.worker_name = workerName
      entry.hours = hours === '/' ? null : Number(hours)
      entry.hourly_rate = hourlyRate === '/' ? null : Number(hourlyRate)
      entry.amount = (hours === '/' || hourlyRate === '/') ? 0 : Number(hours) * Number(hourlyRate)
    } else if (type === 'material') {
      entry.quantity = quantity === '/' ? null : Number(quantity)
      entry.unit = unit || null
      entry.unit_price = unitPrice === '/' ? null : Number(unitPrice)
      entry.amount = (quantity && unitPrice && quantity !== '/' && unitPrice !== '/') ? Number(quantity) * Number(unitPrice) : (amount === '/' ? 0 : Number(amount))
    } else if (type === 'fuel') {
      entry.trip_from = tripFrom; entry.trip_to = tripTo
      entry.kilometers = kilometers === '/' ? null : Number(kilometers)
      entry.ato_method = atoMethod
      entry.amount = atoMethod === 'cents_per_km' && kilometers && kilometers !== '/' ? Number(kilometers) * 0.88 : (amount === '/' ? 0 : Number(amount))
    } else {
      entry.amount = amount === '/' ? 0 : Number(amount)
      if (type === 'invoice') {
        entry.payment_status = paymentStatus
        entry.payment_due_date = paymentDueDate || null
      }
    }
    const { error } = await supabase.from('job_entries').insert(entry)
    if (error) { alert('Error: ' + error.message) } else { window.location.href = '/jobs/' + id }
    setLoading(false)
  }

  const tabs = category === 'income'
    ? [{ key: 'invoice', label: t.invoice }]
    : [{ key: 'labor', label: t.labor }, { key: 'material', label: t.material }, { key: 'subcontract', label: t.subcontract }, { key: 'fuel', label: t.fuel }]

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 text-gray-900 dark:text-[#F2F2F7] dark:bg-[#3A3A3C] outline-none focus:ring-2 focus:ring-blue-500/40 transition"
  const errCls = "text-[#FF453A] text-xs mt-1"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1C1C1E] pt-12 md:pt-0">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => window.location.href = "/jobs/" + id} className="text-gray-400 dark:text-[#8E8E93] text-sm">← {t.back}</button>
          <h1 className="font-semibold text-gray-900 dark:text-white">{t.addEntry}</h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="md:hidden flex items-center gap-3 mb-6">
          <button onClick={() => window.location.href = "/jobs/" + id} className="text-[#8E8E93] text-sm">← {t.back}</button>
          <h1 className="font-semibold text-gray-900 dark:text-white">{t.addEntry}</h1>
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6 space-y-6">

          {/* Income / Expense */}
          <div className="flex gap-3">
            <button onClick={() => { setCategory('expense'); setType('material'); setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate(''); setTaxCategory('cogs_material'); setErrors({}) }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${category === 'expense' ? 'bg-[#FF453A] text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
              📤 {lang === 'zh' ? '支出' : 'Expense'}
            </button>
            <button onClick={() => { setCategory('income'); setType('invoice'); setAmount(''); setQuantity(''); setUnitPrice(''); setTaxCategory('other_income'); setPaymentStatus('unpaid'); setErrors({}) }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${category === 'income' ? 'bg-[#30D158] text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
              📥 {lang === 'zh' ? '收入' : 'Income'}
            </button>
          </div>

          {/* Type tabs (expense only) */}
          {category === 'expense' && (
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => {
                  setType(tab.key); setAmount(''); setQuantity(''); setUnitPrice(''); setHours(''); setHourlyRate(''); setErrors({})
                  const defaults: Record<string, string> = { labor: 'cogs_labour', material: 'cogs_material', subcontract: 'subcontractor', fuel: 'vehicle' }
                  const gstDefaults: Record<string, string> = { labor: 'free', material: 'inclusive', subcontract: 'inclusive', fuel: 'free' }
                  setGstStatus(gstDefaults[tab.key] || 'inclusive')
                  setTaxCategory(defaults[tab.key] || '')
                }} className={`px-3 py-2 rounded-xl text-sm font-medium transition ${tab.key === type ? 'bg-[#0A84FF] text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <p className="text-[#8E8E93] text-xs">* {lang === 'zh' ? '为必填项' : 'required fields'}</p>

          {/* ── INVOICE (income) ── */}
          {type === 'invoice' && (
            <div className="space-y-5">
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.description}</label>
                <input className={inputCls} placeholder={lang === 'zh' ? '例如：进度款' : 'e.g. Progress payment'} value={description} onChange={e => { setDescription(e.target.value); setSuggestedType(null) }} onBlur={e => lookupHistoricalPrice(e.target.value)} />
                {errors.description && <p className={errCls}>{errors.description}</p>}
                {classifying && <p className="text-xs text-[#8E8E93] mt-1">📊 {lang === 'zh' ? '查询历史成本均价...' : 'Looking up cost history...'}</p>}
                {suggestedType && !classifying && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-[#8E8E93]">📊 {lang === 'zh' ? '历史成本均价:' : 'Hist. cost avg:'}</span>
                    <button onClick={() => { const price = suggestedType?.match(/\$([\d.]+)/)?.[1]; if (price) setUnitPrice(price); setSuggestedType(null) }}
                      className="text-xs bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 rounded-full font-medium hover:bg-[#0A84FF]/20 transition-colors">
                      {suggestedType} ✓
                    </button>
                    <button onClick={() => setSuggestedType(null)} className="text-xs text-[#8E8E93]">✕</button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.amount}</label>
                <input type="text" className={inputCls} placeholder="e.g. 5000" value={amount} onChange={e => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />
                {errors.amount && <p className={errCls}>{errors.amount}</p>}
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.paymentStatusLabel}</label>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setPaymentStatus('unpaid')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${paymentStatus === 'unpaid' ? 'bg-[#FF9F0A] text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
                    ⏳ {t.uncollected}
                  </button>
                  <button onClick={() => setPaymentStatus('paid')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${paymentStatus === 'paid' ? 'bg-[#30D158] text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
                    ✅ {t.collected}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.paymentDueDate}</label>
                <input type="date" className={inputCls} value={paymentDueDate} onChange={e => setPaymentDueDate(e.target.value)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.atoCategory}</label>
                  <button type="button" onClick={() => setShowAtoInfo(!showAtoInfo)} className="text-[#0A84FF] text-xs border border-[#0A84FF]/40 rounded-full w-5 h-5 flex items-center justify-center shrink-0">?</button>
                </div>
                {showAtoInfo && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1 mt-2">
                    <p>{lang === 'zh' ? '澳洲税务局（ATO）要求按正确类别申报收入，用于季度 BAS 和年度所得税申报。系统已自动设置，一般无需修改。' : 'The ATO (Australian Taxation Office) requires correct categorisation for your quarterly BAS and annual tax return. Auto-set — usually no need to change.'}</p>
                  </div>
                )}
                <select className={inputCls} value={taxCategory} onChange={e => setTaxCategory(e.target.value)}>
                  <option value="">{t.selectCategory}</option>
                  <optgroup label={lang === 'zh' ? '收入' : 'Income'}>
                    <option value="other_income">{lang === 'zh' ? '工单收入' : 'Job Revenue / Income'}</option>
                  </optgroup>
                </select>
                {errors.taxCategory && <p className={errCls}>{errors.taxCategory}</p>}
                <p className="text-[#8E8E93] text-xs mt-1">{t.usedForBas}</p>
              </div>
            </div>
          )}

          {/* ── LABOR ── */}
          {type === 'labor' && (
            <div className="space-y-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl p-3 space-y-1">
                <p className="text-blue-800 dark:text-blue-300 text-xs font-medium">💡 {lang === 'zh' ? '人工记录说明' : 'Labor Note'}</p>
                <p className="text-blue-600 dark:text-blue-400 text-xs">{lang === 'zh' ? '• 仅用于记录支付给直接雇用工人/员工的工资' : '• Only for wages paid to directly employed workers/staff'}</p>
                <p className="text-blue-600 dark:text-blue-400 text-xs">{lang === 'zh' ? '• 如果对方有ABN，请使用「分包」类型' : '• If the worker has an ABN, use Subcontract instead'}</p>
              </div>
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.workerName}</label><input className={inputCls} placeholder="e.g. Tom" value={workerName} onChange={e => setWorkerName(e.target.value)} />{errors.workerName && <p className={errCls}>{errors.workerName}</p>}</div>
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.hours}</label><input type="text" className={inputCls} placeholder="e.g. 8" value={hours} onChange={e => { setHours(e.target.value); validatePositive(e.target.value, 'hours') }} />{errors.hours && <p className={errCls}>{errors.hours}</p>}</div>
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.hourlyRate}</label><input type="text" className={inputCls} placeholder="e.g. 65" value={hourlyRate} onChange={e => { setHourlyRate(e.target.value); validatePositive(e.target.value, 'hourlyRate') }} />{errors.hourlyRate && <p className={errCls}>{errors.hourlyRate}</p>}</div>
              {hours && hourlyRate && hours !== '/' && hourlyRate !== '/' && <p className="text-[#30D158] text-sm font-medium">{t.total}: ${(Number(hours) * Number(hourlyRate)).toLocaleString()}</p>}
            </div>
          )}

          {/* ── MATERIAL ── */}
          {type === 'material' && (
            <div className="space-y-5">
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.description}</label><input className={inputCls} placeholder="e.g. Timber" value={description} onChange={e => { setDescription(e.target.value); setSuggestedType(null) }} onBlur={e => lookupHistoricalPrice(e.target.value)} />{errors.description && <p className={errCls}>{errors.description}</p>}
                {classifying && <p className="text-xs text-[#8E8E93] mt-1">📊 {lang === 'zh' ? '查询历史成本均价...' : 'Looking up cost history...'}</p>}
                {suggestedType && !classifying && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-[#8E8E93]">📊 {lang === 'zh' ? '历史成本均价:' : 'Hist. cost avg:'}</span>
                    <button onClick={() => { const price = suggestedType?.match(/\$([\d.]+)/)?.[1]; if (price) setUnitPrice(price); setSuggestedType(null) }}
                      className="text-xs bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 rounded-full font-medium hover:bg-[#0A84FF]/20 transition-colors">
                      {suggestedType} ✓
                    </button>
                    <button onClick={() => setSuggestedType(null)} className="text-xs text-[#8E8E93]">✕</button>
                  </div>
                )}</div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.quantity}</label><input type="text" className={inputCls} placeholder="e.g. 10" value={quantity} onChange={e => { setQuantity(e.target.value); validatePositive(e.target.value, 'quantity') }} />{errors.quantity && <p className={errCls}>{errors.quantity}</p>}</div>
                <div className="w-24"><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.unit}</label><input className={inputCls} placeholder="m/kg" value={unit} onChange={e => setUnit(e.target.value)} /></div>
              </div>
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.unitPrice}</label><input type="text" className={inputCls} placeholder="e.g. 12.50" value={unitPrice} onChange={e => { setUnitPrice(e.target.value); validatePositive(e.target.value, 'unitPrice') }} />{errors.unitPrice && <p className={errCls}>{errors.unitPrice}</p>}</div>
              {quantity && unitPrice && quantity !== '/' && unitPrice !== '/' && <p className="text-[#30D158] text-sm font-medium">{t.total}: ${(Number(quantity) * Number(unitPrice)).toLocaleString()}</p>}
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.orTotal}</label><input type="text" className={inputCls} placeholder="e.g. 1200" value={amount} onChange={e => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />{errors.amount && <p className={errCls}>{errors.amount}</p>}</div>
            </div>
          )}

          {/* ── FUEL ── */}
          {type === 'fuel' && (
            <div className="space-y-5">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-xl p-3">
                <p className="text-green-800 dark:text-green-300 text-sm font-medium">🚗 {t.fuelTitle}</p>
                <p className="text-green-600 dark:text-green-400 text-xs mt-1">{t.fuelHint}</p>
              </div>
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.atoMethod}</label>
                <select className={inputCls} value={atoMethod} onChange={e => setAtoMethod(e.target.value)}>
                  <option value="cents_per_km">{t.centsPerKm}</option>
                  <option value="actual_cost">{t.actualCostMethod}</option>
                </select>
              </div>
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.from}</label><input className={inputCls} value={tripFrom} onChange={e => setTripFrom(e.target.value)} />{errors.tripFrom && <p className={errCls}>{errors.tripFrom}</p>}</div>
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.to}</label><input className={inputCls} value={tripTo} onChange={e => setTripTo(e.target.value)} />{errors.tripTo && <p className={errCls}>{errors.tripTo}</p>}</div>
              {atoMethod === 'cents_per_km' ? (
                <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.distance}</label><input type="text" className={inputCls} placeholder="e.g. 25" value={kilometers} onChange={e => { setKilometers(e.target.value); validatePositive(e.target.value, 'kilometers') }} />{errors.kilometers && <p className={errCls}>{errors.kilometers}</p>}{kilometers && kilometers !== '/' && <p className="text-[#30D158] text-sm font-medium mt-1">{t.deduction}: ${(Number(kilometers) * 0.88).toFixed(2)}</p>}</div>
              ) : (
                <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.actualCost}</label><input type="text" className={inputCls} placeholder="e.g. 80" value={amount} onChange={e => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />{errors.amount && <p className={errCls}>{errors.amount}</p>}<p className="text-[#8E8E93] text-xs mt-1">{t.keepReceipt}</p></div>
              )}
            </div>
          )}

          {/* ── SUBCONTRACT ── */}
          {type === 'subcontract' && (
            <div className="space-y-5">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/40 rounded-xl p-3 space-y-1">
                <p className="text-orange-800 dark:text-orange-300 text-xs font-medium">💡 {lang === 'zh' ? '分包说明' : 'Subcontract Note'}</p>
                <p className="text-orange-600 dark:text-orange-400 text-xs">{lang === 'zh' ? '• 用于支付有ABN的分包商（非直接雇员）' : '• For payments to subcontractors with their own ABN'}</p>
                <p className="text-orange-600 dark:text-orange-400 text-xs">{lang === 'zh' ? '• 建筑行业每年需向ATO提交TPAR（应税付款年度报告）' : '• Building businesses must lodge a TPAR (Taxable Payments Annual Report) with the ATO each year'}</p>
              </div>
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.description}</label><input className={inputCls} placeholder={lang === 'zh' ? '例如：分包商姓名' : 'e.g. Subcontractor name'} value={description} onChange={e => { setDescription(e.target.value); setSuggestedType(null) }} onBlur={e => lookupHistoricalPrice(e.target.value)} />{errors.description && <p className={errCls}>{errors.description}</p>}
                {classifying && <p className="text-xs text-[#8E8E93] mt-1">📊 {lang === 'zh' ? '查询历史成本均价...' : 'Looking up cost history...'}</p>}
                {suggestedType && !classifying && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-[#8E8E93]">📊 {lang === 'zh' ? '历史成本均价:' : 'Hist. cost avg:'}</span>
                    <button onClick={() => { const price = suggestedType?.match(/\$([\d.]+)/)?.[1]; if (price) setUnitPrice(price); setSuggestedType(null) }}
                      className="text-xs bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 rounded-full font-medium hover:bg-[#0A84FF]/20 transition-colors">
                      {suggestedType} ✓
                    </button>
                    <button onClick={() => setSuggestedType(null)} className="text-xs text-[#8E8E93]">✕</button>
                  </div>
                )}</div>
              <div><label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.amount}</label><input type="text" className={inputCls} placeholder="e.g. 1200" value={amount} onChange={e => { setAmount(e.target.value); validatePositive(e.target.value, 'amount') }} />{errors.amount && <p className={errCls}>{errors.amount}</p>}</div>
            </div>
          )}

          {/* GST + ATO (expense types only) */}
          {type !== 'invoice' && (
            <div className="border-t border-gray-100 dark:border-[#3A3A3C] pt-5 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.gstStatus}</label>
                  <button type="button" onClick={() => setShowGstInfo(!showGstInfo)} className="text-[#0A84FF] text-xs border border-[#0A84FF]/40 rounded-full w-5 h-5 flex items-center justify-center shrink-0">?</button>
                </div>
                {showGstInfo && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 space-y-2 mt-2">
                    <p className="font-semibold">{lang === 'zh' ? 'GST（商品及服务税）是什么？' : 'What is GST (Goods and Services Tax)?'}</p>
                    <p>{lang === 'zh' ? 'GST 是澳洲的消费税，税率10%。你可以在收据底部找到GST金额——Bunnings 和 Woolworths 的收据都会单独列出 GST 小计。' : "GST is Australia's 10% consumption tax. Find the GST amount at the bottom of receipts — Bunnings and Woolworths list it separately near the total."}</p>
                    <p>• <strong>{lang === 'zh' ? '含GST（最常见）' : 'Inclusive (most common)'}</strong>: {lang === 'zh' ? '收据价格已含GST，例如 $110 中有 $10 是GST' : 'Price includes GST — e.g. $110 receipt includes $10 GST'}</p>
                    <p>• <strong>{lang === 'zh' ? '不含GST' : 'Exclusive'}</strong>: {lang === 'zh' ? '价格未含GST，另加10%' : 'Price excludes GST, add 10% on top'}</p>
                    <p>• <strong>{lang === 'zh' ? '免GST' : 'GST Free'}</strong>: {lang === 'zh' ? '无需缴纳GST，例如工资' : 'No GST — e.g. wages'}</p>
                  </div>
                )}
                <select className={inputCls} value={gstStatus} onChange={e => setGstStatus(e.target.value)}>
                  <option value="inclusive">{t.gstInclusive}</option>
                  <option value="exclusive">{t.gstExclusive}</option>
                  <option value="free">{t.gstFree}</option>
                  <option value="unknown">{t.gstUnknown}</option>
                </select>
                {gstStatus === 'inclusive' && <p className="text-[#8E8E93] text-xs mt-1">{t.gstInclusiveHint}</p>}
                {gstStatus === 'exclusive' && <p className="text-[#0A84FF] text-xs mt-1">{t.gstExclusiveHint}</p>}
                {gstStatus === 'free' && <p className="text-[#8E8E93] text-xs mt-1">{t.gstFreeHint}</p>}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.atoCategory}</label>
                  <button type="button" onClick={() => setShowAtoInfo(!showAtoInfo)} className="text-[#0A84FF] text-xs border border-[#0A84FF]/40 rounded-full w-5 h-5 flex items-center justify-center shrink-0">?</button>
                </div>
                {showAtoInfo && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1 mt-2">
                    <p>{lang === 'zh' ? '澳洲税务局（ATO）要求按正确类别申报支出，用于季度 BAS 和年度所得税申报。系统已自动设置，一般无需修改。' : 'The ATO (Australian Taxation Office) requires correct categorisation for your quarterly BAS and annual tax return. Auto-set — usually no need to change.'}</p>
                  </div>
                )}
                <select className={inputCls} value={taxCategory} onChange={e => setTaxCategory(e.target.value)}>
                  <option value="">{t.selectCategory}</option>
                  <optgroup label={lang === 'zh' ? '销售成本' : 'Cost of Goods Sold'}>
                    <option value="cogs_material">{lang === 'zh' ? '材料成本' : 'Materials (Cost of Goods Sold)'}</option>
                    <option value="cogs_labour">{lang === 'zh' ? '直接人工' : 'Direct Labour (Cost of Goods Sold)'}</option>
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
                {errors.taxCategory && <p className={errCls}>{errors.taxCategory}</p>}
                <p className="text-[#8E8E93] text-xs mt-1">{t.usedForBas}</p>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-semibold disabled:opacity-50 transition-colors">
            {loading ? t.saving : t.save}
          </button>
        </div>
      </main>
    </div>
  )
}
