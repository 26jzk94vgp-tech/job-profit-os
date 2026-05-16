'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import * as XLSX from 'xlsx'

export default function ImportMaterials() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [jobs, setJobs] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [rowJobs, setRowJobs] = useState<Record<number, string>>({})
  const [bulkJob, setBulkJob] = useState('')
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('jobs').select('id, name, client_name').order('created_at', { ascending: false }).then(({ data }) => setJobs(data || []))
  }, [])

  function parseNum(val: any): number {
    if (!val) return 0
    return parseFloat(String(val).replace(/[$,]/g, '')) || 0
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    setResult(null)
    setRowJobs({})

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheetName = workbook.SheetNames.includes('Materials') ? 'Materials' : workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false })

        const mapped = (jsonData as any[]).map((row: any) => {
          const date = row['Date'] || row['date'] || ''
          const description = row['Material / Description'] || row['Description'] || row['description'] || row['Item'] || ''
          const supplier = row['Supplier'] || row['supplier'] || ''
          const invoiceNo = row['Invoice No.'] || row['Invoice No'] || row['Invoice'] || ''
          const category = row['Category'] || row['category'] || ''
          const quantity = parseNum(row['Qty'] || row['Quantity'] || '1') || 1
          const unitPriceIncGst = parseNum(row['Unit Price inc GST'] || row['Unit Price'] || row['Price'] || '0')
          const totalIncGst = parseNum(row['Line Total inc GST'] || row['Total inc GST'] || row['Total'] || row['Amount'] || '0')
          const gst = parseNum(row['GST'] || row['gst'] || '0')
          const totalExGst = parseNum(row['Ex GST'] || row['ex GST'] || '0') || (totalIncGst - gst)

          return {
            date: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: description ? String(description).trim() : '',
            supplier: supplier ? String(supplier).trim() : '',
            invoiceNo: invoiceNo ? String(invoiceNo).trim() : '',
            category: category ? String(category).trim() : '',
            quantity,
            unitPriceIncGst,
            unitPriceExGst: unitPriceIncGst / 1.1,
            totalIncGst,
            totalExGst,
            gst,
          }
        }).filter(row => row.description && row.totalIncGst > 0)

        setRows(mapped)
      } catch (err: any) {
        setError(lang === 'zh' ? '无法读取文件' : 'Could not read file')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function applyBulkJob() {
    if (!bulkJob) return
    const newRowJobs: Record<number, string> = {}
    rows.forEach((_, i) => { newRowJobs[i] = bulkJob })
    setRowJobs(newRowJobs)
  }

  async function handleImport() {
    const toImport = rows.map((row, i) => ({ ...row, jobId: rowJobs[i] || bulkJob })).filter(r => r.jobId)
    if (toImport.length === 0) { setError(lang === 'zh' ? '请至少为一条记录选择工单' : 'Please select a job for at least one row'); return }

    setImporting(true)
    setError('')

    // Group by jobId
    const byJob: Record<string, any[]> = {}
    toImport.forEach(r => {
      if (!byJob[r.jobId]) byJob[r.jobId] = []
      byJob[r.jobId].push(r)
    })

    let totalCount = 0
    for (const [jobId, jobRows] of Object.entries(byJob)) {
      const res = await fetch('/api/import-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: jobRows, jobId })
      })
      const json = await res.json()
      if (json.success) totalCount += json.count
      else setError(json.error || 'Import failed')
    }

    setResult({ count: totalCount })
    setRows([])
    setFileName('')
    setRowJobs({})
    setImporting(false)
  }

  const totalIncGst = rows.reduce((sum, r) => sum + r.totalIncGst, 0)
  const totalGst = rows.reduce((sum, r) => sum + r.gst, 0)
  const assignedCount = rows.filter((_, i) => rowJobs[i] || bulkJob).length
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <a href="/" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</a>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '导入材料清单' : 'Import Materials'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="md:hidden flex items-center gap-3 mb-2">
          <a href="/" className="text-gray-500 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</a>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '导入材料清单' : 'Import Materials'}</h1>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-blue-800 font-medium text-sm">📊 {lang === 'zh' ? '支持从Bunnings等供应商导出的Excel材料清单' : 'Supports Excel material lists from Bunnings and other suppliers'}</p>
          <p className="text-blue-600 text-xs mt-1">{lang === 'zh' ? '上传后可为每行材料单独选择关联工单，或批量应用同一工单' : 'After upload, assign each row to a job individually or apply one job to all rows'}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '上传Excel文件' : 'Upload Excel File'}</label>
            <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl p-8 mt-1 cursor-pointer hover:border-blue-400 transition bg-gray-50">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
              <div className="text-center">
                <p className="text-3xl mb-2">📂</p>
                <p className="text-gray-500 text-sm">{fileName || (lang === 'zh' ? '点击上传 .xlsx / .xls / .csv' : 'Click to upload .xlsx / .xls / .csv')}</p>
              </div>
            </label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <p className="text-green-800 font-medium">✅ {lang === 'zh' ? `成功导入 ${result.count} 条材料记录！` : `Successfully imported ${result.count} material entries!`}</p>
              <p className="text-green-700 text-sm">💰 {lang === 'zh' ? `GST 抵扣：${result.gstSaved?.toFixed(2)} — 已自动计入BAS申报` : `GST credit: ${result.gstSaved?.toFixed(2)} — automatically added to your BAS`}</p>
              <p className="text-green-600 text-xs">{lang === 'zh' ? '这笔GST将在下次BAS申报时从应缴税款中扣除' : 'This GST will be deducted from your next BAS payment'}</p>
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '批量选择工单' : 'Bulk Assign Job'}</h2>
              <div className="flex gap-3">
                <select className="flex-1 border border-gray-200 rounded-lg p-3 text-gray-900 outline-none text-sm" value={bulkJob} onChange={(e) => setBulkJob(e.target.value)}>
                  <option value="">{lang === 'zh' ? '选择工单...' : 'Select job...'}</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.name} {j.client_name ? '— ' + j.client_name : ''}</option>
                  ))}
                </select>
                <button onClick={applyBulkJob} className="bg-blue-600 text-white px-4 rounded-lg text-sm font-medium">
                  {lang === 'zh' ? '全部应用' : 'Apply All'}
                </button>
              </div>
              <p className="text-gray-400 text-xs">{lang === 'zh' ? `已分配 ${assignedCount}/${rows.length} 条记录` : `${assignedCount}/${rows.length} rows assigned`}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between">
                <h2 className="font-semibold text-gray-900 text-sm">{lang === 'zh' ? `预览 (${rows.length} 条)` : `Preview (${rows.length} items)`}</h2>
                <div className="text-xs text-gray-500">
                  {lang === 'zh' ? '含GST总计' : 'Total inc GST'}: <span className="font-bold text-gray-900">${totalIncGst.toFixed(2)}</span>
                  <span className="ml-3">GST: <span className="text-red-500">${totalGst.toFixed(2)}</span></span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 text-gray-500">{lang === 'zh' ? '日期' : 'Date'}</th>
                      <th className="text-left px-3 py-2 text-gray-500">{lang === 'zh' ? '描述' : 'Description'}</th>
                      <th className="text-left px-3 py-2 text-gray-500">{lang === 'zh' ? '供应商' : 'Supplier'}</th>
                      <th className="text-right px-3 py-2 text-gray-500">{lang === 'zh' ? '数量' : 'Qty'}</th>
                      <th className="text-right px-3 py-2 text-gray-500">{lang === 'zh' ? '含GST总价' : 'Total inc GST'}</th>
                      <th className="text-right px-3 py-2 text-gray-500">GST</th>
                      <th className="text-left px-3 py-2 text-gray-500">{lang === 'zh' ? '关联工单' : 'Job'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={`border-b border-gray-100 ${rowJobs[i] || bulkJob ? 'bg-white' : 'bg-yellow-50'}`}>
                        <td className="px-3 py-2 text-gray-600">{row.date}</td>
                        <td className="px-3 py-2 text-gray-900 max-w-xs truncate">{row.description}</td>
                        <td className="px-3 py-2 text-gray-500">{row.supplier}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{row.quantity}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">${row.totalIncGst.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-red-500">${row.gst.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <select className="w-32 border border-gray-200 rounded p-1 text-xs outline-none" value={rowJobs[i] || bulkJob} onChange={(e) => setRowJobs(prev => ({ ...prev, [i]: e.target.value }))}>
                            <option value="">{lang === 'zh' ? '选择...' : 'Select...'}</option>
                            {jobs.map((j) => (
                              <option key={j.id} value={j.id}>{j.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={handleImport} disabled={importing || assignedCount === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium disabled:opacity-50 text-lg">
              {importing ? (lang === 'zh' ? '导入中...' : 'Importing...') : (lang === 'zh' ? `导入 ${assignedCount} 条材料` : `Import ${assignedCount} items`)}
            </button>
          </>
        )}
      </main>
    </div>
  )
}