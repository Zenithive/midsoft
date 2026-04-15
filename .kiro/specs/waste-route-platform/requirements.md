# Requirements Document

## Introduction

The Waste Route Optimisation Platform is a Next.js 14+ App Router prototype that demonstrates two commercial options side-by-side for a waste management client: **Option 1** (Route Optimisation Layer — an add-on to an existing system) and **Option 3** (Full Platform Replacement — a complete enterprise solution). The platform uses a single SQLite database, a custom nearest-neighbour + 2-opt route optimisation algorithm, simulated GPS telemetry, and a responsive UI built with Tailwind CSS and shadcn/ui. All data persists locally with no paid external APIs. The prototype is deployable to Railway.

The system covers nine functional modules: Dispatcher Dashboard, Route Optimiser, Driver Mobile View, Customer Portal, Admin Panel, Compliance, Fleet Telematics, Reports, and GPS Simulation. A sidebar option-toggle pill instantly locks or unlocks Option 3-only modules, making the feature delta immediately visible during a live demo.

---

## Glossary

- **System**: The Waste Route Optimisation Platform as a whole.
- **Dispatcher**: An internal user responsible for scheduling and monitoring waste collection jobs.
- **Driver**: A field operative who receives and completes jobs via the mobile view.
- **Customer**: An end user who books skip hire or waste collection services via the Customer Portal.
- **Admin**: A privileged internal user who manages yards, vehicles, drivers, and system configuration.
- **Yard**: A depot from which vehicles and drivers operate.
- **Job**: A single field task (delivery, collection, exchange, or wait-and-load) assigned to a driver and vehicle.
- **Booking**: A customer-initiated request that generates one or more Jobs.
- **Route**: An ordered sequence of Jobs assigned to a single driver and vehicle for a given date.
- **Optimiser**: The server-side library (`optimizer.ts`) implementing the nearest-neighbour + 2-opt algorithm.
- **GPS_Simulator**: The server-side library (`gps-simulator.ts`) that writes interpolated GPS positions to the database on a 5-second interval.
- **Option_Toggle**: The sidebar UI control that switches the platform between Option 1 and Option 3 display modes.
- **Seed_Runner**: The one-time data seeding function (`seed.ts`) that populates the database with representative demo data.
- **AppShell**: The root Next.js layout component providing the sidebar, top navbar, and OptionContext.
- **OptionContext**: The React context that holds and distributes the current option selection (`option1` | `option3`) to all child components.
- **DB**: The SQLite database file (`waste_route.db`) accessed via `better-sqlite3`.
- **API**: The Next.js API route layer (`/api/*`) that mediates between the UI and the DB.
- **Telematics_Module**: The Fleet Telematics module that records and displays vehicle behaviour events.
- **Compliance_Module**: The Compliance module that manages waste transfer notes and regulatory records.
- **Reports_Module**: The Reports module that provides aggregated analytics and charts.

---

## Requirements

### Requirement 1: Application Shell and Option Toggle

**User Story:** As a demo presenter, I want a sidebar with an option-toggle pill, so that I can instantly switch between Option 1 and Option 3 views during a live client demonstration.

#### Acceptance Criteria

1. THE AppShell SHALL render a collapsible sidebar containing all navigation items defined in the nav configuration.
2. THE AppShell SHALL provide an OptionContext to all child pages with a default value of `option3`.
3. WHEN the Option_Toggle is set to `option1`, THE AppShell SHALL visually lock all nav items marked `option3Only` by greying them out and disabling navigation.
4. WHEN a locked nav item is hovered or focused, THE AppShell SHALL display the tooltip text "Available in Option 3 – Full Platform".
5. WHEN the Option_Toggle is set to `option3`, THE AppShell SHALL unlock all nav items and restore full navigation.
6. THE AppShell SHALL render a top navbar containing breadcrumbs, a live clock, a yard filter selector, and a notifications indicator.
7. FOR ALL nav items marked `option3Only`, THE System SHALL lock those items when `option === 'option1'` and unlock them when `option === 'option3'`.

---

### Requirement 2: Dispatcher Dashboard

**User Story:** As a Dispatcher, I want a real-time dashboard showing today's jobs on a map alongside a filterable job list, so that I can monitor field operations and respond to changes throughout the day.

#### Acceptance Criteria

