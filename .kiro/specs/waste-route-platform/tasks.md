# Implementation Plan: Waste Route Optimisation Platform

## Overview

Incremental build of the Next.js 14+ App Router prototype in the order that minimises broken states: data layer first, then server libraries, then API routes, then layout shell, then pages from core (Dispatcher, Optimiser) outward to Option 3-only modules (Driver, Customer, Admin, Compliance, Telematics, Reports), finishing with deployment config.

All code is TypeScript. Option 3-only tasks are marked **[Option 3]**.

---

## Tasks

- [x] 1. Complete seed data in `/lib/seed.ts`
  - Add `waste_records` seed rows linked to completed jobs and their vehicles (at least 4 rows across yards)
  - Add `telematics_events` seed rows covering all five event types (`harsh_brake`, `speeding`, `idle_excess`, `geofence_exit`, `low_fuel`) spread across active vehicles and drivers
  - Add `accounting_sync_log` seed rows with at least one `success` and one `failed` entry per provider (`xero`, `quickbooks`, `sage`)
  - Add `job_events` seed rows with `event_type = 'signature_captured'` for each completed job
  - Insert the `seed_run` sentinel row (`INSERT INTO seed_run (id) VALUES (1)`) as the final statement so idempotency guard works correctly
  - _Requirements: 8.1, 8.4, 8.5_

- [x] 2. Implement `/lib/optimizer.ts` — route optimisation algorithm
  - [x] 2.1 Implement `haversine(a, b)` using the spherical law of cosines formula with Earth radius 6371 km
    - Accept `{lat, lng}` objects; return distance in km
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 2.2 Write property test for `haversine` symmetry (Property 8)
    - **Property 8: haversine is symmetric** — `∀ a, b: haversine(a,b) === haversine(b,a)`
    - Use `fast-check` arbitrary lat/lng values in valid ranges
    - **Validates: Requirements 4.2**
  - [x] 2.3 Implement `twoOptSwap(route, i, k)` — reverse the sub-array `route[i..k]`
    - Return a new array; do not mutate input
    - _Requirements: 3.11_
  - [ ]* 2.4 Write property test for `twoOptSwap` permutation invariant (Property 2)
    - **Property 2: twoOptSwap is a permutation** — output has same length and same elements as input
    - **Validates: Requirements 3.11**
  - [x] 2.5 Implement `nearestNeighbour(yard, jobs)` construction heuristic
    - Start from yard; greedily pick the nearest unvisited job; return ordered `Job[]`
    - _Requirements: 3.1_
  - [x] 2.6 Implement `twoOpt(route, yard, maxIterations = 200)` improvement loop
    - Compute `twoOptDelta` for each `(i, k)` pair; apply swap when delta < -0.001; cap at 200 iterations
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 2.7 Write property test for optimiser non-worsening (Property 1)
    - **Property 1: Optimiser never worsens a route** — `∀ jobs (length ≥ 1): after.totalDistanceKm ≤ before.totalDistanceKm`
    - Generate random job arrays with valid lat/lng using fast-check
    - **Validates: Requirements 3.2, 3.3**
  - [x] 2.8 Implement `optimise(yard, jobs, constraints)` — orchestrate NN + 2-opt, compute stats and arrival times, return `OptimisationResult`
    - Include `before` stats (naive order), `after` stats (optimised), `sequence` with estimated arrivals, and `improvement` percentage
    - Use `AVG_SPEED_KMH = 30` and per-type service times (delivery 15 min, collection 20 min, exchange 25 min, wait_and_load 45 min)
    - _Requirements: 3.1, 3.9, 3.10_

