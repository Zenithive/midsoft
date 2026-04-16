'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function ServicesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null)
  const [draft, setDraft] = useState<any>({ name: '', container_type: 'skip', skip_size_yards: '', default_price_gbp: '', default_ewc_code_id: '', vat_rate: 20, is_active: 1 })
  const [ewcCodes, setEwcCodes] = useState<any[]>([])

  const load = async () => {
    const [serviceRows, codes] = await Promise.all([
      fetch('/api/services').then((r) => r.json()),
      fetch('/api/ewc-codes').then((r) => r.json()),
    ])
    setRows(serviceRows)
    setEwcCodes(codes)
  }

  useEffect(() => { load() }, [])

  async function saveNew() {
    await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...draft,
        skip_size_yards: draft.skip_size_yards ? Number(draft.skip_size_yards) : null,
        default_price_gbp: Number(draft.default_price_gbp || 0),
        default_ewc_code_id: draft.default_ewc_code_id ? Number(draft.default_ewc_code_id) : null,
      }),
    })
    setDraft({ name: '', container_type: 'skip', skip_size_yards: '', default_price_gbp: '', default_ewc_code_id: '', vat_rate: 20, is_active: 1 })
    load()
  }

  async function updateRow(row: any, patch: any) {
    await fetch(`/api/services/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, ...patch }),
    })
    load()
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Services Catalogue</h1>

      <div className="rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input placeholder="Name" value={draft.name} onChange={(e) => setDraft((p: any) => ({ ...p, name: e.target.value }))} />
        <Input placeholder="Container Type" value={draft.container_type} onChange={(e) => setDraft((p: any) => ({ ...p, container_type: e.target.value }))} />
        <Input placeholder="Skip Size (yards)" type="number" value={draft.skip_size_yards} onChange={(e) => setDraft((p: any) => ({ ...p, skip_size_yards: e.target.value }))} />
        <Input placeholder="Default Price" type="number" value={draft.default_price_gbp} onChange={(e) => setDraft((p: any) => ({ ...p, default_price_gbp: e.target.value }))} />
        <select className="border rounded px-2" value={draft.default_ewc_code_id} onChange={(e) => setDraft((p: any) => ({ ...p, default_ewc_code_id: e.target.value }))}>
          <option value="">Default EWC</option>
          {ewcCodes.map((code) => <option key={code.id} value={code.id}>{code.code} - {code.description}</option>)}
        </select>
        <Button onClick={saveNew}>Add Service</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Container</TableHead>
            <TableHead>Skip Size</TableHead>
            <TableHead>Default Price</TableHead>
            <TableHead>VAT</TableHead>
            <TableHead>EWC</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const vat = Number(((Number(row.default_price_gbp || 0) * Number(row.vat_rate || 0)) / 100).toFixed(2))
            return (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.container_type}</TableCell>
                <TableCell>{row.skip_size_yards ?? '-'}</TableCell>
                <TableCell onDoubleClick={() => setEditingPriceId(row.id)}>
                  {editingPriceId === row.id ? (
                    <Input
                      autoFocus
                      type="number"
                      defaultValue={row.default_price_gbp}
                      onBlur={(e) => { setEditingPriceId(null); updateRow(row, { default_price_gbp: Number(e.target.value || 0) }) }}
                    />
                  ) : `£${Number(row.default_price_gbp || 0).toFixed(2)}`}
                </TableCell>
                <TableCell>£{vat.toFixed(2)}</TableCell>
                <TableCell>{row.ewc_code || '-'}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => updateRow(row, { is_active: row.is_active ? 0 : 1 })}>
                    {row.is_active ? 'Active' : 'Inactive'}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
