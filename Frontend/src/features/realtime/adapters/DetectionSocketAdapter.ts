import { REALTIME_CONSTANTS } from '@/features/realtime/adapters/realtime.constants'
import { StompSocketAdapter } from '@/features/realtime/adapters/stomp-socket.adapter'
import type { Detection } from '@/features/realtime/types/realtime.types'

type AlertPayload = {
  probabilityYolo?: number | string
  species?: {
    popularName?: string
    scientificName?: string
  }
  photo?: {
    takenAt?: string
  }
  camera?: {
    id?: string
    location?: {
      latitude?: number | string
      longitude?: number | string
    }
  }
}

function toNumber(value: number | string | undefined): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function toOptionalNumber(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function toTimestamp(value: string | undefined): number {
  if (!value) {
    return Date.now()
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

export class DetectionSocketAdapter extends StompSocketAdapter<Detection> {
  constructor() {
    super('detection-socket-adapter', REALTIME_CONSTANTS.detectionTopic)
  }

  protected normalizePayload(payload: unknown): Detection | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const raw = payload as AlertPayload
    const cameraId = raw.camera?.id

    if (!cameraId) {
      return null
    }

    const species = raw.species?.popularName ?? raw.species?.scientificName ?? 'Ave'
    const scientificName = raw.species?.scientificName ?? species
    const confidenceRaw = toNumber(raw.probabilityYolo)
    const confidence = confidenceRaw > 1 ? confidenceRaw / 100 : confidenceRaw
    const cameraLat = toOptionalNumber(raw.camera?.location?.latitude)
    const cameraLng = toOptionalNumber(raw.camera?.location?.longitude)

    return {
      cameraId,
      timestamp: toTimestamp(raw.photo?.takenAt),
      cameraLat,
      cameraLng,
      birds: [
        {
          species,
          scientificName,
          confidence,
          bbox: [0.1, 0.1, 0.6, 0.6],
        },
      ],
    }
  }
}
