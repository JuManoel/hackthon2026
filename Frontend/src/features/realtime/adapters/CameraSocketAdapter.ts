import { REALTIME_CONSTANTS } from '@/features/realtime/adapters/realtime.constants'
import { StompSocketAdapter } from '@/features/realtime/adapters/stomp-socket.adapter'
import type { CameraMonitoringSnapshot } from '@/features/realtime/types/realtime.types'

type MonitoringPayload = {
  generatedAt?: string
  windowStart?: string
  activeCameraIds?: unknown
}

function toTimestamp(value: string | undefined): number {
  if (!value) {
    return Date.now()
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

export class CameraSocketAdapter extends StompSocketAdapter<CameraMonitoringSnapshot> {
  constructor() {
    super('camera-socket-adapter', REALTIME_CONSTANTS.cameraMonitoringTopic)
  }

  protected normalizePayload(payload: unknown): CameraMonitoringSnapshot | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const raw = payload as MonitoringPayload
    const activeCameraIds = Array.isArray(raw.activeCameraIds)
      ? raw.activeCameraIds.filter((value): value is string => typeof value === 'string')
      : []

    return {
      generatedAt: toTimestamp(raw.generatedAt),
      windowStart: toTimestamp(raw.windowStart),
      activeCameraIds,
    }
  }
}
