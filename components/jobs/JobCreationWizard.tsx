'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AlertCircle, CheckCircle2, Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SmallMap = dynamic(async () => {
  const leaflet = await import('react-leaflet')
  return function MapPreview({ lat, lng }: { lat: number; lng: number }) {
    const { MapContainer, TileLayer, Marker } = leaflet
    return (
      <MapContainer center={[lat, lng]} zoom={14} style={{ height: 180, width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    )
  }
}, { ssr: false })

type Customer = any
type Agreement = any

const JOB_TYPES = ['delivery', 'collection', 'exchange', 'wait_and_load']
const TIME_SLOTS = ['AM', 'PM', 'Anytime', 'Specific']

export function JobCreationWizard({
  customerId,
  agreementId,
  originLabel,
  onSaved,
}: {
  customerId?: number
  agreementId?: number
  originLabel?: string
  onSaved?: (jobId: number) => void
}) {
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [services, setServices] = useState<any[]>([])
  const [ewcCodes, setEwcCodes] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [nearbySkips, setNearbySkips] = useState<any[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null)
  const [newAgreementMode, setNewAgreementMode] = useState(false)

  const [form, setForm] = useState<any>({
    type: 'delivery',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    time_slot: 'Anytime',
    service_id: '',
    ewc_code_id: '',
    driver_id: '',
    vehicle_id: '',
    po_number: '',
    requested_by: '',
    notes: '',
    price_gbp: 0,
    vat_rate: 20,
    payment_method: 'account',
    is_paid: false,
    paid_date: '',
    weight_kg: '',
    highway_placement: false,
    local_authority: '',
    permit_start_date: '',
    permit_end_date: '',
    site_name: '',
    site_address: '',
    site_lat: '',
    site_lng: '',
    agreement_price: 0,
  })

  const poRequired = Number(selectedCustomer?.po_mandatory ?? 0) === 1
  const onStop = Number(selectedCustomer?.on_stop ?? 0) === 1
  const weighAll = Number(selectedCustomer?.weigh_all_skip_jobs ?? 0) === 1

  const vatAmount = useMemo(() => Number(((Number(form.price_gbp || 0) * Number(form.vat_rate || 0)) / 100).toFixed(2)), [form.price_gbp, form.vat_rate])
  const totalAmount = useMemo(() => Number((Number(form.price_gbp || 0) + vatAmount).toFixed(2)), [form.price_gbp, vatAmount])

  useEffect(() => {
    Promise.all([
      fetch('/api/services?active=1').then((r) => r.json()),
      fetch('/api/ewc-codes?active=1').then((r) => r.json()),
      fetch('/api/drivers').then((r) => r.json()),
      fetch('/api/vehicles').then((r) => r.json()),
    ]).then(([serviceRows, ewcRows, driverRows, vehicleRows]) => {
      setServices(serviceRows)
      setEwcCodes(ewcRows)
      setDrivers(driverRows)
      setVehicles(vehicleRows)
    })
  }, [])

  useEffect(() => {
    if (!search && !customerId) return
    const q = customerId ? `id:${customerId}` : search
    fetch(`/api/customers?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((rows) => {
        setCustomers(rows)
        if (customerId && rows.length) {
          const found = rows.find((c: any) => c.id === customerId) ?? rows[0]
          setSelectedCustomer(found)
        }
      })
  }, [search, customerId])

  useEffect(() => {
    if (!selectedCustomer) return
    fetch(`/api/agreements?customer_id=${selectedCustomer.id}&status=active`)
      .then((r) => r.json())
      .then((rows) => {
        setAgreements(rows)
        if (agreementId) {
          const found = rows.find((a: any) => a.id === agreementId)
          if (found) applyAgreement(found)
        }
      })

    setForm((prev: any) => ({
      ...prev,
      payment_method: selectedCustomer.customer_type === 'cash' ? 'cash' : 'account',
      is_paid: selectedCustomer.customer_type === 'cash' ? true : false,
    }))
  }, [selectedCustomer, agreementId])

  function applyAgreement(agreement: any) {
    setSelectedAgreement(agreement)
    const service = services.find((s) => s.id === agreement.service_id)
    const defaultType = Number(agreement.skip_currently_on_site) === 1 ? 'collection' : 'delivery'

    setForm((prev: any) => ({
      ...prev,
      type: defaultType,
      service_id: String(agreement.service_id ?? ''),
      ewc_code_id: String(agreement.default_ewc_code_id ?? ''),
      price_gbp: Number(agreement.standard_price_gbp ?? service?.default_price_gbp ?? 0),
      vat_rate: Number(service?.vat_rate ?? 20),
      site_address: agreement.site_address,
      site_lat: agreement.site_lat,
      site_lng: agreement.site_lng,
      agreement_price: Number(agreement.standard_price_gbp ?? 0),
    }))

    if (agreement.site_lat && agreement.site_lng) {
      setLoadingNearby(true)
      fetch(`/api/skips-on-site/nearby?lat=${agreement.site_lat}&lng=${agreement.site_lng}&radius=2`)
        .then((r) => r.json())
        .then((rows) => setNearbySkips(rows))
        .finally(() => setLoadingNearby(false))
    }
  }

  function canProceedStep1() {
    if (!selectedCustomer || onStop) return false
    if (newAgreementMode) {
      return Boolean(form.site_address && form.service_id && form.ewc_code_id)
    }
    return Boolean(selectedAgreement)
  }

  function canSave() {
    if (poRequired && !String(form.po_number ?? '').trim()) return false
    if (!form.scheduled_date || !form.type || !form.service_id || !form.ewc_code_id) return false
    if (Number(form.highway_placement) === 1 && (!form.permit_start_date || !form.permit_end_date)) return false
    return true
  }

  async function saveJob() {
    if (!selectedCustomer) return
    if (!canSave()) return

    setSaving(true)
    setError('')
    try {
      let agreement = selectedAgreement
      if (!agreement && newAgreementMode) {
        const service = services.find((s) => String(s.id) === String(form.service_id))
        const created = await fetch('/api/agreements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: selectedCustomer.id,
            yard_id: selectedCustomer.yard_id ?? 1,
            site_name: form.site_name || 'New Site',
            site_address: form.site_address,
            site_lat: form.site_lat ? Number(form.site_lat) : null,
            site_lng: form.site_lng ? Number(form.site_lng) : null,
            service_id: Number(form.service_id),
            default_ewc_code_id: Number(form.ewc_code_id),
            standard_price_gbp: Number(form.price_gbp || service?.default_price_gbp || 0),
            notes: form.notes,
            is_permanent_site: 0,
          }),
        }).then((r) => r.json())

        if (!created.id) throw new Error(created.error || 'Failed to create agreement')
        agreement = { id: created.id }
      }

      const payload = {
        agreement_id: agreement?.id,
        type: form.type,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.time_slot === 'Specific' ? form.scheduled_time : null,
        time_slot: form.time_slot,
        service_id: Number(form.service_id),
        ewc_code_id: Number(form.ewc_code_id),
        driver_id: form.driver_id ? Number(form.driver_id) : null,
        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null,
        po_number: form.po_number || null,
        requested_by: form.requested_by || null,
        notes: form.notes || null,
        price_gbp: Number(form.price_gbp || 0),
        vat_rate: Number(form.vat_rate || 20),
        payment_method: form.payment_method,
        is_paid: Number(form.is_paid ? 1 : 0),
        paid_date: form.is_paid ? form.paid_date || new Date().toISOString().split('T')[0] : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        highway_placement: Number(form.highway_placement ? 1 : 0),
        local_authority: form.local_authority || null,
        permit_start_date: form.permit_start_date || null,
        permit_end_date: form.permit_end_date || null,
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json())

      if (!response.id) throw new Error(response.error || 'Failed to save job')
      setSuccess(`Job #${response.id} created successfully${originLabel ? ` from ${originLabel}` : ''}.`)
      onSaved?.(Number(response.id))
    } catch (e: any) {
      setError(String(e?.message ?? 'Failed to save job'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={`h-8 w-8 rounded-full border text-xs font-semibold ${step >= s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-300'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Customer Search</Label>
            {!customerId && (
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-2.5 text-slate-400" />
                <Input className="pl-8" placeholder="Name, postcode, or account number" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            )}
            <div className="max-h-40 overflow-auto rounded border border-slate-200">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedCustomer(customer)}
                  className={`w-full text-left px-3 py-2 text-sm border-b border-slate-100 hover:bg-slate-50 ${selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-xs text-slate-500">{customer.account_number || 'No account'} • {customer.postcode || 'No postcode'} • {customer.customer_type || 'account'}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedCustomer && onStop && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              This account is on stop. New jobs cannot be created.
            </div>
          )}

          {selectedCustomer && !onStop && (
            <>
              <div className="grid gap-2">
                <Label>Choose Agreement / Site</Label>
                <div className="space-y-2">
                  {agreements.map((agreement) => (
                    <div key={agreement.id} className={`rounded border px-3 py-2 ${selectedAgreement?.id === agreement.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}>
                      <div className="font-medium text-sm">{agreement.site_name || 'Site'}</div>
                      <div className="text-xs text-slate-600">{agreement.site_address}</div>
                      <div className="text-xs text-slate-500 mt-1">{agreement.service_name || 'No service'} • £{Number(agreement.standard_price_gbp || 0).toFixed(2)} • {agreement.skip_currently_on_site ? 'Skip on site' : 'No skip on site'}</div>
                      <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => applyAgreement(agreement)}>Use this site</Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant={newAgreementMode ? 'default' : 'outline'} onClick={() => { setNewAgreementMode(!newAgreementMode); setSelectedAgreement(null) }}>
                  New Site / New Agreement
                </Button>
              </div>

              {newAgreementMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded border border-slate-200 p-3">
                  <div className="grid gap-1"><Label>Site Name</Label><Input value={form.site_name} onChange={(e) => setForm((p: any) => ({ ...p, site_name: e.target.value }))} /></div>
                  <div className="grid gap-1"><Label>Site Address</Label><Input value={form.site_address} onChange={(e) => setForm((p: any) => ({ ...p, site_address: e.target.value }))} /></div>
                  <div className="grid gap-1"><Label>Lat</Label><Input value={form.site_lat} onChange={(e) => setForm((p: any) => ({ ...p, site_lat: e.target.value }))} /></div>
                  <div className="grid gap-1"><Label>Lng</Label><Input value={form.site_lng} onChange={(e) => setForm((p: any) => ({ ...p, site_lng: e.target.value }))} /></div>
                  <div className="grid gap-1">
                    <Label>Service</Label>
                    <Select value={String(form.service_id || '')} onValueChange={(v) => {
                      const svc = services.find((s) => String(s.id) === v)
                      setForm((p: any) => ({
                        ...p,
                        service_id: v,
                        ewc_code_id: String(svc?.default_ewc_code_id ?? p.ewc_code_id),
                        price_gbp: Number(svc?.default_price_gbp ?? p.price_gbp),
                        vat_rate: Number(svc?.vat_rate ?? p.vat_rate),
                      }))
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>{services.map((svc) => <SelectItem key={svc.id} value={String(svc.id)}>{svc.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label>Default EWC</Label>
                    <Select value={String(form.ewc_code_id || '')} onValueChange={(v) => setForm((p: any) => ({ ...p, ewc_code_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select EWC" /></SelectTrigger>
                      <SelectContent>{ewcCodes.map((code) => <SelectItem key={code.id} value={String(code.id)}>{code.code} - {code.description}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}

          {loadingNearby && <div className="text-xs text-slate-500">Finding nearby skips on site...</div>}
          {!loadingNearby && nearbySkips.length > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
              <div className="font-medium mb-1">{nearbySkips.length} skips on site within 2km of this address</div>
              <div className="space-y-1">
                {nearbySkips.map((nearby: any) => (
                  <div key={`${nearby.agreement_id}-${nearby.distance_km}`} className="text-xs flex items-center justify-between gap-2">
                    <span>{nearby.customer_name} • {nearby.site_address} • {nearby.skip_size_yards || '-'}yd • {nearby.days_on_site} days • {nearby.distance_km}km away</span>
                    <Button type="button" size="sm" variant="outline">Schedule Collection</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="button" disabled={!canProceedStep1()} onClick={() => setStep(2)}>Next: Job Details</Button>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label>Job Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((p: any) => ({ ...p, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{JOB_TYPES.map((type) => <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>Service</Label>
            <Select value={String(form.service_id || '')} onValueChange={(v) => {
              const svc = services.find((s) => String(s.id) === v)
              setForm((p: any) => ({ ...p, service_id: v, vat_rate: Number(svc?.vat_rate ?? p.vat_rate), price_gbp: Number(svc?.default_price_gbp ?? p.price_gbp) }))
            }}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>{services.map((svc) => <SelectItem key={svc.id} value={String(svc.id)}>{svc.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>EWC Code</Label>
            <Select value={String(form.ewc_code_id || '')} onValueChange={(v) => setForm((p: any) => ({ ...p, ewc_code_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select EWC" /></SelectTrigger>
              <SelectContent>{ewcCodes.map((code) => <SelectItem key={code.id} value={String(code.id)}>{code.code} - {code.description}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-1"><Label>Scheduled Date</Label><Input type="date" value={form.scheduled_date} onChange={(e) => setForm((p: any) => ({ ...p, scheduled_date: e.target.value }))} /></div>

          <div className="grid gap-1">
            <Label>Time Slot</Label>
            <Select value={form.time_slot} onValueChange={(v) => setForm((p: any) => ({ ...p, time_slot: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIME_SLOTS.map((slot) => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {form.time_slot === 'Specific' && <div className="grid gap-1"><Label>Specific Time</Label><Input type="time" value={form.scheduled_time} onChange={(e) => setForm((p: any) => ({ ...p, scheduled_time: e.target.value }))} /></div>}

          <div className="grid gap-1">
            <Label>Driver</Label>
            <Select value={String(form.driver_id || '')} onValueChange={(v) => setForm((p: any) => ({ ...p, driver_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>{drivers.map((driver) => <SelectItem key={driver.id} value={String(driver.id)}>{driver.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>Vehicle</Label>
            <Select value={String(form.vehicle_id || '')} onValueChange={(v) => setForm((p: any) => ({ ...p, vehicle_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>{vehicles.map((vehicle) => <SelectItem key={vehicle.id} value={String(vehicle.id)}>{vehicle.registration} • {vehicle.capacity_tonnes}t</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>{poRequired ? 'Purchase Order Number * Required for this customer' : 'Purchase Order Number (Optional)'}</Label>
            <Input value={form.po_number} onChange={(e) => setForm((p: any) => ({ ...p, po_number: e.target.value }))} />
            {poRequired && !String(form.po_number || '').trim() && <p className="text-xs text-red-600">Purchase order number is required for {selectedCustomer?.name}</p>}
          </div>

          <div className="grid gap-1"><Label>Requested By</Label><Input value={form.requested_by} onChange={(e) => setForm((p: any) => ({ ...p, requested_by: e.target.value }))} /></div>
          <div className="md:col-span-2 grid gap-1"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input id="highway" type="checkbox" checked={Boolean(form.highway_placement)} onChange={(e) => setForm((p: any) => ({ ...p, highway_placement: e.target.checked }))} />
            <Label htmlFor="highway">Highway Placement?</Label>
          </div>

          {Boolean(form.highway_placement) && (
            <>
              <div className="grid gap-1"><Label>Local Authority</Label><Input value={form.local_authority} onChange={(e) => setForm((p: any) => ({ ...p, local_authority: e.target.value }))} /></div>
              <div className="grid gap-1"><Label>Permit Needed From</Label><Input type="date" value={form.permit_start_date} onChange={(e) => setForm((p: any) => ({ ...p, permit_start_date: e.target.value }))} /></div>
              <div className="grid gap-1"><Label>Permit Needed To</Label><Input type="date" value={form.permit_end_date} onChange={(e) => setForm((p: any) => ({ ...p, permit_end_date: e.target.value }))} /></div>
              <div className="md:col-span-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Highway permit required. Job should not proceed until permit is approved.
              </div>
            </>
          )}

          <div className="md:col-span-2 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" onClick={() => setStep(3)}>Next: Pricing</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid gap-1"><Label>Service Price</Label><Input type="number" step="0.01" value={form.price_gbp} onChange={(e) => setForm((p: any) => ({ ...p, price_gbp: e.target.value }))} /></div>
          <div className="grid gap-1"><Label>VAT Rate (%)</Label><Input type="number" step="0.01" value={form.vat_rate} onChange={(e) => setForm((p: any) => ({ ...p, vat_rate: e.target.value }))} /></div>
          <div className="rounded border p-3 text-sm">VAT Amount: £{vatAmount.toFixed(2)}</div>
          <div className="rounded border p-3 text-sm font-semibold">Total: £{totalAmount.toFixed(2)}</div>

          <div className="grid gap-1">
            <Label>Payment Method</Label>
            <Select value={form.payment_method} onValueChange={(v) => setForm((p: any) => ({ ...p, payment_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {selectedCustomer?.customer_type === 'cash'
                  ? ['cash', 'card', 'cheque', 'bacs'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)
                  : ['account', 'cash', 'card', 'bacs', 'cheque'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2"><input id="is_paid" type="checkbox" checked={Boolean(form.is_paid)} onChange={(e) => setForm((p: any) => ({ ...p, is_paid: e.target.checked }))} /><Label htmlFor="is_paid">Is Paid</Label></div>
          {Boolean(form.is_paid) && <div className="grid gap-1"><Label>Paid Date</Label><Input type="date" value={form.paid_date} onChange={(e) => setForm((p: any) => ({ ...p, paid_date: e.target.value }))} /></div>}

          {weighAll && <div className="md:col-span-2 rounded border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">This customer requires weight capture on all jobs.</div>}

          <div className="md:col-span-2 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button type="button" onClick={() => setStep(4)}>Next: Confirmation</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div className="rounded border border-slate-200 p-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
            <div><span className="text-slate-500">Customer:</span> {selectedCustomer?.name}</div>
            <div><span className="text-slate-500">Agreement:</span> {selectedAgreement?.site_name || form.site_name || 'New site'}</div>
            <div><span className="text-slate-500">Address:</span> {selectedAgreement?.site_address || form.site_address}</div>
            <div><span className="text-slate-500">Job Type:</span> {form.type}</div>
            <div><span className="text-slate-500">Date:</span> {form.scheduled_date}</div>
            <div><span className="text-slate-500">Time Slot:</span> {form.time_slot}{form.scheduled_time ? ` (${form.scheduled_time})` : ''}</div>
            <div><span className="text-slate-500">PO:</span> {form.po_number || '-'}</div>
            <div><span className="text-slate-500">Requested By:</span> {form.requested_by || '-'}</div>
            <div><span className="text-slate-500">Payment:</span> {form.payment_method}</div>
            <div><span className="text-slate-500">Total:</span> £{totalAmount.toFixed(2)}</div>
          </div>

          {(selectedAgreement?.site_lat || form.site_lat) && (selectedAgreement?.site_lng || form.site_lng) && (
            <div className="overflow-hidden rounded border border-slate-200">
              <SmallMap lat={Number(selectedAgreement?.site_lat || form.site_lat)} lng={Number(selectedAgreement?.site_lng || form.site_lng)} />
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button type="button" disabled={!canSave() || saving} onClick={saveJob}>{saving ? 'Saving...' : 'Save Job'}</Button>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-500 flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Nearby skip search loads asynchronously after site geolocation and does not block form progression.
      </div>
    </div>
  )
}
