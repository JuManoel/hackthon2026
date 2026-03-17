import { MAP_CONSTANTS } from '@/features/map/constants/map.constants'
import type { BuildBirdZonesParams, BirdZone } from '@/features/map/types/map.types'
import { inferActivityLevel } from '@/features/map/utils/activity.utils'
import { toBirdZoneSpeciesStats } from '@/features/map/utils/bird-zone.utils'
import { getLatestIsoDate } from '@/features/map/utils/date.utils'

type SpeciesCounter = {
  speciesId: string
  commonName: string
  scientificName: string
  count: number
}

export function buildBirdZones(params: BuildBirdZonesParams): BirdZone[] {
  const { cameras, positions, species, photos, birdRecords } = params

  const positionByCameraId = new Map(positions.map((position) => [position.cameraId, position]))
  const speciesById = new Map(species.map((entry) => [entry.id, entry]))
  const photoById = new Map(photos.map((photo) => [photo.id, photo]))
  const recordsByCameraId = new Map<string, typeof birdRecords>()

  for (const record of birdRecords) {
    const records = recordsByCameraId.get(record.cameraId)

    if (records) {
      records.push(record)
      continue
    }

    recordsByCameraId.set(record.cameraId, [record])
  }

  const zones: BirdZone[] = []

  for (const camera of cameras) {
    const position = positionByCameraId.get(camera.id)

    if (!position) {
      continue
    }

    const cameraRecords = (recordsByCameraId.get(camera.id) ?? []).slice(0, MAP_CONSTANTS.maxDetections)
    const totalDetections = cameraRecords.length

    if (totalDetections < MAP_CONSTANTS.minDetections) {
      continue
    }

    const detectedDates: string[] = []
    const speciesCounterById = new Map<string, SpeciesCounter>()

    for (const record of cameraRecords) {
      const photo = photoById.get(record.photoId)

      if (photo) {
        detectedDates.push(photo.capturedAt)
      }

      const speciesEntry = speciesById.get(record.speciesId)

      if (!speciesEntry) {
        continue
      }

      const speciesCounter = speciesCounterById.get(record.speciesId)

      if (speciesCounter) {
        speciesCounter.count += 1
        continue
      }

      speciesCounterById.set(record.speciesId, {
        speciesId: speciesEntry.id,
        commonName: speciesEntry.commonName,
        scientificName: speciesEntry.scientificName,
        count: 1,
      })
    }

    const lastDetectionAt = getLatestIsoDate(detectedDates)
    const speciesStats = toBirdZoneSpeciesStats([...speciesCounterById.values()], totalDetections)

    zones.push({
      id: `zone-${camera.id}`,
      cameraId: camera.id,
      cameraName: camera.name,
      region: position.region,
      direction: position.direction,
      center: {
        lat: position.lat,
        lng: position.lng,
      },
      radiusMeters: MAP_CONSTANTS.defaultZoneRadiusMeters,
      totalDetections,
      lastDetectionAt,
      activityLevel: inferActivityLevel({
        totalDetections,
        lastDetectionAt,
      }),
      speciesStats,
    })
  }

  return zones
}