1. WHEN the Dispatcher navigates to `/dispatcher`, THE System SHALL fetch jobs filtered by the selected date and yard from `GET /api/jobs`.
2. WHEN the Dispatcher navigates to `/dispatcher`, THE System SHALL fetch the latest GPS positions from `GET /api/gps` and render truck markers on the Leaflet map.
3. WHILE the Dispatcher Dashboard is open, THE System SHALL poll `GET /api/gps` every 5 seconds and update truck marker positions on the map.
4. THE System SHALL render job pins on the map coloured by status: pending = grey, assigned = blue, in_progress = orange, completed = green.
5. WHEN a job pin is clicked, THE System SHALL display a popup containing the customer name, address, skip size, current status, and action buttons.
6. THE System SHALL render a stats strip above the job list showing the total count, pending count, in-progress count, completed count, and unassigned count derived from the current job list.
7. FOR ALL sets of jobs displayed in the stats strip, THE System SHALL compute each count accurately from the job list data.
8. THE System SHALL render job list tabs for All, Pending, In Progress, and Completed, filtering the displayed jobs accordingly.
9. THE System SHALL support drag-and-drop reordering of jobs via `@dnd-kit/sortable`.
10. WHEN jobs are reordered via drag-and-drop, THE System SHALL assign contiguous `sequence_order` integer values starting from 1 to the reordered job list.
11. FOR ALL drag-and-drop reorder operations, THE System SHALL produce `sequence_order` values that are contiguous integers starting from 1 with no gaps or duplicates.

---

### Requirement 3: Route Optimiser

**User Story:** As a Dispatcher, I want to run an automated route optimisation for a selected date, yard, vehicle, and driver, so that I can reduce total travel distance and improve operational efficiency.

#### Acceptance Criteria

1. WHEN the Dispatcher submits an optimisation request via `POST /api/routes/optimise`, THE Optimiser SHALL apply the nearest-neighbour construction heuristic followed by up to 200 iterations of 2-opt improvement.
2. FOR ALL optimisation runs, THE Optimiser SHALL return a result where `after.totalDistanceKm` is less than or equal to `before.totalDistanceKm`.
3. FOR ALL optimisation runs with 3 or more jobs, THE Optimiser SHALL return an `improvement` value greater than or equal to 0 (the route is never made worse).
4. WHEN `POST /api/routes/optimise` is called with no pending jobs for the specified yard and date, THE API SHALL return HTTP 400 with the error message `No pending jobs found for this yard and date`.
5. THE Optimiser SHALL NOT persist any changes to the DB until `POST /api/routes/confirm` is called.
6. WHEN `POST /api/routes/confirm` is called, THE API SHALL update every job in the confirmed route to have a non-null `driver_id` and non-null `vehicle_id`.
7. FOR ALL confirmed routes, THE System SHALL ensure every job in the route has a non-null `driver_id` and non-null `vehicle_id`.
8. WHEN `POST /api/routes/confirm` is called, THE API SHALL set the route `status` to `optimised` and record `optimised_at` as the current timestamp.
9. THE Optimiser SHALL complete the optimisation computation within 500 milliseconds for job sets of up to 20 jobs.
10. THE Optimiser SHALL return an `OptimisationResult` containing `before` stats, `after` stats, the ordered `sequence` of jobs with estimated arrival times, and the `improvement` percentage.
11. FOR ALL calls to `twoOptSwap(route, i, k)`, THE Optimiser SHALL return an array that is a valid permutation of the input route (same jobs, same length, different order).

---

### Requirement 4: Haversine Distance Calculation

**User Story:** As a developer, I want a correct haversine distance function, so that all distance calculations in the optimiser and GPS simulator are geographically accurate.

#### Acceptance Criteria

1. WHEN `haversine(a, b)` is called with the coordinates of London and Manchester, THE Optimiser SHALL return a distance of approximately 262 km (within ±5 km tolerance).
2. FOR ALL pairs of coordinate points `(a, b)`, THE Optimiser SHALL return the same distance for `haversine(a, b)` and `haversine(b, a)` (symmetry property).
3. THE Optimiser SHALL accept `lat` values in the range [-90, 90] and `lng` values in the range [-180, 180].

---

### Requirement 5: Driver Mobile View

**User Story:** As a Driver, I want a mobile-optimised interface on my phone, so that I can view my assigned jobs, navigate to each stop, and record job completions with a signature and photo.

#### Acceptance Criteria