- [x] 3. Implement `/lib/gps-simulator.ts` — GPS position simulation
  - Export `startGpsSimulator()` that calls `setInterval` every 5000 ms
  - For each active driver-vehicle pair, interpolate position between waypoints using `lat = from.lat + (to.lat - from.lat) * progress`
  - Compute `heading` as bearing from current to next waypoint; set `speed_kmh` to `randomBetween(25, 50)`
  - Advance `progress` by 0.15 per tick; increment `segmentIndex` when progress ≥ 1.0; reset to 0 when past last waypoint
  - Insert a new `gps_positions` row per driver on each tick
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 4. Implement all API routes
  - [x] 4.1 `GET /api/jobs` — filter by `date`, `yardId`, `status`, `driverId`; order by `sequence_order ASC, scheduled_time ASC`; return `[]` not null when no matches
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 4.2 `POST /api/jobs/[id]/complete` — validate `status === 'in_progress'` and non-empty `signature`; update job; insert `job_events` row; insert `waste_records` if waste data present; return `{ success: true }`
    - Return HTTP 400 with `'Job must be in_progress to complete'` for wrong status
    - Return HTTP 400 for empty/whitespace signature
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_
  - [x] 4.3 `POST /api/routes/optimise` — load pending jobs for yard+date; call `optimise()`; return `OptimisationResult` without persisting; return HTTP 400 `'No pending jobs found for this yard and date'` when none exist
    - _Requirements: 3.1, 3.4, 3.5, 3.10_
  - [x] 4.4 `POST /api/routes/confirm` — update all jobs in route with `driver_id`, `vehicle_id`, `status = 'assigned'`, `sequence_order`; upsert route record with `status = 'optimised'` and `optimised_at`; validate all job `yard_id` match route `yard_id`
    - _Requirements: 3.6, 3.7, 3.8, 15.6_
  - [x] 4.5 `GET /api/gps` — return single most-recent `gps_positions` row per driver; only drivers with `status = 'on_shift'`; accept optional `yardId` filter
    - _Requirements: 7.7, 7.8, 7.9_
  - [x] 4.6 `GET /api/drivers`, `GET /api/vehicles`, `GET /api/yards` — return full collections with optional `yardId` filter
    - _Requirements: 9.6_
  - [x] 4.7 `GET /api/customers`, `GET /api/bookings` — bookings accept `customerId` query param and return only that customer's bookings
    - _Requirements: 6.5, 6.6, 9.6_
  - [x] 4.8 `POST /api/bookings` — create booking with all required fields; validate `skip_size` is in `[2,4,6,8,10,12,14,16]`; set `status = 'pending'`
    - _Requirements: 6.3, 6.4, 15.1_
  - [x] 4.9 `GET /api/invoices` — return invoices with optional `customerId` filter
    - _Requirements: 9.6_
  - [x] 4.10 `GET /api/compliance` — return all waste records joined with job and vehicle details
    - _Requirements: 11.3_
  - [x] 4.11 `GET /api/telematics` — return telematics events with optional `vehicleId` / `driverId` filters
    - _Requirements: 10.2_
  - [x] 4.12 `GET /api/reports/summary`, `GET /api/reports/jobs-per-day`, `GET /api/reports/distance`, `GET /api/reports/revenue` — server-side SQL aggregation; return summary objects not raw rows
    - _Requirements: 12.1, 12.2, 9.7_
  - [x] 4.13 `PATCH /api/drivers/[id]` — update driver `status` (for shift toggle)
    - _Requirements: 5.3_

- [x] 5. Checkpoint — verify API layer
  - Ensure all API routes compile with no TypeScript errors; run `next build` to confirm; ask the user if questions arise.

- [x] 6. Implement layout shell — AppShell, Sidebar, Navbar, OptionContext
  - [x] 6.1 Create `components/layout/OptionContext.tsx` — `OptionProvider` with `useState<'option1' | 'option3'>('option3')`; export `useOption` hook
    - _Requirements: 1.2_
  - [x] 6.2 Create `components/layout/Sidebar.tsx` — collapsible sidebar with nav items array; render each item as a Next.js `<Link>`; grey out and disable `option3Only` items when `option === 'option1'`; show tooltip "Available in Option 3 – Full Platform" on locked items; include the Option Toggle pill (radio/button switching between Option 1 and Option 3)
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.7_
  - [x] 6.3 Create `components/layout/Navbar.tsx` — top bar with breadcrumbs derived from pathname, live clock (`setInterval` 1 s), yard filter `<Select>`, and notifications bell icon
    - _Requirements: 1.6_
  - [x] 6.4 Update `app/layout.tsx` — wrap children in `OptionProvider`; render `<Sidebar>` and `<Navbar>`; call `runSeed()` at the top of the server component
    - _Requirements: 1.1, 8.6_
  - [x] 6.5 Update `app/page.tsx` — add `redirect('/dispatcher')` so the root URL forwards to the Dispatcher Dashboard
    - _Requirements: 2.1_

