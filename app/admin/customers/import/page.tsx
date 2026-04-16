'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

const TEMPLATE_HEADERS = [
  'name','account_number','customer_type','address_line1','address_line2','town','county','postcode','phone_main','phone_mobile','email','contact_email','invoice_email','payment_terms_days','payment_method','invoice_method','on_stop','po_mandatory','notes'
]

export default function CustomerImportPage() {
  const [step, setStep] = useState(1)
  const [rows, setRows] = useState<any[]>([])
  const [errors, setErrors] = useState<any[]>([])
  const [skipErrors, setSkipErrors] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  function downloadTemplate() {
    const csv = `${TEMPLATE_HEADERS.join(',')}\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customer-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function parseCsv(content: string) {
    const lines = content.split(/\r?\n/).filter(Boolean)
    const headers = lines[0].split(',').map((h) => h.trim())
    const parsed = lines.slice(1).map((line) => {
      const values = line.split(',')
      const row: Record<string, string> = {}
      headers.forEach((header, i) => { row[header] = (values[i] ?? '').trim() })
      return row
    })
    return parsed
  }

  function validateRows(inputRows: any[]) {
    const localErrors: Array<{ index: number; error_reason: string; row: any }> = []
    const seen = new Set<string>()

    inputRows.forEach((row, index) => {
      if (!row.name || !row.postcode) localErrors.push({ index, error_reason: 'Missing required fields (name/postcode)', row })
      if (row.customer_type && !['account', 'cash'].includes(row.customer_type)) localErrors.push({ index, error_reason: 'Invalid customer_type', row })
      if (row.account_number) {
        if (seen.has(row.account_number)) localErrors.push({ index, error_reason: 'Duplicate account number in file', row })
        seen.add(row.account_number)
      }
    })

    return localErrors
  }

  async function onFile(file: File) {
    if (!file.name.endsWith('.csv')) return alert('Only CSV files are allowed')
    if (file.size > 5 * 1024 * 1024) return alert('File too large (max 5MB)')

    const text = await file.text()
    const parsed = parseCsv(text)
    const localErrors = validateRows(parsed)

    setRows(parsed)
    setErrors(localErrors)
    setStep(2)
  }

  const readyCount = useMemo(() => rows.length - errors.length, [rows, errors])

  function downloadErrorCsv() {
    const merged = errors.map((e) => ({ ...e.row, error_reason: e.error_reason }))
    if (!merged.length) return
    const headers = [...Object.keys(merged[0])]
    const lines = [headers.join(',')]
    merged.forEach((row) => lines.push(headers.map((h) => String(row[h] ?? '')).join(',')))

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customer-import-errors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importRows() {
    setStep(3)
    setProgress(0)

    const validIndexes = new Set(errors.map((e) => e.index))
    const importRows = skipErrors ? rows.filter((_, i) => !validIndexes.has(i)) : rows

    for (let i = 0; i < importRows.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      setProgress(Math.round(((i + 1) / importRows.length) * 100))
    }

    const response = await fetch('/api/customers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: importRows }),
    }).then((r) => r.json())

    setResult(response)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Customer CSV Import</h1>

      {step === 1 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <p>Drag and drop CSV here, or select a file.</p>
          <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <div><Button variant="outline" onClick={downloadTemplate}>Download Template</Button></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm">{readyCount} rows ready to import, {errors.length} rows have errors.</p>
          <div className="overflow-auto rounded border border-slate-200">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-100"><th className="p-2">#</th><th className="p-2">Name</th><th className="p-2">Postcode</th><th className="p-2">Type</th><th className="p-2">Error</th></tr></thead>
              <tbody>
                {rows.slice(0, 10).map((row, index) => {
                  const err = errors.find((e) => e.index === index)
                  return (
                    <tr key={index} className={err ? 'bg-red-50' : ''}>
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">{row.postcode}</td>
                      <td className="p-2">{row.customer_type || 'account'}</td>
                      <td className="p-2 text-red-600">{err?.error_reason || ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <label><input type="radio" checked={skipErrors} onChange={() => setSkipErrors(true)} /> Skip rows with errors and import valid rows</label>
            <label><input type="radio" checked={!skipErrors} onChange={() => setSkipErrors(false)} /> Fix errors before importing</label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadErrorCsv} disabled={!errors.length}>Download Errors</Button>
            <Button onClick={importRows} disabled={!skipErrors && errors.length > 0}>Import {skipErrors ? readyCount : rows.length} Customers</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="w-full h-3 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${progress}%` }} /></div>
          <p className="text-sm">Progress: {progress}%</p>
          {result && (
            <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm">
              Successfully imported {result.imported} customers. {result.skipped} skipped due to errors.
              <div className="mt-2"><Button onClick={() => window.location.href = '/admin/customers?imported_today=1'}>View Imported Customers</Button></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
