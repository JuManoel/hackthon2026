import type { Camera, Detection } from '@/features/realtime/types/realtime.types'

export type BirdZoneSpeciesStat = {
  speciesId: string
  commonName: string
  scientificName: string
  count: number
  frequency: number
  confidence: number
}

export type BirdZone = {
  id: string
  cameraId: string
  cameraName: string
  center: {
    lat: number
    lng: number
  }
  radiusMeters: number
  totalDetections: number
  lastDetectionAt: string | null
  activityLevel: 'low' | 'medium' | 'high' | 'live'
  speciesStats: BirdZoneSpeciesStat[]
  hasStreaming: boolean
}

export type BirdMapData = {
  cameras: Camera[]
  detections: Detection[]
}
