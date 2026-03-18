import { API_BASE_URL } from '@/config'

export const REALTIME_CONSTANTS = {
  javaSocketPath: '/ws',
  cameraMonitoringTopic: '/topic/camera/monitoring/recent',
  detectionTopic: '/topic/alerts',
  streamingSocketPath: '/ws/video_stream',
  retryDelayMs: 2000,
  maxRetryDelayMs: 15000,
  viewerAckTimeoutMs: 5000,
  viewerHeartbeatMs: 15000,
  mapDetectionWindowMs: 15 * 60 * 1000,
  highLatencyThresholdMs: 5000,
  streamPublishFps: 8,
  streamPublishMaxWidth: 960,
  streamPublishMaxHeight: 540,
  streamJpegQuality: 0.68,
  streamMaxBufferedBytes: 1_000_000,
  caldasBounds: {
    minLat: 4.75,
    maxLat: 5.80,
    minLng: -75.90,
    maxLng: -74.60,
  },
} as const

export function buildJavaSocketUrl(): string {
  const base = API_BASE_URL
  const wsBase = base.startsWith('https://') ? base.replace('https://', 'wss://') : base.replace('http://', 'ws://')

  return `${wsBase}${REALTIME_CONSTANTS.javaSocketPath}`
}

export function buildStreamingSocketBaseUrl(): string {
  const rawHost = import.meta.env.VITE_PYTHON_SERVICE_URL?.trim()

  if (!rawHost) {
    throw new Error('Missing VITE_PYTHON_SERVICE_URL for streaming service')
  }

  if (rawHost.startsWith('ws://') || rawHost.startsWith('wss://')) {
    return rawHost.replace(/\/+$/, '')
  }

  if (rawHost.startsWith('http://')) {
    return rawHost.replace('http://', 'ws://').replace(/\/+$/, '')
  }

  if (rawHost.startsWith('https://')) {
    return rawHost.replace('https://', 'wss://').replace(/\/+$/, '')
  }

  throw new Error(
    `Invalid VITE_PYTHON_SERVICE_URL: "${rawHost}". Expected ws://, wss://, http:// or https://`,
  )
}