1. THE System SHALL render the Driver Mobile View within a maximum width of 390px to simulate a phone form factor.
2. THE System SHALL render a bottom tab bar with tabs: Home, Jobs, Map, and Profile.
3. WHEN a Driver taps the shift toggle, THE System SHALL update the driver's `status` between `on_shift` and `off_duty` in the DB.
4. WHEN a Driver submits a job completion via `POST /api/jobs/[id]/complete`, THE System SHALL require a non-empty base64 signature string; IF the signature is empty or absent, THEN THE API SHALL return HTTP 400.
5. FOR ALL job completion submissions with an empty or whitespace-only signature, THE API SHALL reject the request with HTTP 400.
6. WHEN a Driver completes a job, THE API SHALL update the job `status` to `completed` and set `completed_at` to the current UTC timestamp.
7. FOR ALL successful job completions, THE System SHALL insert a `job_events` row with `event_type = 'signature_captured'`.
8. WHEN a Driver submits job completion with waste data (wasteType, weightKg, disposalSite), THE API SHALL insert a `waste_records` row linked to the job and vehicle.
9. FOR ALL job completion submissions that include waste data, THE System SHALL create a `waste_records` row with the correct `job_id` and `vehicle_id`.
10. WHEN a Driver attempts to complete a job whose `status` is not `in_progress`, THE API SHALL return HTTP 400 with the error message `Job must be in_progress to complete`.
11. THE System SHALL render a route map within the Driver Mobile View showing the driver's current GPS position as a pulsing dot.

---

### Requirement 6: Customer Portal

**User Story:** As a Customer, I want to book skip hire or waste collection services online and view my order history, so that I can manage my waste disposal needs without calling the office.

#### Acceptance Criteria

1. THE System SHALL render the Customer Portal with a visually distinct lighter colour palette separate from the internal dispatcher UI.
2. THE System SHALL present a multi-step booking form with exactly 4 steps: job type selection, skip size selection, address and date entry, and confirmation.
3. WHEN a Customer submits a completed booking form, THE API SHALL create a `bookings` record with `customer_id`, `yard_id`, `booking_date`, `job_type`, `skip_size`, `preferred_time_slot`, and `status = 'pending'` all correctly set.
4. FOR ALL valid booking submissions, THE System SHALL persist a `bookings` record containing all required fields with correct values.
5. WHEN a Customer views their order history, THE API SHALL return only bookings associated with that customer's `customer_id`.
6. FOR ALL customer order history queries, THE System SHALL return only bookings belonging to the requesting customer.
7. THE System SHALL display an invoice list for the customer showing invoice amount, VAT, total, status, and due date.
8. THE System SHALL render a mock "Pay Now" button on unpaid invoices without processing real payments.

---

### Requirement 7: GPS Simulation

**User Story:** As a demo presenter, I want simulated GPS positions to animate truck markers on the dispatcher map, so that the live demo shows realistic vehicle movement without requiring real hardware.

#### Acceptance Criteria

1. THE GPS_Simulator SHALL write a new `gps_positions` row to the DB for each active driver-vehicle pair on a 5-second interval.
2. WHEN the GPS_Simulator interpolates a position between two waypoints at progress `p` (0.0 ≤ p ≤ 1.0), THE GPS_Simulator SHALL compute `lat = from.lat + (to.lat - from.lat) * p` and `lng = from.lng + (to.lng - from.lng) * p`.
3. FOR ALL interpolation steps, THE GPS_Simulator SHALL produce a position that lies on the straight line between the current waypoint and the next waypoint.
4. WHEN the GPS_Simulator reaches the last waypoint in the sequence, THE GPS_Simulator SHALL reset `segmentIndex` to 0 and `progress` to 0.0 to loop back to the yard.
5. THE GPS_Simulator SHALL record a `speed_kmh` value between 25 and 50 for each position update.
6. THE GPS_Simulator SHALL record a `heading` value computed as the bearing from the current waypoint to the next waypoint.
7. WHEN `GET /api/gps` is called, THE API SHALL return the single most-recent `gps_positions` row per driver.
8. FOR ALL GPS poll responses, THE System SHALL include at most one position entry per driver (the latest).
9. WHEN `GET /api/gps` is called, THE API SHALL return only positions for drivers whose `status = 'on_shift'`.

---

### Requirement 8: Seed Data

**User Story:** As a developer, I want a one-time seed runner that populates the database with representative demo data, so that the platform is immediately usable after deployment without manual data entry.

#### Acceptance Criteria

1. WHEN `runSeed()` is called and the `seed_run` table contains no rows, THE Seed_Runner SHALL populate the DB with demo data across all tables.
2. WHEN `runSeed()` is called and the `seed_run` table already contains a row, THE Seed_Runner SHALL skip all insert operations and return without modifying any data.
3. FOR ALL invocations of `runSeed()`, THE System SHALL ensure the `seed_run` table contains exactly one row after execution regardless of how many times the function has been called (idempotency).
4. THE Seed_Runner SHALL insert at least 2 yards, 4 vehicles, 4 drivers, 10 customers, 15 jobs, and 2 routes into the DB on first run.
5. THE Seed_Runner SHALL insert initial `gps_positions` rows for all seeded drivers so that the dispatcher map shows positions on first load.
6. WHEN the Next.js application starts, THE System SHALL invoke `runSeed()` from the root server layout to ensure data is available before any page renders.

