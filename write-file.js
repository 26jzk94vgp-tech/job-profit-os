const fs = require('fs')
const content = `'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'
import Link from 'next/link'

export default function QuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [quote, setQuote] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('quotes').select('*, jobs(name), clients(name, address, phone, email)').eq('id', id).single().then(({ data }) => setQuote(data))
    supabase.from('quote_items').select('*').eq('quote_id', id).then(({ data }) => setItems(data || []))
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
  }, [id])

  async function updateStatus(status: string) {
    await supabase.from('quotes').update({ status }).eq('id', id)
    setQuote((q: any) => ({ ...q, status }))
  }

  async function convertToInvoice() {
    if (!quote?.job_id) { alert(lang === 'zh' ? '请先关联工单' : 'Please link a job first.'); return }
    setLoading(true)
    const invoiceItems = items.map(item => ({
      job_id: quote.job_id,
      owner_id: quote.owner_id,
      type: 'invoice',
      description: item.description + (item.area ? ' - ' + item.area : ''),
      quantity: Number(item.quantity),
      unit: item.item_unit || item.unit,
      unit_price: Number(item.unit_price),
      amount: Number(item.quantity) * Number(item.unit_price),
      gst_status: 'exclusive',
      tax_category: 'other_income'
    }))
    const { error } = await supabase.from('job_entries').insert(invoiceItems)
    if (error) { alert('Error: ' + error.message) } else {
      const materialItems = items.filter(i => Number(i.cost_price) > 0).map(item => ({
        job_id: quote.job_id,
        owner_id: quote.owner_id,
        type: 'material',
        description: item.description + (item.area ? ' - ' + item.area : ''),
        quantity: Number(item.quantity),
        unit: item.item_unit || item.unit,
        unit_price: Number(item.cost_price),
        amount: Number(item.quantity) * Number(item.cost_price),
        gst_status: 'inclusive',
        tax_category: 'cogs_material',
        notes: 'QUOTE_ESTIMATE'
      }))
      if (materialItems.length > 0) await supabase.from('job_entries').insert(materialItems)
      await supabase.from('quotes').update({ status: 'accepted' }).eq('id', id)
      const msg = materialItems.length > 0
        ? (lang === 'zh' ? \`报价单已转为发票！已自动导入 \${materialItems.length} 条材料估算条目。实际购买后请更新材料价格。\` : \`Quote converted! \${materialItems.length} material estimate(s) added. Update prices after actual purchase.\`)
        : (lang === 'zh' ? '报价单已转为发票条目！' : 'Quote converted to invoice entries!')
      alert(msg)
      window.location.href = '/jobs/' + quote.job_id
    }
    setLoading(false)
  }

  if (!quote) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-400">Loading...</div></div>

  const subTotal = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0)
  const gst = subTotal * 0.1
  const total = subTotal + gst

  const statusOptions = [
    { value: 'draft', label: lang === 'zh' ? '草稿' : 'Draft' },
    { value: 'sent', label: lang === 'zh' ? '已发送' : 'Sent' },
    { value: 'accepted', label: lang === 'zh' ? '已接受' : 'Accepted' },
    { value: 'declined', label: lang === 'zh' ? '已拒绝' : 'Declined' },
  ]

  const groups = [...new Set(items.map(i => i.item_group || ''))].filter(Boolean)
  const noGroup = items.filter(i => !i.item_group)

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, sans-serif", background: '#f5f5f7', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Top Bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', background: 'rgba(245,245,247,0.85)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/quotes" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0071e3', fontSize: '14px', textDecoration: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {lang === 'zh' ? '返回' : 'Back'}
          </Link>
          <span style={{ color: 'rgba(0,0,0,0.15)', fontSize: '14px', margin: '0 2px' }}>|</span>
          <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.2px' }}>{lang === 'zh' ? '报价单详情' : 'Quote Detail'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'rgba(0,0,0,0.06)', color: '#1d1d1f' }}>
            🖨️ {lang === 'zh' ? '打印/PDF' : 'Print/PDF'}
          </button>
          <Link href={'/quotes/' + id + '/edit'} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'rgba(0,0,0,0.06)', color: '#1d1d1f', textDecoration: 'none' }}>
            ✏️ {lang === 'zh' ? '编辑' : 'Edit'}
          </Link>
          {quote.job_id && (
            <button onClick={convertToInvoice} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '980px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: '#0071e3', color: '#fff' }}>
              ✅ {loading ? (lang === 'zh' ? '转换中...' : 'Converting...') : (lang === 'zh' ? '转为发票' : 'Convert to Invoice')}
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '16px 24px 0', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#aeaeb2', marginRight: '4px', letterSpacing: '0.2px', textTransform: 'uppercase' }}>{lang === 'zh' ? '状态' : 'Status'}</span>
        {statusOptions.map(s => (
          <button key={s.value} onClick={() => updateStatus(s.value)} style={{ padding: '4px 11px', borderRadius: '980px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: quote.status === s.value ? '#0071e3' : 'rgba(0,0,0,0.05)', color: quote.status === s.value ? '#fff' : '#6e6e73' }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Accepted Banner */}
        {quote.status === 'accepted' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)', borderRadius: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34c759', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a7a36' }}>{lang === 'zh' ? '此报价单已被客户接受' : 'This quote has been accepted'}</span>
          </div>
        )}

        {/* Header Card */}
        <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.5px' }}>{profile?.company_name || 'Your Company'}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0071e3', background: 'rgba(0,113,227,0.08)', padding: '4px 10px', borderRadius: '6px' }}>{quote.quote_number || 'Q-001'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
            {[
              { label: lang === 'zh' ? '报价单号' : 'Quote No.', value: quote.quote_number || 'Q-001' },
              { label: lang === 'zh' ? '日期' : 'Date', value: quote.quote_date || new Date().toLocaleDateString('en-AU') },
              { label: lang === 'zh' ? '类型' : 'Type', value: quote.quote_type || 'Residential' },
              { label: lang === 'zh' ? '建筑商' : 'Builder', value: quote.builder_name || '—' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 16px', borderRight: i % 2 === 0 ? '1px solid rgba(0,0,0,0.08)' : 'none', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.08)' : 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{item.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
            {quote.site_address && (
              <div style={{ padding: '12px 16px', gridColumn: '1/-1', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{lang === 'zh' ? '地址' : 'Address'}</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{quote.site_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Card */}
        <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'zh' ? '明细项目' : 'Line Items'}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[lang === 'zh' ? '描述' : 'Description', lang === 'zh' ? '区域' : 'Area', lang === 'zh' ? '类型' : 'Type', lang === 'zh' ? '单位' : 'Unit', lang === 'zh' ? '数量' : 'Qty', lang === 'zh' ? '单价' : 'Rate', lang === 'zh' ? '金额' : 'Amount'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: i >= 4 ? 'right' : 'left', fontSize: '11px', fontWeight: 600, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <>
                    <tr key={group} style={{ background: 'rgba(0,113,227,0.04)' }}>
                      <td colSpan={7} style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#0071e3', letterSpacing: '0.3px' }}>{group}</td>
                    </tr>
                    {items.filter(i => i.item_group === group).map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 500 }}>{item.description}</td>
                        <td style={{ padding: '14px 16px', color: '#6e6e73' }}>{item.area || '—'}</td>
                        <td style={{ padding: '14px 16px', color: '#6e6e73' }}>{item.item_type || '—'}</td>
                        <td style={{ padding: '14px 16px', color: '#6e6e73' }}>{item.item_unit || item.unit || '—'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{item.quantity}</span></td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#6e6e73' }}>${Number(item.unit_price).toFixed(2)}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 500 }}>${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </>
                ))}
                {noGroup.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 500 }}>{item.description}</td>
                    <td style={{ padding: '14px 16px', color: '#6e6e73' }}>{item.area || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#6e6e73' }}>{item.item_type || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#6e6e73' }}>{item.item_unit || item.unit || '—'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{item.quantity}</span></td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#6e6e73' }}>${Number(item.unit_price).toFixed(2)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 500 }}>${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Card */}
        <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
          {[
            { key: lang === 'zh' ? '小计' : 'Sub Total', val: subTotal.toFixed(2) },
            { key: 'GST (10%)', val: gst.toFixed(2) },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 28px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ fontSize: '14px', color: '#6e6e73' }}>{row.key}</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>${row.val}</span>
            </div>
          ))}
          <div style={{ background: '#0071e3', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{lang === 'zh' ? '含 GST 总计' : 'Total Inc GST'}</span>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '-0.5px' }}>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Scope of Work */}
        {quote.scope_of_work && (
          <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', padding: '20px 24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>{lang === 'zh' ? '工程范围' : 'Scope of Work'}</p>
            <pre style={{ fontSize: '14px', color: '#1d1d1f', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{quote.scope_of_work}</pre>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', padding: '20px 24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{lang === 'zh' ? '备注' : 'Notes'}</p>
            <p style={{ fontSize: '14px', color: '#6e6e73' }}>{quote.notes}</p>
          </div>
        )}

      </div>
    </div>
  )
}`

fs.writeFileSync('app/quotes/[id]/page.tsx', content)
console.log('done')
