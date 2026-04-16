import { getDb } from './db';

export function runSeed() {
  const db = getDb();

  const alreadyRan = db.prepare('SELECT id FROM seed_run WHERE id = 1').get();
  if (alreadyRan) return;

  // Wrap everything in a transaction — safe against concurrent calls
  const seedTransaction = db.transaction(() => {
    // Double-check inside transaction
    const check = db.prepare('SELECT id FROM seed_run WHERE id = 1').get();
    if (check) return;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const toAccountNumber = (name: string, seq: number) => {
    const root = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6).padEnd(6, 'X');
    return `${root}${String(seq).padStart(3, '0')}`;
  };

  // ── YARDS ──────────────────────────────────────────────────────────────────
  const insertYard = db.prepare(`INSERT INTO yards (name, address, lat, lng, service_radius_km, skip_stock) VALUES (?, ?, ?, ?, ?, ?)`);
  const yards = [
    { name: 'London North', address: 'Enfield, EN3 7FJ', lat: 51.668, lng: -0.031, radius: 12 },
    { name: 'London South', address: 'Croydon, CR0 4BD', lat: 51.374, lng: -0.098, radius: 12 },
    { name: 'London East',  address: 'Barking, IG11 8BL', lat: 51.534, lng: 0.077, radius: 12 },
  ];
  for (const y of yards) {
    insertYard.run(y.name, y.address, y.lat, y.lng, y.radius, JSON.stringify({}));
  }
  const [yard1, yard2, yard3] = [1, 2, 3];

  // ── VEHICLES ───────────────────────────────────────────────────────────────
  const insertVehicle = db.prepare(`INSERT INTO vehicles (yard_id, registration, type, capacity_tonnes, max_skips, status, telematics_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const vehicleData = [
    // Yard 1 – London North
    { y: yard1, reg: 'LN21 SKP', type: 'skip_lorry', cap: 10, maxs: 2, status: 'on_route', tel: 'TEL-001' },
    { y: yard1, reg: 'LN22 FLT', type: 'flatbed',    cap: 8,  maxs: 1, status: 'on_route', tel: 'TEL-002' },
    { y: yard1, reg: 'LN19 TIP', type: 'tipper',     cap: 12, maxs: 3, status: 'available', tel: 'TEL-003' },
    { y: yard1, reg: 'LN23 SKQ', type: 'skip_lorry', cap: 10, maxs: 2, status: 'maintenance', tel: 'TEL-004' },
    // Yard 2 – London South
    { y: yard2, reg: 'LS20 SKP', type: 'skip_lorry', cap: 10, maxs: 2, status: 'on_route', tel: 'TEL-005' },
    { y: yard2, reg: 'LS21 FLT', type: 'flatbed',    cap: 8,  maxs: 1, status: 'on_route', tel: 'TEL-006' },
    { y: yard2, reg: 'LS22 TIP', type: 'tipper',     cap: 14, maxs: 3, status: 'available', tel: 'TEL-007' },
    { y: yard2, reg: 'LS23 SKQ', type: 'skip_lorry', cap: 10, maxs: 2, status: 'available', tel: 'TEL-008' },
    // Yard 3 – London East
    { y: yard3, reg: 'LE21 SKP', type: 'skip_lorry', cap: 10, maxs: 2, status: 'on_route', tel: 'TEL-009' },
    { y: yard3, reg: 'LE22 FLT', type: 'flatbed',    cap: 8,  maxs: 1, status: 'on_route', tel: 'TEL-010' },
    { y: yard3, reg: 'LE19 TIP', type: 'tipper',     cap: 12, maxs: 3, status: 'available', tel: 'TEL-011' },
    { y: yard3, reg: 'LE23 SKQ', type: 'skip_lorry', cap: 10, maxs: 2, status: 'available', tel: 'TEL-012' },
  ];
  for (const v of vehicleData) insertVehicle.run(v.y, v.reg, v.type, v.cap, v.maxs, v.status, v.tel);

  // ── DRIVERS ───────────────────────────────────────────────────────────────
  const insertDriver = db.prepare(`INSERT INTO drivers (yard_id, name, phone, licence_class, shift_start, shift_end, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const driverData = [
    // Yard 1
    { y: yard1, name: 'James Fletcher',   ph: '07700 900001', lic: 'Cat C', ss: '06:00', se: '16:00', st: 'on_shift' },
    { y: yard1, name: 'Daniel Hartley',   ph: '07700 900002', lic: 'Cat C', ss: '08:00', se: '18:00', st: 'on_shift' },
    { y: yard1, name: 'Robert Simmons',   ph: '07700 900003', lic: 'Cat C+E', ss: '06:00', se: '16:00', st: 'on_shift' },
    { y: yard1, name: 'Michael Turner',   ph: '07700 900004', lic: 'Cat C', ss: '08:00', se: '18:00', st: 'off_duty' },
    { y: yard1, name: 'Stephen Ward',     ph: '07700 900005', lic: 'Cat C', ss: '06:00', se: '16:00', st: 'available' },
    // Yard 2
    { y: yard2, name: 'Gary Ashworth',    ph: '07700 900006', lic: 'Cat C', ss: '06:00', se: '16:00', st: 'on_shift' },
    { y: yard2, name: 'Kevin Marsh',      ph: '07700 900007', lic: 'Cat C+E', ss: '08:00', se: '18:00', st: 'on_shift' },
    { y: yard2, name: 'Paul Griffiths',   ph: '07700 900008', lic: 'Cat C', ss: '06:00', se: '16:00', st: 'on_shift' },
    { y: yard2, name: 'Wayne Donnelly',   ph: '07700 900009', lic: 'Cat C', ss: '08:00', se: '18:00', st: 'off_duty' },
    { y: yard2, name: 'Tony Blackwood',   ph: '07700 900010', lic: 'Cat C', ss: '06:00', se: '16:00', st: 'available' },
    // Yard 3
    { y: yard3, name: 'Lee Chandler',     ph: '07700 900011', lic: 'Cat C', ss: '06:00', se: '16:00', st: 'on_shift' },
    { y: yard3, name: 'Craig Neville',    ph: '07700 900012', lic: 'Cat C+E', ss: '08:00', se: '18:00', st: 'on_shift' },
    { y: yard3, name: 'Andrew Pearson',   ph: '07700 900013', lic: 'Cat C', ss: '06:00', se: '16:00', st: 'on_shift' },
    { y: yard3, name: 'Mark Stanton',     ph: '07700 900014', lic: 'Cat C', ss: '08:00', se: '18:00', st: 'off_duty' },
    { y: yard3, name: 'Sean Burke',       ph: '07700 900015', lic: 'Cat C', ss: '06:00', se: '16:00', st: 'available' },
  ];
  for (const d of driverData) insertDriver.run(d.y, d.name, d.ph, d.lic, d.ss, d.se, d.st);

  // ── SKIPS ─────────────────────────────────────────────────────────────────
  const insertSkip = db.prepare(`INSERT INTO skips (yard_id, size_yards, quantity_available, quantity_on_hire) VALUES (?, ?, ?, ?)`);
  const skipSizes = [2, 4, 6, 8, 10, 12, 14, 16];
  for (const yardId of [yard1, yard2, yard3]) {
    for (const size of skipSizes) {
      const avail = Math.floor(Math.random() * 8) + 2;
      const onHire = Math.floor(Math.random() * 10) + 3;
      insertSkip.run(yardId, size, avail, onHire);
    }
  }
  // Force a low stock scenario at London East for 4-yard
  db.prepare(`UPDATE skips SET quantity_available = 2 WHERE yard_id = 3 AND size_yards = 4`).run();

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────
  const insertCustomer = db.prepare(`INSERT INTO customers (name, email, phone, address, lat, lng, account_type) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const customerData = [
    { name: 'Harrington Building Services', email: 'ops@harrington.co.uk', ph: '020 8123 4001', addr: '14 Victoria Road, Edmonton, N9 0QL', lat: 51.617, lng: -0.068, type: 'commercial' },
    { name: 'Sarah Mitchell',               email: 'sarah.m@gmail.com',     ph: '07811 223344', addr: '7 Elm Close, Walthamstow, E17 3QP', lat: 51.588, lng: -0.020, type: 'residential' },
    { name: 'Apex Demolition Ltd',          email: 'admin@apexdemo.co.uk',  ph: '020 8456 7890', addr: '23 Station Road, Tottenham, N15 4RJ', lat: 51.598, lng: -0.072, type: 'commercial' },
    { name: 'Chris Pemberton',              email: 'cp@hotmail.com',         ph: '07922 112233', addr: '55 Oak Avenue, Islington, N1 2BW', lat: 51.537, lng: -0.106, type: 'residential' },
    { name: 'Green Valley Landscaping',     email: 'info@greenvalley.co.uk', ph: '020 8765 4321', addr: '8 Park Lane, Hackney, E8 3PL', lat: 51.543, lng: -0.058, type: 'commercial' },
    { name: 'Thomas Whitfield',             email: 'tw@outlook.com',         ph: '07733 998877', addr: '32 Church Street, Stoke Newington, N16 0LH', lat: 51.563, lng: -0.073, type: 'residential' },
    { name: 'Meridian Construction',        email: 'projects@meridian.co.uk', ph: '020 7890 1234', addr: '91 High Road, Ilford, IG1 1DW', lat: 51.558, lng: 0.068, type: 'commercial' },
    { name: 'Emma Thornton',                email: 'emma.t@icloud.com',      ph: '07855 334455', addr: '4 Rose Garden, Barking, IG11 9JL', lat: 51.538, lng: 0.081, type: 'residential' },
    { name: 'Precision Roofing Co',         email: 'office@precisionroofs.co.uk', ph: '020 8234 5678', addr: '17 Trade Park, Dagenham, RM10 8XE', lat: 51.531, lng: 0.147, type: 'commercial' },
    { name: 'David Holloway',               email: 'dh1972@gmail.com',       ph: '07966 556677', addr: '62 Manor Road, Stratford, E15 3BE', lat: 51.541, lng: -0.006, type: 'residential' },
    { name: 'Atlas Skip Hire (Client)',      email: 'atlas@atlassubs.co.uk',  ph: '020 8901 2345', addr: '3 Industrial Estate, Croydon, CR0 2AA', lat: 51.376, lng: -0.104, type: 'commercial' },
    { name: 'Rachel Oduya',                 email: 'roduya@yahoo.co.uk',     ph: '07744 667788', addr: '28 Hillside Ave, Norwood, SE27 0PQ', lat: 51.423, lng: -0.107, type: 'residential' },
    { name: 'Thorngate Developments',       email: 'contact@thorngate.co.uk', ph: '020 8345 6789', addr: '46 Commerce Way, Mitcham, CR4 3WD', lat: 51.401, lng: -0.167, type: 'commercial' },
    { name: 'Philip Jennings',              email: 'pj@btinternet.com',      ph: '07833 778899', addr: '19 Sycamore Drive, Sutton, SM1 3EQ', lat: 51.365, lng: -0.193, type: 'residential' },
    { name: 'Southside Waste Management',   email: 'ops@southside.co.uk',    ph: '020 8456 7891', addr: '77 Purley Way, Croydon, CR0 3JN', lat: 51.357, lng: -0.114, type: 'commercial' },
    { name: 'Jessica Palmer',              email: 'jpalmer@gmail.com',       ph: '07922 889900', addr: '6 Beech Close, Bromley, BR2 0PN', lat: 51.406, lng: 0.021, type: 'residential' },
    { name: 'Prime Build Solutions',        email: 'admin@primebuild.co.uk', ph: '020 8678 9012', addr: '33 Construction Way, Eltham, SE9 2RQ', lat: 51.451, lng: 0.052, type: 'commercial' },
    { name: 'Nathan Bradley',               email: 'nbradley@live.co.uk',    ph: '07700 112345', addr: '21 Maple Street, Woolwich, SE18 4JS', lat: 51.490, lng: 0.067, type: 'residential' },
    { name: 'Clearview Windows Ltd',        email: 'info@clearview.co.uk',   ph: '020 8789 0123', addr: '55 Factory Road, Abbey Wood, SE2 9RD', lat: 51.493, lng: 0.115, type: 'commercial' },
    { name: 'Olivia Baxter',               email: 'ob@protonmail.com',       ph: '07811 667788', addr: '9 Lavender Road, Plumstead, SE18 1DS', lat: 51.488, lng: 0.083, type: 'residential' },
    { name: 'Northgate Builders',           email: 'builds@northgate.co.uk', ph: '020 8901 3456', addr: '14 Works Road, Wood Green, N22 5HT', lat: 51.596, lng: -0.109, type: 'commercial' },
    { name: 'Alex Morrison',                email: 'amorrison@gmail.com',    ph: '07933 445566', addr: '37 Poplar Way, Palmers Green, N13 4QD', lat: 51.621, lng: -0.111, type: 'residential' },
    { name: 'Capital Refurb Group',         email: 'ops@capitalrefurb.co.uk', ph: '020 7012 3456', addr: '88 Trade Centre, Wembley, HA0 1WR', lat: 51.555, lng: -0.302, type: 'commercial' },
    { name: 'Claire Fitzpatrick',           email: 'cfitz@outlook.com',      ph: '07855 990011', addr: '5 Birch Lane, Enfield, EN2 6LP', lat: 51.659, lng: -0.086, type: 'residential' },
    { name: 'Dynamic Groundworks Ltd',      email: 'info@dynamicgw.co.uk',   ph: '020 8123 7654', addr: '29 Quarry Road, Chingford, E4 8QR', lat: 51.624, lng: -0.002, type: 'commercial' },
    { name: 'Mark Sinclair',                email: 'ms@hotmail.co.uk',       ph: '07700 334455', addr: '11 Chestnut Ave, Forest Hill, SE23 2PB', lat: 51.436, lng: -0.050, type: 'residential' },
    { name: 'Regent Waste Services',        email: 'ops@regentwaste.co.uk',  ph: '020 8567 8901', addr: '42 Industrial Pk, Peckham, SE15 3NW', lat: 51.474, lng: -0.069, type: 'commercial' },
    { name: 'Fiona Gallagher',              email: 'fgallagher@gmail.com',   ph: '07944 556677', addr: '8 Oakwood Drive, Lewisham, SE13 6RH', lat: 51.462, lng: -0.015, type: 'residential' },
    { name: 'Unity Construction',           email: 'admin@unity.co.uk',      ph: '020 8890 1234', addr: '64 East Ham High St, E6 2JB', lat: 51.533, lng: 0.052, type: 'commercial' },
    { name: 'James Okonkwo',                email: 'jokonkwo@yahoo.com',     ph: '07933 667788', addr: '15 Cedar Rd, Bow, E3 2PP', lat: 51.527, lng: -0.023, type: 'residential' },
  ];
  for (const c of customerData) insertCustomer.run(c.name, c.email, c.ph, c.addr, c.lat, c.lng, c.type);

  // ── EWC CODES ─────────────────────────────────────────────────────────────
  const insertEwc = db.prepare(`INSERT INTO ewc_codes (code, description, hazardous, is_active) VALUES (?, ?, ?, ?)`);
  const ewcCodes = [
    ['17 09 04', 'Mixed construction and demolition wastes', 0],
    ['20 03 01', 'Mixed municipal waste', 0],
    ['20 02 01', 'Biodegradable waste', 0],
    ['17 01 07', 'Mixtures of concrete, bricks, tiles and ceramics', 0],
    ['20 03 07', 'Bulky waste', 0],
    ['17 02 01', 'Wood', 0],
    ['17 02 02', 'Glass', 0],
    ['17 02 03', 'Plastic', 0],
    ['17 04 05', 'Iron and steel', 0],
    ['20 01 36', 'Discarded electrical and electronic equipment', 0],
    ['20 01 27*', 'Paint, inks, adhesives and resins', 1],
    ['15 01 10*', 'Packaging containing hazardous substances', 1],
    ['17 05 03*', 'Soil and stones containing hazardous substances', 1],
    ['20 01 21*', 'Fluorescent tubes and other mercury-containing waste', 1],
    ['16 01 07*', 'Oil filters', 1],
  ] as const;
  for (const [code, description, hazardous] of ewcCodes) {
    insertEwc.run(code, description, hazardous, 1);
  }

  // ── SERVICES ──────────────────────────────────────────────────────────────
  const insertService = db.prepare(`
    INSERT INTO services (name, container_type, skip_size_yards, default_price_gbp, default_ewc_code_id, vat_rate, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const services = [
    ['2 Yard Mini Skip', 'skip', 2, 90],
    ['4 Yard Mini Skip', 'skip', 4, 120],
    ['6 Yard Midi Skip', 'skip', 6, 150],
    ["8 Yard Builder's Skip", 'skip', 8, 180],
    ['10 Yard Skip', 'skip', 10, 210],
    ['12 Yard Skip', 'skip', 12, 240],
    ['14 Yard Large Skip', 'skip', 14, 270],
    ['16 Yard Large Skip', 'skip', 16, 300],
    ['20 Yard RoRo', 'roro', 20, 380],
    ['30 Yard RoRo', 'roro', 30, 450],
    ['40 Yard RoRo', 'roro', 40, 520],
    ['Wait & Load', 'tipper', null, 350],
  ] as const;
  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const defaultEwcId = (i % ewcCodes.length) + 1;
    insertService.run(s[0], s[1], s[2], s[3], defaultEwcId, 20, 1);
  }

  // ── CUSTOMER FLAGS & ACCOUNT SETTINGS ────────────────────────────────────
  const allCustomers = db.prepare('SELECT id, name, email, phone, address FROM customers ORDER BY id ASC').all() as Array<any>;
  const onStopIds = new Set([3, 15]);
  const poMandatoryIds = new Set([1, 3, 5, 7, 9]);
  for (let i = 0; i < allCustomers.length; i++) {
    const customer = allCustomers[i];
    const customerType = i < 10 ? 'cash' : 'account';
    const addressParts = String(customer.address).split(',').map((v: string) => v.trim());
    const postcode = addressParts[addressParts.length - 1] || '';
    const town = addressParts.length > 1 ? addressParts[addressParts.length - 2] : '';
    const addressLine1 = addressParts[0] || customer.address;
    const addressLine2 = addressParts.slice(1, Math.max(1, addressParts.length - 2)).join(', ');

    db.prepare(`
      UPDATE customers
      SET customer_type = ?,
          on_stop = ?,
          do_not_invoice = ?,
          po_mandatory = ?,
          weigh_all_skip_jobs = ?,
          payment_terms_days = ?,
          credit_limit_gbp = ?,
          batch_option = ?,
          invoice_method = ?,
          invoice_email = ?,
          account_number = ?,
          phone_main = ?,
          phone_mobile = ?,
          contact_email = ?,
          address_line1 = ?,
          address_line2 = ?,
          town = ?,
          county = ?,
          postcode = ?,
          payment_method = ?,
          notes = ?
      WHERE id = ?
    `).run(
      customerType,
      onStopIds.has(customer.id) ? 1 : 0,
      customerType === 'cash' && i % 3 === 0 ? 1 : 0,
      poMandatoryIds.has(customer.id) ? 1 : 0,
      i % 6 === 0 ? 1 : 0,
      customerType === 'cash' ? 0 : 30,
      customerType === 'cash' ? 0 : 5000 + (i * 500),
      customerType === 'cash' ? 'cash' : (i % 4 === 0 ? 'account_and_cash' : 'account'),
      i % 5 === 0 ? 'both' : 'email',
      customer.email,
      toAccountNumber(customer.name, i + 1),
      customer.phone,
      customer.phone,
      customer.email,
      addressLine1,
      addressLine2,
      town,
      'Greater London',
      postcode,
      customerType === 'cash' ? 'cash' : 'bacs',
      i % 7 === 0 ? 'Key commercial account' : null,
      customer.id
    );
  }

  // ── AGREEMENTS (2 PER CUSTOMER MIN) ──────────────────────────────────────
  const insertAgreement = db.prepare(`
    INSERT INTO agreements (
      customer_id, yard_id, site_name, site_address, site_lat, site_lng, service_id,
      default_ewc_code_id, standard_price_gbp, is_permanent_site, skip_currently_on_site,
      skip_delivered_date, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const customerRows = db.prepare('SELECT id, name, address, lat, lng FROM customers ORDER BY id').all() as Array<any>;
  for (const customer of customerRows) {
    const serviceA = ((customer.id - 1) % 11) + 1;
    const serviceB = ((customer.id + 3) % 11) + 1;
    const ewcA = ((customer.id - 1) % 15) + 1;
    const ewcB = ((customer.id + 2) % 15) + 1;
    const yardId = ((customer.id - 1) % 3) + 1;

    insertAgreement.run(
      customer.id,
      yardId,
      'Main Site',
      customer.address,
      customer.lat,
      customer.lng,
      serviceA,
      ewcA,
      [90,120,150,180,210,240,270,300,380,450,520][serviceA - 1],
      customer.id % 8 === 0 ? 1 : 0,
      0,
      null,
      'Primary serviced location',
      'active'
    );

    insertAgreement.run(
      customer.id,
      yardId,
      'Secondary Site',
      `${customer.address} (Rear Yard)`,
      Number(customer.lat) + 0.004,
      Number(customer.lng) + 0.004,
      serviceB,
      ewcB,
      [90,120,150,180,210,240,270,300,380,450,520][serviceB - 1],
      0,
      0,
      null,
      'Secondary project location',
      'active'
    );
  }

  // ── BOOKINGS ──────────────────────────────────────────────────────────────
  const insertBooking = db.prepare(`INSERT INTO bookings (customer_id, yard_id, booking_date, job_type, skip_size, preferred_time_slot, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const bookingData = [
    { cid: 1, yid: yard1, date: today, type: 'delivery',     size: 8,  slot: '08:00-10:00', status: 'scheduled',  notes: 'Side access only' },
    { cid: 2, yid: yard1, date: today, type: 'collection',   size: 6,  slot: '10:00-12:00', status: 'confirmed',  notes: '' },
    { cid: 3, yid: yard1, date: today, type: 'exchange',     size: 10, slot: '08:00-10:00', status: 'scheduled',  notes: 'Replace full skip' },
    { cid: 5, yid: yard1, date: today, type: 'delivery',     size: 4,  slot: '14:00-16:00', status: 'confirmed',  notes: 'Commercial site' },
    { cid: 6, yid: yard1, date: today, type: 'wait_and_load',size: 6,  slot: '10:00-12:00', status: 'pending',    notes: '' },
    { cid: 11, yid: yard2, date: today, type: 'delivery',    size: 8,  slot: '08:00-10:00', status: 'scheduled',  notes: '' },
    { cid: 12, yid: yard2, date: today, type: 'collection',  size: 6,  slot: '12:00-14:00', status: 'confirmed',  notes: '' },
    { cid: 13, yid: yard2, date: today, type: 'exchange',    size: 12, slot: '08:00-10:00', status: 'scheduled',  notes: 'Heavy materials' },
    { cid: 14, yid: yard2, date: today, type: 'delivery',    size: 4,  slot: '10:00-12:00', status: 'pending',    notes: '' },
    { cid: 15, yid: yard2, date: today, type: 'collection',  size: 8,  slot: '14:00-16:00', status: 'confirmed',  notes: '' },
    { cid: 21, yid: yard3, date: today, type: 'delivery',    size: 6,  slot: '08:00-10:00', status: 'scheduled',  notes: '' },
    { cid: 22, yid: yard3, date: today, type: 'collection',  size: 4,  slot: '10:00-12:00', status: 'confirmed',  notes: '' },
    { cid: 23, yid: yard3, date: today, type: 'exchange',    size: 8,  slot: '12:00-14:00', status: 'pending',    notes: '' },
    { cid: 25, yid: yard3, date: today, type: 'delivery',    size: 10, slot: '08:00-10:00', status: 'confirmed',  notes: '' },
    { cid: 26, yid: yard3, date: today, type: 'collection',  size: 6,  slot: '14:00-16:00', status: 'pending',    notes: '' },
    { cid: 4, yid: yard1, date: yesterday, type: 'delivery', size: 6,  slot: '08:00-10:00', status: 'completed',  notes: '' },
    { cid: 7, yid: yard1, date: yesterday, type: 'collection',size: 8, slot: '10:00-12:00', status: 'completed',  notes: '' },
    { cid: 16, yid: yard2, date: yesterday, type: 'delivery', size: 4, slot: '08:00-10:00', status: 'completed',  notes: '' },
    { cid: 28, yid: yard3, date: yesterday, type: 'exchange', size: 6, slot: '10:00-12:00', status: 'completed',  notes: '' },
    { cid: 29, yid: yard3, date: yesterday, type: 'delivery', size: 8, slot: '14:00-16:00', status: 'cancelled',  notes: 'Customer cancelled' },
  ];
  for (const b of bookingData) insertBooking.run(b.cid, b.yid, b.date, b.type, b.size, b.slot, b.status, b.notes);

  // ── JOBS ──────────────────────────────────────────────────────────────────
  const insertJob = db.prepare(`INSERT INTO jobs (booking_id, yard_id, driver_id, vehicle_id, type, status, customer_name, customer_phone, address, lat, lng, skip_size, notes, scheduled_date, scheduled_time, sequence_order, route_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const jobsData = [
    // ---- YARD 1 - London North ----
    // in_progress (driver 1, vehicle 1, route 1)
    { bid: null, yid: yard1, did: 1, vid: 1, type: 'delivery',    status: 'in_progress', cn: 'Harrington Building Services', cp: '020 8123 4001', addr: '14 Victoria Road, Edmonton, N9 0QL',       lat: 51.617, lng: -0.068, size: 8,  notes: 'Side access', time: '08:00', seq: 1, rid: 1 },
    { bid: null, yid: yard1, did: 1, vid: 1, type: 'collection',  status: 'in_progress', cn: 'Thomas Whitfield',             cp: '07733 998877', addr: '32 Church Street, Stoke Newington, N16 0LH', lat: 51.563, lng: -0.073, size: 6,  notes: '', time: '09:00', seq: 2, rid: 1 },
    { bid: null, yid: yard1, did: 1, vid: 1, type: 'exchange',    status: 'assigned',    cn: 'Green Valley Landscaping',     cp: '020 8765 4321', addr: '8 Park Lane, Hackney, E8 3PL',              lat: 51.543, lng: -0.058, size: 10, notes: 'Heavy', time: '10:30', seq: 3, rid: 1 },
    { bid: null, yid: yard1, did: 1, vid: 1, type: 'delivery',    status: 'assigned',    cn: 'Chris Pemberton',              cp: '07922 112233', addr: '55 Oak Avenue, Islington, N1 2BW',            lat: 51.537, lng: -0.106, size: 4,  notes: '', time: '11:30', seq: 4, rid: 1 },
    { bid: null, yid: yard1, did: 1, vid: 1, type: 'collection',  status: 'assigned',    cn: 'Dynamic Groundworks Ltd',      cp: '020 8123 7654', addr: '29 Quarry Road, Chingford, E4 8QR',          lat: 51.624, lng: -0.002, size: 6,  notes: '', time: '12:30', seq: 5, rid: 1 },
    // driver 2, vehicle 2, route 1
    { bid: null, yid: yard1, did: 2, vid: 2, type: 'delivery',    status: 'in_progress', cn: 'Northgate Builders',           cp: '020 8901 3456', addr: '14 Works Road, Wood Green, N22 5HT',         lat: 51.596, lng: -0.109, size: 6,  notes: '', time: '08:00', seq: 1, rid: 1 },
    { bid: null, yid: yard1, did: 2, vid: 2, type: 'exchange',    status: 'assigned',    cn: 'Apex Demolition Ltd',          cp: '020 8456 7890', addr: '23 Station Road, Tottenham, N15 4RJ',        lat: 51.598, lng: -0.072, size: 10, notes: '', time: '09:30', seq: 2, rid: 1 },
    { bid: null, yid: yard1, did: 2, vid: 2, type: 'delivery',    status: 'assigned',    cn: 'Sarah Mitchell',               cp: '07811 223344', addr: '7 Elm Close, Walthamstow, E17 3QP',           lat: 51.588, lng: -0.020, size: 6,  notes: '', time: '11:00', seq: 3, rid: 1 },
    { bid: null, yid: yard1, did: 2, vid: 2, type: 'collection',  status: 'assigned',    cn: 'Alex Morrison',                cp: '07933 445566', addr: '37 Poplar Way, Palmers Green, N13 4QD',       lat: 51.621, lng: -0.111, size: 4,  notes: '', time: '12:30', seq: 4, rid: 1 },
    { bid: null, yid: yard1, did: 2, vid: 2, type: 'delivery',    status: 'assigned',    cn: 'Claire Fitzpatrick',           cp: '07855 990011', addr: '5 Birch Lane, Enfield, EN2 6LP',              lat: 51.659, lng: -0.086, size: 8,  notes: '', time: '14:00', seq: 5, rid: 1 },
    // pending (unassigned) for yard 1
    { bid: null, yid: yard1, did: null, vid: null, type: 'delivery',   status: 'pending', cn: 'James Okonkwo',   cp: '07933 667788', addr: '15 Cedar Rd, Bow, E3 2PP',                  lat: 51.527, lng: -0.023, size: 6,  notes: '', time: '09:00', seq: 0, rid: null },
    { bid: null, yid: yard1, did: null, vid: null, type: 'collection', status: 'pending', cn: 'Mark Sinclair',   cp: '07700 334455', addr: '11 Chestnut Ave, Forest Hill, SE23 2PB',      lat: 51.436, lng: -0.050, size: 8,  notes: '', time: '10:00', seq: 0, rid: null },
    { bid: null, yid: yard1, did: null, vid: null, type: 'exchange',   status: 'pending', cn: 'Fiona Gallagher', cp: '07944 556677', addr: '8 Oakwood Drive, Lewisham, SE13 6RH',          lat: 51.462, lng: -0.015, size: 4,  notes: '', time: '11:00', seq: 0, rid: null },
    { bid: null, yid: yard1, did: null, vid: null, type: 'delivery',   status: 'pending', cn: 'David Holloway',  cp: '07966 556677', addr: '62 Manor Road, Stratford, E15 3BE',            lat: 51.541, lng: -0.006, size: 6,  notes: '', time: '13:00', seq: 0, rid: null },
    { bid: null, yid: yard1, did: null, vid: null, type: 'collection', status: 'pending', cn: 'Nathan Bradley',  cp: '07700 112345', addr: '21 Maple Street, Woolwich, SE18 4JS',           lat: 51.490, lng: 0.067,  size: 4,  notes: '', time: '14:00', seq: 0, rid: null },
    // completed for yard 1
    { bid: null, yid: yard1, did: 3, vid: 3, type: 'delivery',   status: 'completed', cn: 'Philip Jennings',    cp: '07833 778899', addr: '19 Sycamore Drive, Sutton, SM1 3EQ',              lat: 51.365, lng: -0.193, size: 6,  notes: '', time: '07:30', seq: 1, rid: null },
    { bid: null, yid: yard1, did: 3, vid: 3, type: 'collection', status: 'completed', cn: 'Emma Thornton',      cp: '07855 334455', addr: '4 Rose Garden, Barking, IG11 9JL',               lat: 51.538, lng: 0.081,  size: 4,  notes: '', time: '08:30', seq: 2, rid: null },

    // ---- YARD 2 - London South ----
    { bid: null, yid: yard2, did: 6, vid: 5, type: 'delivery',   status: 'in_progress', cn: 'Atlas Skip Hire (Client)', cp: '020 8901 2345', addr: '3 Industrial Estate, Croydon, CR0 2AA',   lat: 51.376, lng: -0.104, size: 8,  notes: '', time: '08:00', seq: 1, rid: 2 },
    { bid: null, yid: yard2, did: 6, vid: 5, type: 'exchange',   status: 'assigned',    cn: 'Thorngate Developments',  cp: '020 8345 6789', addr: '46 Commerce Way, Mitcham, CR4 3WD',       lat: 51.401, lng: -0.167, size: 12, notes: '', time: '09:30', seq: 2, rid: 2 },
    { bid: null, yid: yard2, did: 6, vid: 5, type: 'collection', status: 'assigned',    cn: 'Rachel Oduya',            cp: '07744 667788', addr: '28 Hillside Ave, Norwood, SE27 0PQ',        lat: 51.423, lng: -0.107, size: 6,  notes: '', time: '11:00', seq: 3, rid: 2 },
    { bid: null, yid: yard2, did: 6, vid: 5, type: 'delivery',   status: 'assigned',    cn: 'Southside Waste Management', cp: '020 8456 7891', addr: '77 Purley Way, Croydon, CR0 3JN',    lat: 51.357, lng: -0.114, size: 8,  notes: '', time: '12:30', seq: 4, rid: 2 },
    { bid: null, yid: yard2, did: 7, vid: 6, type: 'collection', status: 'in_progress', cn: 'Clearview Windows Ltd',   cp: '020 8789 0123', addr: '55 Factory Road, Abbey Wood, SE2 9RD',   lat: 51.493, lng: 0.115,  size: 6,  notes: '', time: '08:00', seq: 1, rid: 2 },
    { bid: null, yid: yard2, did: 7, vid: 6, type: 'delivery',   status: 'assigned',    cn: 'Prime Build Solutions',   cp: '020 8678 9012', addr: '33 Construction Way, Eltham, SE9 2RQ',   lat: 51.451, lng: 0.052,  size: 10, notes: '', time: '09:30', seq: 2, rid: 2 },
    { bid: null, yid: yard2, did: 7, vid: 6, type: 'collection', status: 'assigned',    cn: 'Jessica Palmer',          cp: '07922 889900', addr: '6 Beech Close, Bromley, BR2 0PN',          lat: 51.406, lng: 0.021,  size: 6,  notes: '', time: '11:00', seq: 3, rid: 2 },
    { bid: null, yid: yard2, did: null, vid: null, type: 'delivery',   status: 'pending', cn: 'Olivia Baxter',  cp: '07811 667788', addr: '9 Lavender Road, Plumstead, SE18 1DS',             lat: 51.488, lng: 0.083,  size: 4,  notes: '', time: '10:00', seq: 0, rid: null },
    { bid: null, yid: yard2, did: null, vid: null, type: 'collection', status: 'pending', cn: 'Fiona Gallagher', cp: '07944 556677', addr: '8 Oakwood Drive, Lewisham, SE13 6RH',              lat: 51.462, lng: -0.015, size: 8,  notes: '', time: '11:00', seq: 0, rid: null },
    { bid: null, yid: yard2, did: null, vid: null, type: 'exchange',   status: 'pending', cn: 'Mark Sinclair',   cp: '07700 334455', addr: '11 Chestnut Ave, Forest Hill, SE23 2PB',            lat: 51.436, lng: -0.050, size: 6,  notes: '', time: '13:00', seq: 0, rid: null },
    { bid: null, yid: yard2, did: 8, vid: 7, type: 'delivery', status: 'completed', cn: 'James Okonkwo',  cp: '07933 667788', addr: '15 Cedar Rd, Bow, E3 2PP',                             lat: 51.527, lng: -0.023, size: 4,  notes: '', time: '07:30', seq: 1, rid: null },

    // ---- YARD 3 - London East ----
    { bid: null, yid: yard3, did: 11, vid: 9,  type: 'delivery',    status: 'in_progress', cn: 'Meridian Construction',   cp: '020 7890 1234', addr: '91 High Road, Ilford, IG1 1DW',      lat: 51.558, lng: 0.068,  size: 6,  notes: '', time: '08:00', seq: 1, rid: 3 },
    { bid: null, yid: yard3, did: 11, vid: 9,  type: 'exchange',    status: 'assigned',    cn: 'Unity Construction',      cp: '020 8890 1234', addr: '64 East Ham High St, E6 2JB',        lat: 51.533, lng: 0.052,  size: 8,  notes: '', time: '09:30', seq: 2, rid: 3 },
    { bid: null, yid: yard3, did: 11, vid: 9,  type: 'collection',  status: 'assigned',    cn: 'Precision Roofing Co',    cp: '020 8234 5678', addr: '17 Trade Park, Dagenham, RM10 8XE',  lat: 51.531, lng: 0.147,  size: 10, notes: '', time: '11:00', seq: 3, rid: 3 },
    { bid: null, yid: yard3, did: 12, vid: 10, type: 'delivery',    status: 'in_progress', cn: 'Regent Waste Services',   cp: '020 8567 8901', addr: '42 Industrial Pk, Peckham, SE15 3NW', lat: 51.474, lng: -0.069, size: 6,  notes: '', time: '08:00', seq: 1, rid: 3 },
    { bid: null, yid: yard3, did: 12, vid: 10, type: 'collection',  status: 'assigned',    cn: 'Olivia Baxter',           cp: '07811 667788', addr: '9 Lavender Road, Plumstead, SE18 1DS',lat: 51.488, lng: 0.083,  size: 4,  notes: '', time: '09:30', seq: 2, rid: 3 },
    { bid: null, yid: yard3, did: 12, vid: 10, type: 'exchange',    status: 'assigned',    cn: 'Nathan Bradley',          cp: '07700 112345', addr: '21 Maple Street, Woolwich, SE18 4JS',  lat: 51.490, lng: 0.067,  size: 6,  notes: '', time: '11:00', seq: 3, rid: 3 },
    { bid: null, yid: yard3, did: null, vid: null, type: 'delivery',   status: 'pending', cn: 'Clearview Windows Ltd', cp: '020 8789 0123', addr: '55 Factory Road, Abbey Wood, SE2 9RD',  lat: 51.493, lng: 0.115,  size: 8,  notes: '', time: '10:00', seq: 0, rid: null },
    { bid: null, yid: yard3, did: null, vid: null, type: 'collection', status: 'pending', cn: 'Emma Thornton',         cp: '07855 334455', addr: '4 Rose Garden, Barking, IG11 9JL',        lat: 51.538, lng: 0.081,  size: 6,  notes: '', time: '11:00', seq: 0, rid: null },
    { bid: null, yid: yard3, did: null, vid: null, type: 'exchange',   status: 'pending', cn: 'David Holloway',        cp: '07966 556677', addr: '62 Manor Road, Stratford, E15 3BE',        lat: 51.541, lng: -0.006, size: 4,  notes: '', time: '12:00', seq: 0, rid: null },
    { bid: null, yid: yard3, did: null, vid: null, type: 'delivery',   status: 'pending', cn: 'Mark Sinclair',         cp: '07700 334455', addr: '11 Chestnut Ave, Forest Hill, SE23 2PB',  lat: 51.436, lng: -0.050, size: 8,  notes: '', time: '13:00', seq: 0, rid: null },
    { bid: null, yid: yard3, did: null, vid: null, type: 'delivery',   status: 'pending', cn: 'Capital Refurb Group',  cp: '020 7012 3456', addr: '88 Trade Centre, Wembley, HA0 1WR',      lat: 51.555, lng: -0.302, size: 6,  notes: '', time: '14:00', seq: 0, rid: null },
    { bid: null, yid: yard3, did: 13, vid: 11, type: 'delivery', status: 'completed', cn: 'James Okonkwo', cp: '07933 667788', addr: '15 Cedar Rd, Bow, E3 2PP',                            lat: 51.527, lng: -0.023, size: 4,  notes: '', time: '07:00', seq: 1, rid: null },
    { bid: null, yid: yard3, did: 13, vid: 11, type: 'collection', status: 'completed', cn: 'Sarah Mitchell', cp: '07811 223344', addr: '7 Elm Close, Walthamstow, E17 3QP',               lat: 51.588, lng: -0.020, size: 6,  notes: '', time: '08:00', seq: 2, rid: null },
  ];
  for (const j of jobsData) {
    insertJob.run(j.bid, j.yid, j.did, j.vid, j.type, j.status, j.cn, j.cp, j.addr, j.lat, j.lng, j.size, j.notes, today, j.time, j.seq, j.rid);
  }

  // Link all jobs to agreements and enrich pricing/payment fields
  const jobs = db.prepare('SELECT id, customer_name, skip_size, type, status, address FROM jobs ORDER BY id').all() as Array<any>;
  const customerByName = new Map((db.prepare('SELECT id, name, customer_type FROM customers').all() as Array<any>).map((c) => [c.name, c]));
  const agreementForCustomerStmt = db.prepare('SELECT * FROM agreements WHERE customer_id = ? ORDER BY id');
  const serviceBySize = new Map((db.prepare('SELECT id, skip_size_yards, default_price_gbp, vat_rate, default_ewc_code_id FROM services').all() as Array<any>).map((s) => [s.skip_size_yards ?? -1, s]));

  for (const job of jobs) {
    const customer = customerByName.get(job.customer_name);
    if (!customer) continue;
    const agreements = agreementForCustomerStmt.all(customer.id) as Array<any>;
    if (!agreements.length) continue;

    const linkedAgreement = agreements[job.id % agreements.length];
    const service = serviceBySize.get(job.skip_size) || serviceBySize.get(-1);
    const price = Number(linkedAgreement.standard_price_gbp ?? service?.default_price_gbp ?? 0);
    const vatRate = Number(service?.vat_rate ?? 20);
    const vat = Number(((price * vatRate) / 100).toFixed(2));
    const total = Number((price + vat).toFixed(2));
    const paymentMethod = customer.customer_type === 'cash' ? 'cash' : 'account';
    const isPaid = customer.customer_type === 'cash' && job.status === 'completed' ? 1 : 0;

    db.prepare(`
      UPDATE jobs
      SET agreement_id = ?,
          service_id = ?,
          ewc_code_id = ?,
          price_gbp = ?,
          vat_rate = ?,
          vat_gbp = ?,
          total_gbp = ?,
          payment_method = ?,
          is_paid = ?,
          paid_date = ?,
          requested_by = ?,
          po_number = ?,
          weight_kg = ?,
          time_slot = ?
      WHERE id = ?
    `).run(
      linkedAgreement.id,
      linkedAgreement.service_id,
      linkedAgreement.default_ewc_code_id,
      price,
      vatRate,
      vat,
      total,
      paymentMethod,
      isPaid,
      isPaid ? today : null,
      'Site Supervisor',
      customer.id % 5 === 0 ? `PO-${customer.id}-${job.id}` : null,
      customer.id % 6 === 0 ? 1200 + (job.id * 10) : null,
      ['AM', 'PM', 'Anytime'][job.id % 3],
      job.id
    );
  }

  // Mark 20 agreements as currently on site across all yards
  const agreementsAll = db.prepare('SELECT id FROM agreements ORDER BY id').all() as Array<{ id: number }>;
  agreementsAll.slice(0, 20).forEach((agreement, idx) => {
    const deliveredDaysAgo = (idx % 40) + 1;
    const deliveredDate = new Date(Date.now() - deliveredDaysAgo * 86400000).toISOString().split('T')[0];
    db.prepare(`
      UPDATE agreements
      SET skip_currently_on_site = 1,
          skip_delivered_date = ?,
          is_permanent_site = CASE WHEN ? % 5 = 0 THEN 1 ELSE is_permanent_site END
      WHERE id = ?
    `).run(deliveredDate, idx, agreement.id);
  });

  // Update completed_at for completed jobs
  db.prepare(`UPDATE jobs SET completed_at = datetime('now', '-2 hours') WHERE status = 'completed'`).run();

  // ── ROUTES ────────────────────────────────────────────────────────────────
  const insertRoute = db.prepare(`INSERT INTO routes (yard_id, date, driver_id, vehicle_id, status, job_ids, total_distance_km, estimated_duration_mins, optimised_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  // Route 1 – London North (jobs 1-10)
  insertRoute.run(yard1, today, 1, 1, 'active', JSON.stringify([1,2,3,4,5,6,7,8,9,10]), 34.7, 185, new Date().toISOString());
  // Route 2 – London South (jobs 18-24)
  insertRoute.run(yard2, today, 6, 5, 'active', JSON.stringify([18,19,20,21,22,23,24]), 28.3, 155, new Date().toISOString());
  // Route 3 – London East (jobs 28-35)
  insertRoute.run(yard3, today, 11, 9, 'active', JSON.stringify([28,29,30,31,32,33]), 22.1, 125, new Date().toISOString());

  // ── GPS POSITIONS ─────────────────────────────────────────────────────────
  const insertGps = db.prepare(`INSERT INTO gps_positions (driver_id, vehicle_id, lat, lng, speed_kmh, heading, fuel_level, engine_status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const activeDrivers = [
    { did: 1, vid: 1, lat: 51.583, lng: -0.042, spd: 35, hdg: 180, fuel: 78 },
    { did: 2, vid: 2, lat: 51.601, lng: -0.095, spd: 28, hdg: 90,  fuel: 65 },
    { did: 6, vid: 5, lat: 51.389, lng: -0.112, spd: 42, hdg: 270, fuel: 82 },
    { did: 7, vid: 6, lat: 51.470, lng: 0.065,  spd: 31, hdg: 0,   fuel: 71 },
    { did: 11, vid: 9,  lat: 51.545, lng: 0.059,  spd: 38, hdg: 45,  fuel: 88 },
    { did: 12, vid: 10, lat: 51.481, lng: -0.031, spd: 25, hdg: 135, fuel: 60 },
  ];
  for (const g of activeDrivers) {
    insertGps.run(g.did, g.vid, g.lat, g.lng, g.spd, g.hdg, g.fuel, 'on', new Date().toISOString());
  }

  // ── INVOICES ──────────────────────────────────────────────────────────────
  const insertInvoice = db.prepare(`INSERT INTO invoices (customer_id, job_id, amount_gbp, vat_gbp, total_gbp, status, issued_date, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const invoiceData = [
    { cid: 1, jid: 1,  amt: 280, status: 'paid',     issued: '2026-03-15', due: '2026-04-15', notes: '' },
    { cid: 2, jid: 2,  amt: 195, status: 'paid',     issued: '2026-03-20', due: '2026-04-20', notes: '' },
    { cid: 3, jid: 3,  amt: 340, status: 'sent',     issued: '2026-04-01', due: '2026-04-30', notes: '' },
    { cid: 5, jid: 4,  amt: 160, status: 'sent',     issued: '2026-04-05', due: '2026-05-05', notes: '' },
    { cid: 6, jid: 5,  amt: 210, status: 'overdue',  issued: '2026-03-01', due: '2026-03-31', notes: 'Chased twice' },
    { cid: 11, jid: 18, amt: 280, status: 'paid',    issued: '2026-03-10', due: '2026-04-10', notes: '' },
    { cid: 12, jid: 19, amt: 195, status: 'overdue', issued: '2026-02-28', due: '2026-03-28', notes: '' },
    { cid: 13, jid: 20, amt: 420, status: 'sent',    issued: '2026-04-08', due: '2026-05-08', notes: 'Heavy materials surcharge' },
    { cid: 14, jid: 21, amt: 160, status: 'draft',   issued: '2026-04-14', due: '2026-05-14', notes: '' },
    { cid: 15, jid: 22, amt: 280, status: 'paid',    issued: '2026-03-25', due: '2026-04-25', notes: '' },
    { cid: 21, jid: 28, amt: 195, status: 'sent',    issued: '2026-04-02', due: '2026-05-02', notes: '' },
    { cid: 22, jid: 29, amt: 160, status: 'paid',    issued: '2026-03-28', due: '2026-04-28', notes: '' },
    { cid: 23, jid: 30, amt: 280, status: 'overdue', issued: '2026-03-05', due: '2026-04-05', notes: 'Disputed' },
    { cid: 25, jid: 31, amt: 350, status: 'sent',    issued: '2026-04-10', due: '2026-05-10', notes: '' },
    { cid: 26, jid: 32, amt: 195, status: 'draft',   issued: '2026-04-15', due: '2026-05-15', notes: '' },
  ];
  for (const inv of invoiceData) {
    const vat = Math.round(inv.amt * 0.2 * 100) / 100;
    const total = inv.amt + vat;
    insertInvoice.run(inv.cid, inv.jid, inv.amt, vat, total, inv.status, inv.issued, inv.due, inv.notes);
  }

  // Auto-wire existing invoices to jobs for compatibility with batch logic
  db.prepare(`
    UPDATE jobs
    SET invoice_id = (
      SELECT i.id FROM invoices i WHERE i.job_id = jobs.id LIMIT 1
    ),
    invoiced = CASE WHEN EXISTS (SELECT 1 FROM invoices i WHERE i.job_id = jobs.id) THEN 1 ELSE 0 END
  `).run();

  // ── PERMITS ───────────────────────────────────────────────────────────────
  const permitStatuses = ['applied', 'approved', 'rejected', 'expired', 'not_required', 'applied', 'approved', 'applied'];
  const permitJobs = db.prepare('SELECT id, agreement_id, address FROM jobs ORDER BY id LIMIT 8').all() as Array<any>;
  const insertPermit = db.prepare(`
    INSERT INTO permits (
      job_id, customer_id, site_address, local_authority, permit_type,
      application_date, start_date, end_date, status, permit_reference, notes
    ) VALUES (?, ?, ?, ?, 'skip_on_highway', ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < permitJobs.length; i++) {
    const job = permitJobs[i];
    const agreement = db.prepare('SELECT customer_id FROM agreements WHERE id = ?').get(job.agreement_id) as { customer_id: number } | undefined;
    const appDate = new Date(Date.now() - (i + 2) * 86400000).toISOString().split('T')[0];
    const startDate = new Date(Date.now() + i * 86400000).toISOString().split('T')[0];
    const endDate = new Date(Date.now() + (i + 7) * 86400000).toISOString().split('T')[0];
    const status = permitStatuses[i];
    const result = insertPermit.run(
      job.id,
      agreement?.customer_id ?? 1,
      job.address,
      ['London Borough of Enfield', 'London Borough of Croydon', 'London Borough of Barking and Dagenham'][i % 3],
      appDate,
      startDate,
      endDate,
      status,
      status === 'approved' ? `PERMIT-${1000 + i}` : null,
      'Seeded permit record'
    );
    db.prepare('UPDATE jobs SET highway_placement = 1, permit_id = ? WHERE id = ?').run(result.lastInsertRowid, job.id);
  }

  // ── WASTE RECORDS ─────────────────────────────────────────────────────────
  // Look up completed job IDs dynamically to avoid hardcoded ID assumptions
  const completedJobs = db.prepare(`SELECT id, vehicle_id, yard_id FROM jobs WHERE status = 'completed'`).all() as Array<{id: number, vehicle_id: number, yard_id: number}>;
  const insertWaste = db.prepare(`INSERT INTO waste_records (job_id, vehicle_id, waste_type, weight_kg, disposal_site, carrier_id, consignment_note, transfer_note_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const wasteSites: Record<number, string> = { 1: 'Ponders End Waste Transfer, EN3', 2: 'Beddington Lane Recycling, CR0', 3: 'Barking Riverside Waste, IG11' };
  const wasteTypes = ['mixed', 'inert', 'wood', 'concrete', 'mixed'];
  completedJobs.forEach((job, idx) => {
    insertWaste.run(job.id, job.vehicle_id, wasteTypes[idx % wasteTypes.length], 800 + idx * 150, wasteSites[job.yard_id] || 'Local Waste Transfer', `WC-2024-00${job.yard_id}`, `CN-2026-00${idx + 1}`, `TN-2026-000${idx + 1}`);
  });

  // ── TELEMATICS EVENTS ─────────────────────────────────────────────────────
  const insertTel = db.prepare(`INSERT INTO telematics_events (vehicle_id, driver_id, event_type, lat, lng, speed_kmh, timestamp, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const now = new Date();
  const telData = [
    { vid: 1,  did: 1,  type: 'speeding',    lat: 51.580, lng: -0.038, spd: 68, minsAgo: 45, det: { limit: 50, excess: 18 } },
    { vid: 2,  did: 2,  type: 'harsh_brake', lat: 51.597, lng: -0.091, spd: 12, minsAgo: 30, det: { deceleration_g: 0.7 } },
    { vid: 5,  did: 6,  type: 'idle_excess', lat: 51.386, lng: -0.109, spd: 0,  minsAgo: 20, det: { idle_mins: 14 } },
    { vid: 6,  did: 7,  type: 'speeding',    lat: 51.468, lng: 0.062,  spd: 72, minsAgo: 60, det: { limit: 50, excess: 22 } },
    { vid: 9,  did: 11, type: 'harsh_brake', lat: 51.543, lng: 0.055,  spd: 8,  minsAgo: 15, det: { deceleration_g: 0.65 } },
    { vid: 10, did: 12, type: 'geofence_exit',lat: 51.520, lng: -0.098, spd: 45, minsAgo: 90, det: { zone: 'London East Service Area' } },
    { vid: 1,  did: 1,  type: 'low_fuel',    lat: 51.575, lng: -0.040, spd: 30, minsAgo: 10, det: { fuel_level: 12 } },
    { vid: 3,  did: 3,  type: 'idle_excess', lat: 51.668, lng: -0.031, spd: 0,  minsAgo: 120, det: { idle_mins: 22 } },
    { vid: 5,  did: 6,  type: 'harsh_brake', lat: 51.380, lng: -0.105, spd: 5,  minsAgo: 5,  det: { deceleration_g: 0.8 } },
    { vid: 2,  did: 2,  type: 'speeding',    lat: 51.605, lng: -0.088, spd: 65, minsAgo: 75, det: { limit: 50, excess: 15 } },
    { vid: 6,  did: 7,  type: 'idle_excess', lat: 51.490, lng: 0.070,  spd: 0,  minsAgo: 35, det: { idle_mins: 11 } },
    { vid: 9,  did: 11, type: 'speeding',    lat: 51.550, lng: 0.062,  spd: 71, minsAgo: 50, det: { limit: 50, excess: 21 } },
    { vid: 10, did: 12, type: 'harsh_brake', lat: 51.478, lng: -0.065, spd: 10, minsAgo: 25, det: { deceleration_g: 0.6 } },
    { vid: 7,  did: 8,  type: 'low_fuel',    lat: 51.374, lng: -0.098, spd: 0,  minsAgo: 180, det: { fuel_level: 8 } },
    { vid: 1,  did: 1,  type: 'geofence_exit',lat: 51.560, lng: -0.045, spd: 40, minsAgo: 55, det: { zone: 'London North Service Area' } },
    { vid: 5,  did: 6,  type: 'speeding',    lat: 51.372, lng: -0.110, spd: 74, minsAgo: 40, det: { limit: 50, excess: 24 } },
    { vid: 2,  did: 2,  type: 'idle_excess', lat: 51.600, lng: -0.092, spd: 0,  minsAgo: 65, det: { idle_mins: 16 } },
    { vid: 9,  did: 11, type: 'geofence_exit',lat: 51.520, lng: 0.085,  spd: 38, minsAgo: 80, det: { zone: 'London East Service Area' } },
    { vid: 6,  did: 7,  type: 'harsh_brake', lat: 51.452, lng: 0.048,  spd: 7,  minsAgo: 100, det: { deceleration_g: 0.72 } },
    { vid: 10, did: 12, type: 'speeding',    lat: 51.485, lng: -0.028, spd: 69, minsAgo: 130, det: { limit: 50, excess: 19 } },
  ];
  for (const t of telData) {
    const ts = new Date(now.getTime() - t.minsAgo * 60000).toISOString();
    insertTel.run(t.vid, t.did, t.type, t.lat, t.lng, t.spd, ts, JSON.stringify(t.det));
  }

  // ── ACCOUNTING SYNC LOG ────────────────────────────────────────────────────
  const insertSync = db.prepare(`INSERT INTO accounting_sync_log (provider, record_type, record_id, synced_at, status, error_message) VALUES (?, ?, ?, ?, ?, ?)`);
  const syncData = [
    { prov: 'xero',        rt: 'invoice', rid: 1,  status: 'success', err: null },
    { prov: 'xero',        rt: 'invoice', rid: 2,  status: 'success', err: null },
    { prov: 'xero',        rt: 'payment', rid: 1,  status: 'success', err: null },
    { prov: 'xero',        rt: 'invoice', rid: 6,  status: 'success', err: null },
    { prov: 'xero',        rt: 'invoice', rid: 10, status: 'failed',  err: 'Duplicate invoice reference' },
    { prov: 'xero',        rt: 'payment', rid: 2,  status: 'success', err: null },
    { prov: 'xero',        rt: 'invoice', rid: 11, status: 'success', err: null },
    { prov: 'xero',        rt: 'invoice', rid: 12, status: 'success', err: null },
    { prov: 'quickbooks',  rt: 'invoice', rid: 3,  status: 'success', err: null },
    { prov: 'quickbooks',  rt: 'invoice', rid: 4,  status: 'success', err: null },
    { prov: 'quickbooks',  rt: 'payment', rid: 3,  status: 'success', err: null },
    { prov: 'quickbooks',  rt: 'invoice', rid: 7,  status: 'failed',  err: 'Authentication token expired' },
    { prov: 'quickbooks',  rt: 'invoice', rid: 8,  status: 'success', err: null },
    { prov: 'sage',        rt: 'invoice', rid: 5,  status: 'success', err: null },
    { prov: 'sage',        rt: 'invoice', rid: 9,  status: 'success', err: null },
    { prov: 'sage',        rt: 'payment', rid: 4,  status: 'success', err: null },
    { prov: 'sage',        rt: 'invoice', rid: 13, status: 'failed',  err: 'Connection timeout' },
    { prov: 'sage',        rt: 'invoice', rid: 14, status: 'success', err: null },
  ];
  for (const s of syncData) {
    const syncAt = new Date(now.getTime() - Math.random() * 86400000 * 3).toISOString();
    insertSync.run(s.prov, s.rt, s.rid, syncAt, s.status, s.err);
  }

  // ── JOB EVENTS ────────────────────────────────────────────────────────────
  const insertJobEvent = db.prepare(`INSERT INTO job_events (job_id, driver_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?)`);
  // signature_captured for each completed job — look up IDs dynamically
  const completedJobsForEvents = db.prepare(`SELECT id, driver_id FROM jobs WHERE status = 'completed'`).all() as Array<{id: number, driver_id: number}>;
  for (const job of completedJobsForEvents) {
    const completedAt = new Date(now.getTime() - 2 * 3600000).toISOString();
    insertJobEvent.run(job.id, job.driver_id, 'signature_captured', JSON.stringify({ method: 'touchscreen' }), completedAt);
  }

  db.prepare(`INSERT INTO seed_run (id) VALUES (1)`).run();
  console.log('✅ Seed data inserted successfully');
  }) // close transaction function

  seedTransaction() // execute it
}