---

### Requirement 9: API Layer

**User Story:** As a developer, I want a complete set of Next.js API routes covering all platform entities, so that the UI can read and write all data through a consistent HTTP interface.

#### Acceptance Criteria

1. THE API SHALL expose `GET /api/jobs` accepting optional query parameters `date`, `yardId`, `status`, and `driverId`, returning jobs ordered by `sequence_order ASC, scheduled_time ASC`.
2. WHEN `GET /api/jobs` is called with filter parameters, THE API SHALL return only jobs matching all provided filters.
3. FOR ALL `GET /api/jobs` responses, THE System SHALL return an empty array (not null) when no jobs match the filters.
4. THE API SHALL expose `POST /api/jobs/[id]/complete` for driver job completion as specified in Requirement 5.
5. THE API SHALL expose `POST /api/routes/optimise` and `POST /api/routes/confirm` for route optimisation as specified in Requirement 3.
6. THE API SHALL expose `GET /api/drivers`, `GET /api/vehicles`, `GET /api/yards`, `GET /api/customers`, `GET /api/bookings`, `GET /api/invoices`, `GET /api/compliance`, and `GET /api/telematics` returning the respective entity collections.
7. THE API SHALL expose `GET /api/reports/*` routes that perform server-side aggregation and return summary data rather than raw rows.
8. ALL API routes SHALL use `better-sqlite3` prepared statements for all DB queries to prevent SQL injection.
9. ALL API routes SHALL validate required input parameters and return HTTP 400 with a descriptive error message when validation fails.
10. WHEN the Option_Toggle is set to `option1`, THE API SHALL continue to respond to all Option 3-only API routes without restriction (data access is not gated by the option toggle).

---

### Requirement 10: Fleet Telematics Module (Option 3)

**User Story:** As a Fleet Manager, I want to monitor vehicle behaviour events such as harsh braking, speeding, and excessive idling, so that I can improve driver safety and reduce vehicle wear.

#### Acceptance Criteria

1. THE Telematics_Module SHALL display telematics events of types: `harsh_brake`, `speeding`, `idle_excess`, `geofence_exit`, and `low_fuel`.
2. WHEN a telematics event is recorded, THE API SHALL store the `vehicle_id`, `driver_id`, `event_type`, `lat`, `lng`, `speed_kmh`, and `timestamp` in the `telematics_events` table.
3. FOR ALL stored telematics events, THE System SHALL ensure `event_type` is one of the five valid enum values.
4. THE Telematics_Module SHALL be accessible only when `option === 'option3'`; WHEN `option === 'option1'`, THE AppShell SHALL lock this module.

---

### Requirement 11: Compliance Module (Option 3)

**User Story:** As a Compliance Officer, I want to record and retrieve waste transfer notes and consignment details for every completed job, so that the company meets its legal obligations under waste carrier regulations.

#### Acceptance Criteria

1. WHEN a job is completed with waste data, THE Compliance_Module SHALL store a `waste_records` row containing `waste_type`, `weight_kg`, `disposal_site`, `carrier_id`, `consignment_note`, and `transfer_note_number`.
2. FOR ALL waste records, THE System SHALL associate each record with a valid `job_id` and `vehicle_id` that exist in the DB.
3. THE API SHALL expose `GET /api/compliance` returning all waste records with their associated job and vehicle details.
4. THE Compliance_Module SHALL be accessible only when `option === 'option3'`; WHEN `option === 'option1'`, THE AppShell SHALL lock this module.

---

### Requirement 12: Reports Module (Option 3)

**User Story:** As a Manager, I want aggregated operational reports with charts, so that I can review performance metrics such as jobs completed per day, distance driven, and revenue generated.

#### Acceptance Criteria

1. THE Reports_Module SHALL display charts rendered by Recharts showing at minimum: jobs completed per day, total distance driven per route, and revenue per period.
2. WHEN `GET /api/reports/*` is called, THE API SHALL perform server-side SQL aggregation and return summary data rather than raw entity rows.
3. THE Reports_Module SHALL be accessible only when `option === 'option3'`; WHEN `option === 'option1'`, THE AppShell SHALL lock this module.

---