- [x] 7. Implement `/dispatcher` — Dispatcher Dashboard
  - [x] 7.1 Create `app/dispatcher/page.tsx` — server component that fetches initial jobs and yards; pass to client components; render stats strip, job list, and map side-by-side
    - _Requirements: 2.1, 2.6_
  - [x] 7.2 Create `components/dispatcher/DispatcherMap.tsx` — load via `next/dynamic` with `ssr: false`; render Leaflet map with OSM tiles; yard markers (warehouse icon); job pins coloured by status; route polylines; truck icons at GPS positions; job popup on pin click
    - _Requirements: 2.2, 2.4, 2.5, 16.1, 16.2, 16.3, 16.4_
  - [x] 7.3 Create `components/dispatcher/JobList.tsx` — stats strip (Total / Pending / In Progress / Completed / Unassigned); tabs (All / Pending / In Progress / Completed); draggable job cards via `@dnd-kit/sortable`; on reorder assign contiguous `sequence_order` starting from 1
    - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_
  - [x] 7.4 Add GPS polling in `app/dispatcher/page.tsx` (client-side `useEffect`) — `setInterval` every 5 s calling `GET /api/gps`; update truck marker positions; use `useMemo` on job and GPS data
    - _Requirements: 2.3, 17.4_

- [x] 8. Implement `/optimizer` — Route Optimiser page
  - [x] 8.1 Create `app/optimizer/page.tsx` — controls panel: date picker, yard selector, vehicle selector, driver selector, constraint toggles (maxStops, shiftEndTime, avoidMotorways, prioritiseCommercial); "Run Optimisation" button
    - _Requirements: 3.1_
  - [x] 8.2 Create `components/optimizer/ResultsView.tsx` — display before/after stats table (distance, duration, stops); improvement percentage badge; ordered sequence list with estimated arrival times and distance from previous stop; "Confirm & Assign" button that calls `POST /api/routes/confirm`
    - _Requirements: 3.10_

- [x] 9. Checkpoint — verify core modules
  - Ensure Dispatcher and Optimiser pages render without errors; GPS polling animates markers; optimisation returns improvement ≥ 0; ask the user if questions arise.

- [x] 10. Implement Admin base pages — yards, drivers, vehicles, skips
  - [x] 10.1 Create `app/admin/yards/page.tsx` — table of yards with name, address, service radius, skip stock summary; "Add Yard" form (name, address, lat, lng, radius)
    - _Requirements: 14.1_
  - [x] 10.2 Create `app/admin/drivers/page.tsx` — table of drivers with yard, name, phone, licence, shift times, status; "Add Driver" form validating required fields; inline status badge
    - _Requirements: 14.1, 14.3_
  - [x] 10.3 Create `app/admin/vehicles/page.tsx` — table of vehicles with yard, registration, type, capacity, max skips, status; "Add Vehicle" form validating `type` enum and required fields
    - _Requirements: 14.1, 14.2_
  - [x] 10.4 Create `app/admin/skips/page.tsx` — table of skip stock per yard and size; highlight low-stock rows (available < 3)
    - _Requirements: 14.1_

- [x] 11. Implement `/reports` — Reports module **[Option 3]**
  - [x] 11.1 Create `app/reports/page.tsx` — fetch aggregated data from `/api/reports/*`; render three Recharts charts: jobs completed per day (BarChart), total distance per route (LineChart), revenue per period (AreaChart)
    - _Requirements: 12.1, 12.2_
  - [x] 11.2 Add Option 1 section to reports page — show only the route optimisation summary chart (distance saved); hide revenue and compliance charts when `option === 'option1'`
    - _Requirements: 12.3_

- [x] 12. Implement `/driver` — Driver Mobile View **[Option 3]**
  - [x] 12.1 Create `app/driver/page.tsx` — phone frame container (`max-w-[390px] mx-auto`); bottom tab bar (Home, Jobs, Map, Profile); shift toggle calling `PATCH /api/drivers/[id]`
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 12.2 Create `components/driver/JobCard.tsx` — expandable job card showing address, skip size, notes; "Navigate" link (Google Maps deep-link); "Complete Job" button that opens completion modal
    - _Requirements: 5.2_
  - [x] 12.3 Create `components/driver/CompletionModal.tsx` — signature pad (`react-signature-canvas`); optional photo capture (`<input type="file" accept="image/*" capture>`); waste type, weight, disposal site fields; submit calls `POST /api/jobs/[id]/complete`; show error toast on HTTP 400
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_
  - [x] 12.4 Add route map tab in driver view — Leaflet map loaded with `next/dynamic ssr:false`; pulsing dot at driver's current GPS position
    - _Requirements: 5.11, 16.1_

