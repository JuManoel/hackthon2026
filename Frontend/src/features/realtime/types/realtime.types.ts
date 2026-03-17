export type ConnectionState = 'loading' | 'live' | 'error' | 'empty'

export type Camera = {
  id: string
  lat: number
  lng: number
  hasStreaming: boolean
}

export type DetectionBird = {
  species: string
  scientificName: string
  confidence: number
  bbox: [number, number, number, number]
}

export type Detection = {
  cameraId: string
  timestamp: number
  birds: DetectionBird[]
  fps?: number
  frameWidth?: number
  frameHeight?: number
}

export type CameraMonitoringSnapshot = {
  generatedAt: number
  windowStart: number
  activeCameraIds: string[]
}

export type StreamingFrame = {
  cameraId: string
  timestamp: number
  blob: Blob
}

export type AdapterLifecycle = {
  state: 'connected' | 'disconnected' | 'retrying'
  attempt?: number
}
