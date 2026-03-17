import { BIRD_RECORDS_MOCK } from '@/features/map/mocks/bird-records.mock'
import { CAMERAS_MOCK } from '@/features/map/mocks/cameras.mock'
import { PHOTOS_MOCK } from '@/features/map/mocks/photos.mock'
import { POSITIONS_MOCK } from '@/features/map/mocks/positions.mock'
import { SPECIES_MOCK } from '@/features/map/mocks/species.mock'
import type { BirdMapQuery, BirdZone, BuildBirdZonesParams } from '@/features/map/types/map.types'
import { buildBirdZones } from '@/features/map/services/map.mapper'

export async function getBirdMapData(query?: BirdMapQuery): Promise<BuildBirdZonesParams> {
  void query

  return {
    cameras: [...CAMERAS_MOCK],
    positions: [...POSITIONS_MOCK],
    species: [...SPECIES_MOCK],
    photos: [...PHOTOS_MOCK],
    birdRecords: [...BIRD_RECORDS_MOCK],
  }
}

export async function getBirdZones(query?: BirdMapQuery): Promise<BirdZone[]> {
  const data = await getBirdMapData(query)

  return buildBirdZones(data)
}