- [x] 13. Implement `/customer` — Customer Portal **[Option 3]**
  - [x] 13.1 Create `app/customer/layout.tsx` — lighter colour palette (white/slate background, green accent); no sidebar; simple header with logo and "My Account" link
    - _Requirements: 6.1_
  - [x] 13.2 Create `app/customer/page.tsx` — 4-step booking form: step 1 job type, step 2 skip size, step 3 address + date + time slot, step 4 confirmation summary; submit calls `POST /api/bookings`
    - _Requirements: 6.2, 6.3, 6.4_
  - [x] 13.3 Create `app/customer/orders/page.tsx` — fetch `GET /api/bookings?customerId=X`; display order history table with booking date, type, skip size, status; invoice list with amount, VAT, total, status, due date; mock "Pay Now" button on unpaid invoices
    - _Requirements: 6.5, 6.6, 6.7, 6.8_

- [x] 14. Implement Option 3 Admin pages — bookings, invoicing, accounting **[Option 3]**
  - [x] 14.1 Create `app/admin/bookings/page.tsx` — table of all bookings with customer, date, type, skip size, status; status filter; link to associated job
    - _Requirements: 14.1_
  - [x] 14.2 Create `app/admin/invoicing/page.tsx` — invoice table with customer, job, amount, VAT, total, status, due date; status filter (draft / sent / paid / overdue); "Mark as Sent" and "Mark as Paid" actions calling `PATCH /api/invoices/[id]`; add `PATCH /api/invoices/[id]` route
    - _Requirements: 13.1, 13.2_
  - [x] 14.3 Create `app/admin/accounting/page.tsx` — accounting sync log table showing provider, record type, record ID, synced at, status, error message; mock "Sync to Xero" button that inserts a new `accounting_sync_log` row via `POST /api/accounting/sync`; add that API route
    - _Requirements: 13.3, 13.4_

- [x] 15. Implement `/compliance` — Compliance module **[Option 3]**
  - Create `app/compliance/page.tsx` — table of waste records joined with job and vehicle details (job address, vehicle registration, waste type, weight, disposal site, transfer note number, consignment note); date range filter; "Export CSV" button that generates a client-side CSV download
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 16. Implement `/telematics` — Fleet Telematics module **[Option 3]**
  - [x] 16.1 Create `app/telematics/page.tsx` — fleet overview cards per vehicle (registration, status, last known speed, fuel level, last event); events feed table showing event type, driver, vehicle, location, timestamp; filter by event type
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 16.2 Add driver score cards — compute a simple score per driver from telematics events (deduct points per harsh_brake / speeding event); display as a ranked list with score badge
    - _Requirements: 10.1_

- [x] 17. Checkpoint — verify Option 3 modules
  - Ensure all Option 3 pages render; option toggle correctly locks/unlocks nav items; ask the user if questions arise.

- [x] 18. Railway deployment configuration
  - Add `railway.json` (or `nixpacks.toml`) at `midsoft/` root specifying build command `npm run build` and start command `npm start`
  - Add `waste_route.db` to `.gitignore` if not already present
  - Verify `next.config.ts` has no `output: 'export'` (must be Node.js server mode for API routes and SQLite)
  - Confirm no paid API keys are referenced anywhere in the codebase
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [x] 19. Final checkpoint — full build verification
  - Run `next build` and confirm zero TypeScript and ESLint errors; ensure all tests pass; ask the user if questions arise.

---

## Notes

- Tasks marked `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already available via devDependencies or add with `npm i -D fast-check`)
- All Leaflet map components must use `next/dynamic` with `{ ssr: false }` — never import Leaflet at the top level of a server component
- Option 3-only pages should check `useOption()` and render a locked state (or redirect) when `option === 'option1'`, matching the sidebar lock behaviour
- The GPS simulator should be started once from `app/layout.tsx` (server component) using a module-level singleton guard to avoid multiple intervals in development hot-reload
- SQLite `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON` are already set in `lib/db.ts` — do not remove them