### Requirement 13: Invoicing and Accounting

**User Story:** As an Admin, I want invoices generated for completed jobs and a mock accounting sync log, so that the platform demonstrates end-to-end billing capability.

#### Acceptance Criteria

1. THE System SHALL store invoices with `amount_gbp`, `vat_gbp`, and `total_gbp` fields where `total_gbp = amount_gbp + vat_gbp`.
2. FOR ALL invoices, THE System SHALL ensure `total_gbp` equals `amount_gbp + vat_gbp`.
3. THE System SHALL record accounting sync attempts in the `accounting_sync_log` table with `provider`, `record_type`, `record_id`, `synced_at`, `status`, and optionally `error_message`.
4. FOR ALL accounting sync log entries, THE System SHALL ensure `provider` is one of `xero`, `quickbooks`, or `sage`, and `status` is one of `success` or `failed`.

---

### Requirement 14: Admin Panel (Option 3)

**User Story:** As an Admin, I want to manage yards, vehicles, drivers, and skip stock levels, so that the platform reflects the current operational state of the business.

#### Acceptance Criteria

1. THE Admin Panel SHALL allow creation, viewing, and editing of yards, vehicles, and drivers.
2. WHEN a vehicle is created, THE System SHALL require `registration`, `type` (one of `skip_lorry`, `flatbed`, `tipper`), `capacity_tonnes`, `max_skips`, and `yard_id`.
3. WHEN a driver is created, THE System SHALL require `name`, `phone`, `licence_class`, `shift_start`, `shift_end`, and `yard_id`.
4. THE Admin Panel SHALL be accessible only when `option === 'option3'`; WHEN `option === 'option1'`, THE AppShell SHALL lock this module.

---

### Requirement 15: Data Validation and Integrity

**User Story:** As a developer, I want all data inputs validated at the API layer, so that the database remains consistent and the application does not enter an invalid state.

#### Acceptance Criteria

1. THE API SHALL reject any job creation or update where `skip_size` is not one of: 2, 4, 6, 8, 10, 12, 14, 16.
2. THE API SHALL reject any record where `lat` is outside the range [-90, 90] or `lng` is outside the range [-180, 180].
3. THE API SHALL reject any record where `scheduled_date` is not a valid ISO date string in the format `YYYY-MM-DD`.
4. THE DB SHALL enforce foreign key constraints between `jobs.yard_id → yards.id`, `jobs.driver_id → drivers.id`, `jobs.vehicle_id → vehicles.id`, and `jobs.booking_id → bookings.id`.
5. THE DB SHALL enforce that `sequence_order` is greater than or equal to 0, where 0 indicates an unassigned job.
6. IF a route confirmation is attempted where any job's `yard_id` does not match the route's `yard_id`, THEN THE API SHALL return HTTP 400 with a descriptive error.

---

### Requirement 16: Map Rendering and Leaflet Integration

**User Story:** As a Dispatcher, I want an interactive Leaflet map that renders without server-side rendering errors, so that I can view job locations and truck positions reliably.

#### Acceptance Criteria

1. ALL Leaflet map components SHALL be loaded using `next/dynamic` with `{ ssr: false }` to prevent server-side rendering errors caused by the absence of the `window` object.
2. THE System SHALL render yard markers using a warehouse icon on the Leaflet map.
3. THE System SHALL render route polylines on the map for each active route.
4. THE System SHALL use OpenStreetMap tiles as the map tile provider, requiring no paid API key.

---

### Requirement 17: Performance

**User Story:** As a demo presenter, I want the platform to respond quickly during a live demonstration, so that the client experience is smooth and professional.

#### Acceptance Criteria

1. THE API SHALL respond to `GET /api/jobs` queries within 200 milliseconds for datasets up to 100 jobs.
2. THE Optimiser SHALL complete route optimisation within 500 milliseconds for job sets of up to 20 jobs.
3. THE DB SHALL operate with `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON` enabled at all times.
4. THE System SHALL use `useMemo` on job and GPS data in map components to prevent unnecessary re-renders.

---

### Requirement 18: Deployment

**User Story:** As a developer, I want the platform to deploy successfully to Railway, so that the client can access the demo via a public URL.

#### Acceptance Criteria

1. THE System SHALL build successfully using `next build` with no TypeScript or ESLint errors.
2. THE System SHALL store the SQLite database file at the project root as `waste_route.db` and SHALL NOT commit this file to version control.
3. THE System SHALL NOT require any paid external API keys or services to run.
4. THE System SHALL serve OpenStreetMap tiles directly from the OpenStreetMap CDN without proxying.
