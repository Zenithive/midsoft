import { getDb } from './db';

// Module-level singleton guard to prevent multiple intervals in development hot-reload
let simulatorInterval: NodeJS.Timeout | null = null;

// Waypoints for each yard (simple route loops)
const YARD_WAYPOINTS: Record<number, Array<{ lat: number; lng: number }>> = {
  1: [ // London North (Enfield)
    { lat: 51.668, lng: -0.031 }, // Yard
    { lat: 51.650, lng: -0.050 },
    { lat: 51.630, lng: -0.070 },
    { lat: 51.610, lng: -0.040 },
    { lat: 51.640, lng: -0.020 },
  ],
  2: [ // London South (Croydon)
    { lat: 51.374, lng: -0.098 }, // Yard
    { lat: 51.390, lng: -0.120 },
    { lat: 51.410, lng: -0.140 },
    { lat: 51.400, lng: -0.110 },
    { lat: 51.380, lng: -0.090 },
  ],
  3: [ // London East (Barking)
    { lat: 51.534, lng: 0.077 }, // Yard
    { lat: 51.550, lng: 0.090 },
    { lat: 51.540, lng: 0.110 },
    { lat: 51.520, lng: 0.100 },
    { lat: 51.530, lng: 0.080 },
  ],
};

// Driver state: segmentIndex and progress within segment
const driverState = new Map<number, { segmentIndex: number; progress: number }>();

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function calculateBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return (bearing + 360) % 360; // Normalize to 0-360
}

function simulateTick() {
  const db = getDb();

  // Query active drivers with their assigned vehicles
  const activeDrivers = db
    .prepare(
      `SELECT d.id as driver_id, d.yard_id, v.id as vehicle_id
       FROM drivers d
       JOIN vehicles v ON v.yard_id = d.yard_id AND v.status = 'on_route'
       WHERE d.status = 'on_shift'`
    )
    .all() as Array<{ driver_id: number; yard_id: number; vehicle_id: number }>;

  const insertGps = db.prepare(
    `INSERT INTO gps_positions (driver_id, vehicle_id, lat, lng, speed_kmh, heading, fuel_level, engine_status, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  );

  for (const driver of activeDrivers) {
    const waypoints = YARD_WAYPOINTS[driver.yard_id];
    if (!waypoints || waypoints.length < 2) continue;

    // Initialize state if not exists
    if (!driverState.has(driver.driver_id)) {
      driverState.set(driver.driver_id, { segmentIndex: 0, progress: 0 });
    }

    const state = driverState.get(driver.driver_id)!;
    const { segmentIndex, progress } = state;

    // Get current segment waypoints
    const fromIndex = segmentIndex % waypoints.length;
    const toIndex = (segmentIndex + 1) % waypoints.length;
    const from = waypoints[fromIndex];
    const to = waypoints[toIndex];

    // Linear interpolation
    const lat = from.lat + (to.lat - from.lat) * progress;
    const lng = from.lng + (to.lng - from.lng) * progress;

    // Calculate heading (bearing from current to next waypoint)
    const heading = calculateBearing(from, to);

    // Random speed between 25 and 50 km/h
    const speed_kmh = randomBetween(25, 50);

    // Insert GPS position
    insertGps.run(
      driver.driver_id,
      driver.vehicle_id,
      lat,
      lng,
      speed_kmh,
      heading,
      100, // fuel_level (default)
      'on'
    );

    // Advance progress
    let newProgress = progress + 0.15;
    let newSegmentIndex = segmentIndex;

    // Move to next segment if progress >= 1.0
    if (newProgress >= 1.0) {
      newProgress = 0;
      newSegmentIndex = (segmentIndex + 1) % waypoints.length;
    }

    // Update state
    driverState.set(driver.driver_id, {
      segmentIndex: newSegmentIndex,
      progress: newProgress,
    });
  }
}

export function startGpsSimulator() {
  // Prevent multiple intervals
  if (simulatorInterval !== null) {
    return;
  }

  // Start the simulator
  simulatorInterval = setInterval(simulateTick, 5000);
  console.log('[GPS Simulator] Started with 5s interval');
}

export function stopGpsSimulator() {
  if (simulatorInterval !== null) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    console.log('[GPS Simulator] Stopped');
  }
}
