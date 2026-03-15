export type Camera = {
  id: string
  name: string
  angleXY: number
  angleXZ: number
}

export type CameraPosition = {
  id: string
  cameraId: string
  region: string
  direction: string
  lat: number
  lng: number
}

export type BirdSpecies = {
  id: string
  commonName: string
  scientificName: string
  className: string
}

export type BirdPhoto = {
  id: string
  url: string
  capturedAt: string
}

export type BirdRecord = {
  id: string
  speciesId: string
  photoId: string
  cameraId: string
}

export type BirdZoneSpeciesStat = {
  speciesId: string
  commonName: string
  scientificName: string
  count: number
  frequency: number
}

export type BirdZone = {
  id: string
  cameraId: string
  cameraName: string
  region: string
  direction: string
  center: {
    lat: number
    lng: number
  }
  radiusMeters: number
  totalDetections: number
  lastDetectionAt: string | null
  activityLevel: 'low' | 'medium' | 'high' | 'live'
  speciesStats: BirdZoneSpeciesStat[]
}

export type BuildBirdZonesParams = {
  cameras: Camera[]
  positions: CameraPosition[]
  species: BirdSpecies[]
  photos: BirdPhoto[]
  birdRecords: BirdRecord[]
}

export type BirdMapQuery = {
  userId?: string
}
