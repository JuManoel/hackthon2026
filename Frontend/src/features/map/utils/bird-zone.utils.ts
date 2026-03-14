import type { BirdZoneSpeciesStat } from '../types/map.types'
import { calculateFrequency } from './frequency.utils'

type SpeciesCountEntry = {
  speciesId: string
  commonName: string
  scientificName: string
  count: number
}

export function toBirdZoneSpeciesStats(entries: SpeciesCountEntry[], totalDetections: number): BirdZoneSpeciesStat[] {
  return entries
    .map((entry) => ({
      speciesId: entry.speciesId,
      commonName: entry.commonName,
      scientificName: entry.scientificName,
      count: entry.count,
      frequency: calculateFrequency(entry.count, totalDetections),
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return left.commonName.localeCompare(right.commonName)
    })
}
