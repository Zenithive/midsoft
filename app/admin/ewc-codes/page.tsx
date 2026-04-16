'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function EwcCodesPage() {
  const [rows, setRows] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<any>({ code: '', description: '', hazardous: false, is_active: true })

  const load = async () => {
    const data = await fetch(`/api/ewc-codes${search ? `?q=${encodeURIComponent(search)}` : ''}`).then((r) => r.json())
    setRows(data)
  }

  useEffect(() => { load() }, [search])

  async function createCode() {
    await fetch('/api/ewc-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, hazardous: Number(draft.hazardous), is_active: Number(draft.is_active) }),
    })
    setDraft({ code: '', description: '', hazardous: false, is_active: true })
    load()
  }

  async function updateCode(row: any, patch: any) {
    await fetch(`/api/ewc-codes/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, ...patch }),
    })
    load()
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">EWC Codes Management</h1>
      <Input placeholder="Search code or description" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input placeholder="Code" value={draft.code} onChange={(e) => setDraft((p: any) => ({ ...p, code: e.target.value }))} />
        <Input placeholder="Description" value={draft.description} onChange={(e) => setDraft((p: any) => ({ ...p, description: e.target.value }))} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.hazardous} onChange={(e) => setDraft((p: any) => ({ ...p, hazardous: e.target.checked }))} /> Hazardous</label>
        <Button onClick={createCode}>Add EWC Code</Button>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Description</TableHead><TableHead>Hazardous</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className={row.hazardous ? 'bg-red-50' : ''}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>
                {row.hazardous ? <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">Hazardous</span> : <span className="text-xs px-2 py-1 rounded bg-slate-200">Non-hazardous</span>}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => updateCode(row, { is_active: row.is_active ? 0 : 1 })}>{row.is_active ? 'Active' : 'Inactive'}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
