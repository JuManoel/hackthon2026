import { MAP_CONSTANTS } from '@/features/map/constants/map.constants'
import type { BirdZone } from '@/features/map/types/map.types'

type BirdPoint = {
  lat: number
  lng: number
}

type CartesianPoint = {
  x: number
  y: number
}

function hashText(value: string): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

function createSeededRandom(seed: number): () => number {
  let state = seed

  return () => {
    state += 0x6d2b79f5
    let next = Math.imul(state ^ (state >>> 15), state | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

function isFarEnough(candidate: CartesianPoint, existingPoints: CartesianPoint[]): boolean {
  const minimumDistance = MAP_CONSTANTS.birdPointMinDistanceMeters

  for (const point of existingPoints) {
    const deltaX = candidate.x - point.x
    const deltaY = candidate.y - point.y
    const distance = Math.hypot(deltaX, deltaY)

    if (distance < minimumDistance) {
      return false
    }
  }

  return true
}

export function buildBirdPoints(zone: BirdZone): BirdPoint[] {
  const pointsToGenerate = zone.totalDetections

  if (pointsToGenerate <= 0) {
    return []
  }

  const seed = hashText(`${zone.id}-${zone.totalDetections}`)
  const random = createSeededRandom(seed)
  const generatedInMeters: CartesianPoint[] = []

  let attempts = 0

  const maxAttempts = Math.max(
    pointsToGenerate * MAP_CONSTANTS.birdPointPlacementAttemptsMultiplier,
    MAP_CONSTANTS.birdPointPlacementAttemptsMultiplier,
  )

  while (generatedInMeters.length < pointsToGenerate && attempts < maxAttempts) {
    attempts += 1

    const angle = random() * 2 * Math.PI
    const radius = Math.sqrt(random()) * zone.radiusMeters * 0.88
    const candidate: CartesianPoint = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }

    if (!isFarEnough(candidate, generatedInMeters)) {
      continue
    }

    generatedInMeters.push(candidate)
  }

  const latMeters = 111320
  const lngMeters = latMeters * Math.cos((zone.center.lat * Math.PI) / 180)

  return generatedInMeters.map((point) => ({
    lat: zone.center.lat + point.y / latMeters,
    lng: zone.center.lng + point.x / lngMeters,
  }))
}
