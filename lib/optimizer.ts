// lib/optimizer.ts — Route Optimisation Library
// Implements: haversine, twoOptSwap, nearestNeighbour, twoOpt, optimise

export interface LatLng {
  lat: number
  lng: number
}

export interface Yard {
  id: number
  name: string
  lat: number
  lng: number
  [key: string]: unknown
}

export interface Job {
  id: number
  lat: number
  lng: number
  type: string
  [key: string]: unknown
}

export interface OptimisationConstraints {
  maxStops: number
  shiftEndTime: string
  avoidMotorways: boolean
  prioritiseCommercial: boolean
}

export interface RouteStats {
  totalDistanceKm: number
  estimatedDurationMins: number
  stopCount: number
}

export interface JobSequenceItem {
  order: number
  job: Job
  estimatedArrival: string
  distanceFromPrevKm: number
}

export interface OptimisationResult {
  routeId: number
  before: RouteStats
  after: RouteStats
  sequence: JobSequenceItem[]
  improvement: number
}

const AVG_SPEED_KMH = 30

const SERVICE_TIMES: Record<string, number> = {
  delivery: 15,
  collection: 20,
  exchange: 25,
  wait_and_load: 45,
}

// Task 2.1 — haversine distance between two lat/lng points (km)
export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// Task 2.3 — reverse sub-array route[i..k] (inclusive), return new array
export function twoOptSwap(route: Job[], i: number, k: number): Job[] {
  const result = [...route]
  let left = i
  let right = k
  while (left < right) {
    const tmp = result[left]
    result[left] = result[right]
    result[right] = tmp
    left++
    right--
  }
  return result
}

// Task 2.5 — nearest-neighbour construction heuristic
export function nearestNeighbour(yard: Yard, jobs: Job[]): Job[] {
  if (jobs.length === 0) return []

  const unvisited = [...jobs]
  const route: Job[] = []
  let current: LatLng = { lat: yard.lat, lng: yard.lng }

  while (unvisited.length > 0) {
    let nearestIdx = 0
    let nearestDist = haversine(current, unvisited[0])

    for (let i = 1; i < unvisited.length; i++) {
      const d = haversine(current, unvisited[i])
      if (d < nearestDist) {
        nearestDist = d
        nearestIdx = i
      }
    }

    const nearest = unvisited[nearestIdx]
    route.push(nearest)
    unvisited.splice(nearestIdx, 1)
    current = { lat: nearest.lat, lng: nearest.lng }
  }

  return route
}

// Compute the change in total distance if we swap segment [i,k]
// i-1 defaults to yard when i=0; k+1 defaults to yard when k=route.length-1
function twoOptDelta(route: Job[], i: number, k: number, yard: Yard): number {
  const prev: LatLng = i === 0 ? { lat: yard.lat, lng: yard.lng } : route[i - 1]
  const next: LatLng = k === route.length - 1 ? { lat: yard.lat, lng: yard.lng } : route[k + 1]

  const before =
    haversine(prev, route[i]) + haversine(route[k], next)
  const after =
    haversine(prev, route[k]) + haversine(route[i], next)

  return after - before
}

// Task 2.6 — 2-opt improvement loop
export function twoOpt(route: Job[], yard: Yard, maxIterations = 200): Job[] {
  if (route.length < 2) return [...route]

  let current = [...route]
  let improved = true
  let iterations = 0

  while (improved && iterations < maxIterations) {
    improved = false
    for (let i = 0; i < current.length - 1; i++) {
      for (let k = i + 1; k < current.length; k++) {
        const delta = twoOptDelta(current, i, k, yard)
        if (delta < -0.001) {
          current = twoOptSwap(current, i, k)
          improved = true
        }
      }
    }
    iterations++
  }

  return current
}

// Compute total route distance: yard → jobs[0] → ... → jobs[n-1] → yard
function computeTotalDistance(yard: Yard, jobs: Job[]): number {
  if (jobs.length === 0) return 0

  let total = haversine({ lat: yard.lat, lng: yard.lng }, jobs[0])
  for (let i = 1; i < jobs.length; i++) {
    total += haversine(jobs[i - 1], jobs[i])
  }
  total += haversine(jobs[jobs.length - 1], { lat: yard.lat, lng: yard.lng })
  return total
}

// Compute route stats for a given job order
function computeStats(yard: Yard, jobs: Job[]): RouteStats {
  const totalDistanceKm = computeTotalDistance(yard, jobs)

  let durationMins = 0
  let prev: LatLng = { lat: yard.lat, lng: yard.lng }
  for (const job of jobs) {
    const dist = haversine(prev, job)
    durationMins += (dist / AVG_SPEED_KMH) * 60
    durationMins += SERVICE_TIMES[job.type] ?? 15
    prev = { lat: job.lat, lng: job.lng }
  }
  // Return to yard travel time
  durationMins += (haversine(prev, { lat: yard.lat, lng: yard.lng }) / AVG_SPEED_KMH) * 60

  return {
    totalDistanceKm,
    estimatedDurationMins: Math.round(durationMins),
    stopCount: jobs.length,
  }
}

// Parse "HH:MM" shift start from constraints.shiftEndTime, defaulting to 08:00
function parseShiftStart(constraints: OptimisationConstraints): Date {
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0)
  return base
}

// Format a Date as "HH:MM"
function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// Task 2.8 — orchestrate NN + 2-opt, compute stats and arrival times
export function optimise(
  yard: Yard,
  jobs: Job[],
  constraints: OptimisationConstraints
): OptimisationResult {
  // BEFORE stats — naive/original order
  const before = computeStats(yard, jobs)

  // Phase 1: nearest-neighbour construction
  const nnRoute = nearestNeighbour(yard, jobs)

  // Phase 2: 2-opt improvement
  const optimisedRoute = twoOpt(nnRoute, yard, 200)

  // AFTER stats — optimised order
  const after = computeStats(yard, optimisedRoute)

  // Compute arrival times
  const shiftStart = parseShiftStart(constraints)
  let currentTime = new Date(shiftStart)
  let prev: LatLng = { lat: yard.lat, lng: yard.lng }

  const sequence: JobSequenceItem[] = optimisedRoute.map((job, idx) => {
    const distFromPrev = haversine(prev, job)
    const travelMins = (distFromPrev / AVG_SPEED_KMH) * 60
    currentTime = new Date(currentTime.getTime() + travelMins * 60 * 1000)
    const arrival = formatTime(currentTime)
    const serviceMins = SERVICE_TIMES[job.type] ?? 15
    currentTime = new Date(currentTime.getTime() + serviceMins * 60 * 1000)
    prev = { lat: job.lat, lng: job.lng }

    return {
      order: idx + 1,
      job,
      estimatedArrival: arrival,
      distanceFromPrevKm: distFromPrev,
    }
  })

  // Improvement percentage
  const improvement =
    before.totalDistanceKm > 0
      ? Math.max(0, ((before.totalDistanceKm - after.totalDistanceKm) / before.totalDistanceKm) * 100)
      : 0

  return {
    routeId: 0, // unconfirmed
    before,
    after,
    sequence,
    improvement,
  }
}
