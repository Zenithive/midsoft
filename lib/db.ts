import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Store DB outside the src tree so Turbopack doesn't watch it
const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'waste_route.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  const database = db;

  database.exec(`
    CREATE TABLE IF NOT EXISTS yards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      service_radius_km REAL DEFAULT 15,
      skip_stock TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      yard_id INTEGER NOT NULL,
      registration TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('skip_lorry','flatbed','tipper')),
      capacity_tonnes REAL NOT NULL,
      max_skips INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','on_route','maintenance')),
      telematics_id TEXT,
      FOREIGN KEY (yard_id) REFERENCES yards(id)
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      yard_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      licence_class TEXT NOT NULL,
      shift_start TEXT NOT NULL,
      shift_end TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','on_shift','off_duty')),
      FOREIGN KEY (yard_id) REFERENCES yards(id)
    );

    CREATE TABLE IF NOT EXISTS skips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      yard_id INTEGER NOT NULL,
      size_yards INTEGER NOT NULL CHECK(size_yards IN (2,4,6,8,10,12,14,16)),
      quantity_available INTEGER NOT NULL DEFAULT 0,
      quantity_on_hire INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (yard_id) REFERENCES yards(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      account_type TEXT NOT NULL DEFAULT 'residential' CHECK(account_type IN ('residential','commercial')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      yard_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      job_type TEXT NOT NULL CHECK(job_type IN ('delivery','collection','exchange','wait_and_load')),
      skip_size INTEGER NOT NULL,
      preferred_time_slot TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','scheduled','completed','cancelled')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (yard_id) REFERENCES yards(id)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      yard_id INTEGER NOT NULL,
      driver_id INTEGER,
      vehicle_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('delivery','collection','exchange','wait_and_load')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','assigned','in_progress','completed','cancelled')),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      skip_size INTEGER NOT NULL,
      notes TEXT,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT,
      completed_at TEXT,
      sequence_order INTEGER DEFAULT 0,
      route_id INTEGER,
      FOREIGN KEY (yard_id) REFERENCES yards(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      yard_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      driver_id INTEGER,
      vehicle_id INTEGER,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','optimised','active','completed')),
      job_ids TEXT DEFAULT '[]',
      total_distance_km REAL DEFAULT 0,
      estimated_duration_mins INTEGER DEFAULT 0,
      optimised_at TEXT,
      FOREIGN KEY (yard_id) REFERENCES yards(id)
    );

    CREATE TABLE IF NOT EXISTS gps_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      speed_kmh REAL DEFAULT 0,
      heading REAL DEFAULT 0,
      fuel_level REAL DEFAULT 100,
      engine_status TEXT DEFAULT 'on' CHECK(engine_status IN ('on','off')),
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS job_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      driver_id INTEGER,
      event_type TEXT NOT NULL CHECK(event_type IN ('status_change','note_added','photo_taken','signature_captured')),
      payload TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      job_id INTEGER,
      amount_gbp REAL NOT NULL,
      vat_gbp REAL NOT NULL,
      total_gbp REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','paid','overdue')),
      issued_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS waste_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      waste_type TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      disposal_site TEXT NOT NULL,
      carrier_id TEXT,
      consignment_note TEXT,
      transfer_note_number TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS telematics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('harsh_brake','speeding','idle_excess','geofence_exit','low_fuel')),
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      speed_kmh REAL DEFAULT 0,
      timestamp TEXT DEFAULT (datetime('now')),
      details TEXT DEFAULT '{}',
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS accounting_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL CHECK(provider IN ('xero','quickbooks','sage')),
      record_type TEXT NOT NULL CHECK(record_type IN ('invoice','payment')),
      record_id INTEGER NOT NULL,
      synced_at TEXT DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'success' CHECK(status IN ('success','failed')),
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS seed_run (
      id INTEGER PRIMARY KEY,
      ran_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export default getDb;
