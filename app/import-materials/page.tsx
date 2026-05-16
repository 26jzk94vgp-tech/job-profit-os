'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import * as XLSX from 'xlsx'

export default function ImportMaterials() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState('')
  const [rows, setRows] = useState<any[]>([])
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

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        
        // Try to find Materials sheet first, otherwise use first sheet
        const sheetName = workbook.SheetNames.includes('Materials') 
          ? 'Materials' 
          : workbook.SheetNames[0]
        
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false })
        console.log('Sheet names:', workbook.SheetNames)
        console.log('Using sheet:', sheetName)
        console.log('Row count:', jsonData.length)
        console.log('First row:', JSON.stringify(jsonData[0]))
        
        // Map columns flexibly
        const mapped = (jsonData as any[]).map((row: any) => {
          // Try different column name variations
          const date = row['Date'] || row['date'] || row['DATE'] || ''
          const description = row['Material / Description'] || row['Description'] || row['description'] || row['Item'] || ''
          const supplier = row['Supplier'] || row['supplier'] || ''
          const invoiceNo = row['Invoice No.'] || row['Invoice No'] || row['Invoice'] || ''
          const category = row['Category'] || row['category'] || ''
          const quantity = parseNum(row['Qty'] || row['Quantity'] || row['QTY'] || '1')
          const unitPriceIncGst = parseNum(row['Unit Price inc GST'] || row['Unit Price'] || row['Price'] || '0')
          const totalIncGst = parseNum(row['Line Total inc GST'] || row['Total inc GST'] || row['Total'] || row['Amount'] || '0')
          const gst = parseNum(row['GST'] || row['gst'] || '0')
          const totalExGst = parseNum(row['Ex GST'] || row['ex GST'] || row['Ex-GST'] || '0') || (totalIncGst - gst)

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
        
        console.log('Mapped count:', mapped.length)
        console.log('First mapped:', JSON.stringify(mapped[0]))
        setRows(mapped)
      } catch (err: any) {
        setError(lang === 'zh' ? '无法读取文件，请确认是有效的Excel文件' : 'Could not read file. Please ensure it is a valid Excel file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    if (!selectedJob) { setError(lang === 'zh' ? '请选择工单' : 'Please select a job'); return }
    if (rows.length === 0) { setError(lang === 'zh' ? '没有可导入的数据' : 'No data to import'); return }
    
    setImporting(true)
    setError('')
    
    const res = await fetch('/api/import-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, jobId: selectedJob })
    })
    const json = await res.json()
    
    if (json.success) {
      setResult(json)
      setRows([])
      setFileName('')
    } else {
      setError(json.error || 'Import failed')
    }
    setImporting(false)
  }

  const totalIncGst = rows.reduce((sum, r) => sum + r.totalIncGst, 0)
  const totalGst = rows.reduce((sum, r) => sum + r.gst, 0)
  const totalExGst = rows.reduce((sum, r) => sum + r.totalExGst, 0)
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
          <p className="text-blue-800 font-medium text-sm">📊 {lang === 'zh' ? '支持从Bunnings等供应商导出的Excel材料清单' : 'Supports Excel material lists exported from Bunnings and other suppliers'}</p>
          <p className="text-blue-600 text-xs mt-1">{lang === 'zh' ? '自动识别：日期、描述、数量、单价、GST、总价' : 'Auto-detects: Date, Description, Qty, Unit Price, GST, Total'}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '选择工单' : 'Select Job'}</label>
            <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}>
              <option value="">{lang === 'zh' ? '请选择工单...' : 'Select a job...'}</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.name} {j.client_name ? '— ' + j.client_name : ''}</option>
              ))}
            </select>
          </div>

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
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-medium">✅ {lang === 'zh' ? `成功导入 ${result.count} 条材料记录！` : `Successfully imported ${result.count} material entries!`}</p>
              <a href={'/jobs/' + selectedJob} className="text-green-600 text-sm underline mt-1 block">{lang === 'zh' ? '查看工单 →' : 'View job →'}</a>
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-900">{lang === 'zh' ? `预览 (${rows.length} 条记录)` : `Preview (${rows.length} items)`}</h2>
                <div className="text-right text-xs text-gray-500">
                  <p>{lang === 'zh' ? '含GST总计' : 'Total inc GST'}: <span className="font-bold text-gray-900">${totalIncGst.toFixed(2)}</span></p>
                  <p>{lang === 'zh' ? 'GST' : 'GST'}: <span className="font-medium text-red-500">${totalGst.toFixed(2)}</span></p>
                  <p>{lang === 'zh' ? '不含GST' : 'Ex GST'}: <span className="font-medium">${totalExGst.toFixed(2)}</span></p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500">{lang === 'zh' ? '日期' : 'Date'}</th>
                      <th className="text-left py-2 text-gray-500">{lang === 'zh' ? '描述' : 'Description'}</th>
                      <th className="text-left py-2 text-gray-500">{lang === 'zh' ? '供应商' : 'Supplier'}</th>
                      <th className="text-right py-2 text-gray-500">{lang === 'zh' ? '数量' : 'Qty'}</th>
                      <th className="text-right py-2 text-gray-500">{lang === 'zh' ? '含GST单价' : 'Unit Inc GST'}</th>
                      <th className="text-right py-2 text-gray-500">{lang === 'zh' ? '含GST总价' : 'Total Inc GST'}</th>
                      <th className="text-right py-2 text-gray-500">GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 text-gray-600">{row.date}</td>
                        <td className="py-2 text-gray-900 max-w-xs truncate">{row.description}</td>
                        <td className="py-2 text-gray-500">{row.supplier}</td>
                        <td className="py-2 text-right text-gray-600">{row.quantity}</td>
                        <td className="py-2 text-right text-gray-600">${row.unitPriceIncGst.toFixed(2)}</td>
                        <td className="py-2 text-right font-medium text-gray-900">${row.totalIncGst.toFixed(2)}</td>
                        <td className="py-2 text-right text-red-500">${row.gst.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={handleImport} disabled={importing || !selectedJob} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium disabled:opacity-50 text-lg">
              {importing ? (lang === 'zh' ? '导入中...' : 'Importing...') : (lang === 'zh' ? `导入 ${rows.length} 条材料到工单` : `Import ${rows.length} items to job`)}
            </button>
          </>
        )}
      </main>
    </div>
  )
}