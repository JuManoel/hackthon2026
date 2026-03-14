import { useEffect, type Dispatch, type SetStateAction } from 'react'

import { MAP_CONSTANTS } from '../constants/map.constants'
import type { BirdZone } from '../types/map.types'
import { inferActivityLevel } from '../utils/activity.utils'
import { calculateFrequency } from '../utils/frequency.utils'

type UseMockBirdMapFeedParams = {
  zones: BirdZone[]
  isEnabled: boolean
  onZonesUpdate: Dispatch<SetStateAction<BirdZone[]>>
}

function applyMockFeedTick(currentZones: BirdZone[]): BirdZone[] {
  if (currentZones.length === 0) {
    return currentZones
  }

  const selectedZoneIndex = Math.floor(Math.random() * currentZones.length)

  return currentZones.map((zone, index) => {
    if (index !== selectedZoneIndex) {
      return zone
    }

    if (zone.speciesStats.length === 0) {
      return zone
    }

    if (zone.totalDetections >= MAP_CONSTANTS.maxDetections) {
      return zone
    }

    const selectedSpeciesIndex = Math.floor(Math.random() * zone.speciesStats.length)
    const nextTotalDetections = Math.min(zone.totalDetections + 1, MAP_CONSTANTS.maxDetections)

    const nextSpeciesStats = zone.speciesStats
      .map((speciesStat, speciesIndex) => ({
        ...speciesStat,
        count: speciesIndex === selectedSpeciesIndex ? speciesStat.count + 1 : speciesStat.count,
      }))
      .map((speciesStat) => ({
        ...speciesStat,
        frequency: calculateFrequency(speciesStat.count, nextTotalDetections),
      }))
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count
        }

        return left.commonName.localeCompare(right.commonName)
      })

    const nextLastDetectionAt = new Date().toISOString()

    return {
      ...zone,
      totalDetections: nextTotalDetections,
      lastDetectionAt: nextLastDetectionAt,
      activityLevel: inferActivityLevel({
        totalDetections: nextTotalDetections,
        lastDetectionAt: nextLastDetectionAt,
      }),
      speciesStats: nextSpeciesStats,
    }
  })
}

export function useMockBirdMapFeed({ zones, isEnabled, onZonesUpdate }: UseMockBirdMapFeedParams): void {
  useEffect(() => {
    if (!isEnabled || zones.length === 0) {
      return
    }

    const interval = window.setInterval(() => {
      onZonesUpdate((currentZones) => applyMockFeedTick(currentZones))
    }, MAP_CONSTANTS.mockRefreshIntervalMs)

    return () => {
      window.clearInterval(interval)
    }
  }, [isEnabled, onZonesUpdate, zones.length])
}
