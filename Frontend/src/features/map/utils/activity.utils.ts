import { MAP_CONSTANTS } from '../constants/map.constants'
import type { BirdZone } from '../types/map.types'

type InferActivityLevelParams = {
  totalDetections: number
  lastDetectionAt: string | null
  now?: Date
}

export function inferActivityLevel(params: InferActivityLevelParams): BirdZone['activityLevel'] {
  const { totalDetections, lastDetectionAt, now = new Date() } = params

  if (totalDetections <= 0 || !lastDetectionAt) {
    return 'low'
  }

  const lastDetectionTime = new Date(lastDetectionAt).getTime()
  const minutesSinceLastDetection = (now.getTime() - lastDetectionTime) / (1000 * 60)

  if (minutesSinceLastDetection <= MAP_CONSTANTS.liveWindowMinutes) {
    return 'live'
  }

  if (totalDetections < MAP_CONSTANTS.mediumActivityThreshold) {
    return 'medium'
  }

  if (totalDetections < MAP_CONSTANTS.highActivityThreshold) {
    return 'high'
  }

  return 'high'
}

export function getZoneStyle(activityLevel: BirdZone['activityLevel']): {
  color: string
  fillOpacity: number
  weight: number
} {
  switch (activityLevel) {
    case 'live':
      return { color: '#2f2f2f', fillOpacity: 0.24, weight: 2 }
    case 'high':
      return { color: '#4a4a4a', fillOpacity: 0.18, weight: 2 }
    case 'medium':
      return { color: '#666666', fillOpacity: 0.12, weight: 1.5 }
    default:
      return { color: '#8c8c8c', fillOpacity: 0.08, weight: 1 }
  }
}
