import { TypedEventEmitter } from '@/shared/lib/events/typed-event-emitter'
import { logError, logInfo, logWarn } from '@/shared/lib/logging/structured-logger'
import { buildStreamingSocketBaseUrl, REALTIME_CONSTANTS } from '@/features/realtime/adapters/realtime.constants'
import type { AdapterLifecycle, Detection, StreamingFrame } from '@/features/realtime/types/realtime.types'

type StreamingSocketEvents = {
  lifecycle: AdapterLifecycle
  frame: StreamingFrame
  detection: Detection
  delay: number
  error: string
}

type StreamingSocketOptions = {
  mode: 'viewer' | 'publisher'
}

type StreamingSocketError =
  | 'STREAMING_SOCKET_CONFIG_ERROR'
  | 'STREAMING_SOCKET_UNREACHABLE'
  | 'STREAMING_SOCKET_CLOSED_BEFORE_ACK'
  | 'STREAMING_SOCKET_ACK_TIMEOUT'
  | 'STREAMING_SOCKET_INVALID_PAYLOAD'
  | 'STREAMING_SOCKET_VIEWER_REJECTED'

type StreamingPayload = {
  type?: string
  camera_id?: string
  detecciones?: Array<{
    especie?: string
    scientificName?: string
    confianza?: number | string
    confianza_detector?: number | string
    coordenadas?: [number, number, number, number]
  }>
  timestamp?: number
  frameBase64?: string
  fps?: number | string
  frame_w?: number | string
  frame_h?: number | string
}

function toNumber(value: number | string | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function toConfidence(value: number | string | undefined): number {
  const normalized = toNumber(value)
  if (normalized === null) {
    return 0
  }

  return normalized > 1 ? normalized / 100 : normalized
}

function toTimestamp(value: number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  return Date.now()
}

export class StreamingSocketAdapter {
  private readonly emitter = new TypedEventEmitter<StreamingSocketEvents>()
  private ws: WebSocket | null = null
  private retryAttempt = 0
  private retryTimeout: ReturnType<typeof setTimeout> | null = null
  private viewerHeartbeat: ReturnType<typeof setInterval> | null = null
  private viewerAckTimeout: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = false
  private desiredCameraId = ''
  private desiredMode: StreamingSocketOptions['mode'] = 'viewer'
  private viewerAckReceived = false
  private connectionEstablished = false
  private closeContext: 'none' | 'manual_disconnect' | 'switch_intent' | 'ack_timeout' = 'none'
  private connectionVersion = 0
  private activeCameraId = ''
  private activeMode: StreamingSocketOptions['mode'] = 'viewer'

  onLifecycle(listener: (event: AdapterLifecycle) => void): () => void {
    return this.emitter.on('lifecycle', listener)
  }

  onFrame(listener: (frame: StreamingFrame) => void): () => void {
    return this.emitter.on('frame', listener)
  }

  onDetection(listener: (detection: Detection) => void): () => void {
    return this.emitter.on('detection', listener)
  }

  onDelay(listener: (delayMs: number) => void): () => void {
    return this.emitter.on('delay', listener)
  }

  onError(listener: (message: string) => void): () => void {
    return this.emitter.on('error', listener)
  }

  connect(cameraId: string, options: StreamingSocketOptions = { mode: 'viewer' }): void {
    const normalizedCameraId = cameraId.trim()

    if (!normalizedCameraId) {
      this.emitError('STREAMING_SOCKET_VIEWER_REJECTED')
      logError('streaming-socket-adapter', 'invalid_camera_id', {
        cameraId,
        mode: options.mode,
      })
      return
    }

    this.desiredCameraId = normalizedCameraId
    this.desiredMode = options.mode
    this.shouldReconnect = true

    const socketReadyState = this.ws?.readyState
    const hasActiveSocket = socketReadyState === WebSocket.OPEN || socketReadyState === WebSocket.CONNECTING
    const sameIntent = hasActiveSocket && this.activeCameraId === normalizedCameraId && this.activeMode === options.mode

    if (sameIntent) {
      return
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }

    if (hasActiveSocket) {
      this.stopViewerHeartbeat()
      this.stopViewerAckTimeout()
      this.detachAndCloseSocket('switch_intent')
    }

    this.retryAttempt = 0
    this.openConnection()
  }

  disconnect(): void {
    this.shouldReconnect = false
    this.desiredCameraId = ''

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }

    this.stopViewerHeartbeat()
    this.stopViewerAckTimeout()
    this.detachAndCloseSocket('manual_disconnect')

    this.retryAttempt = 0
    this.emitter.emit('lifecycle', { state: 'disconnected' })
    logInfo('streaming-socket-adapter', 'disconnected', { cameraId: this.activeCameraId, mode: this.activeMode })
  }

  publishFrame(frameBlob: Blob): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false
    }

    if (this.ws.bufferedAmount > REALTIME_CONSTANTS.streamMaxBufferedBytes) {
      return false
    }

    this.ws.send(frameBlob)
    return true
  }

  private openConnection(): void {
    if (!this.shouldReconnect) {
      return
    }

    const cameraId = this.desiredCameraId
    const mode = this.desiredMode
    if (!cameraId) {
      return
    }

    let socketUrl = ''
    try {
      const query = new URLSearchParams({
        camera_id: cameraId,
        mode,
      })
      socketUrl = `${buildStreamingSocketBaseUrl()}${REALTIME_CONSTANTS.streamingSocketPath}?${query.toString()}`
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.emitError('STREAMING_SOCKET_CONFIG_ERROR')
      this.shouldReconnect = false
      this.emitter.emit('lifecycle', { state: 'disconnected' })
      logError('streaming-socket-adapter', 'config_error', {
        cameraId,
        mode,
        error: message,
      })
      return
    }

    const ws = new WebSocket(socketUrl)
    ws.binaryType = 'blob'

    this.ws = ws
    this.activeCameraId = cameraId
    this.activeMode = mode
    this.viewerAckReceived = mode === 'publisher'
    this.connectionEstablished = false
    this.closeContext = 'none'

    const connectionId = this.nextConnectionVersion()

    logInfo('streaming-socket-adapter', 'connecting', {
      cameraId,
      mode,
      socketUrl,
    })

    ws.onopen = () => {
      if (!this.isCurrentConnection(connectionId, ws)) {
        return
      }

      this.startViewerHeartbeat()

      if (mode === 'viewer') {
        this.startViewerAckTimeout(connectionId, ws, cameraId, mode)
        return
      }

      this.retryAttempt = 0
      this.connectionEstablished = true
      logInfo('streaming-socket-adapter', 'connected', { cameraId, mode })
      this.emitter.emit('lifecycle', { state: 'connected' })
    }

    ws.onclose = (event) => {
      if (!this.isCurrentConnection(connectionId, ws)) {
        return
      }

      this.stopViewerHeartbeat()
      this.stopViewerAckTimeout()
      this.ws = null

      logWarn('streaming-socket-adapter', 'disconnected', {
        cameraId,
        mode,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        readyState: ws.readyState,
        url: ws.url,
      })

      this.emitter.emit('lifecycle', { state: 'disconnected' })

      if (mode === 'viewer' && !this.viewerAckReceived) {
        if (this.closeContext === 'ack_timeout') {
          // El error STREAMING_SOCKET_ACK_TIMEOUT se emite cuando vence el timeout.
        } else if (this.isViewerRejectedClose(event)) {
          this.shouldReconnect = false
          this.emitError('STREAMING_SOCKET_VIEWER_REJECTED')
        } else {
          this.emitError('STREAMING_SOCKET_CLOSED_BEFORE_ACK')
        }
      }

      if (this.shouldReconnect && this.desiredCameraId === cameraId && this.desiredMode === mode) {
        this.scheduleReconnect(cameraId, mode)
      }

      this.closeContext = 'none'
    }

    ws.onerror = () => {
      if (!this.isCurrentConnection(connectionId, ws)) {
        return
      }

      this.emitError('STREAMING_SOCKET_UNREACHABLE')
      logError('streaming-socket-adapter', 'error', {
        cameraId,
        mode,
        readyState: ws.readyState,
        url: ws.url,
        established: this.connectionEstablished,
        ackReceived: this.viewerAckReceived,
      })
    }

    ws.onmessage = (event) => {
      if (!this.isCurrentConnection(connectionId, ws)) {
        return
      }

      if (event.data instanceof Blob) {
        const timestamp = Date.now()
        this.emitter.emit('frame', {
          cameraId,
          timestamp,
          blob: event.data,
        })
        return
      }

      if (typeof event.data !== 'string') {
        return
      }

      this.handleTextPayload(connectionId, cameraId, event.data)
    }
  }

  private handleTextPayload(connectionId: number, cameraId: string, payload: string): void {
    if (!this.isCurrentConnection(connectionId, this.ws)) {
      return
    }

    try {
      const parsed = JSON.parse(payload) as StreamingPayload

      if (parsed.type === 'viewer_connected') {
        this.viewerAckReceived = true
        this.stopViewerAckTimeout()

        if (!this.connectionEstablished) {
          this.connectionEstablished = true
          this.retryAttempt = 0
          logInfo('streaming-socket-adapter', 'connected', {
            cameraId,
            mode: this.activeMode,
            handshake: 'viewer_ack',
          })
          this.emitter.emit('lifecycle', { state: 'connected' })
        }

        logInfo('streaming-socket-adapter', 'viewer_ack', {
          cameraId,
          backendCameraId: parsed.camera_id ?? cameraId,
        })
        return
      }

      const timestamp = toTimestamp(parsed.timestamp)
      const delay = Date.now() - timestamp
      const fps = toNumber(parsed.fps)
      const frameWidth = toNumber(parsed.frame_w)
      const frameHeight = toNumber(parsed.frame_h)

      this.emitter.emit('delay', delay)

      if (typeof parsed.frameBase64 === 'string' && parsed.frameBase64.length > 0) {
        const blob = this.base64ToBlob(parsed.frameBase64)
        if (blob) {
          this.emitter.emit('frame', {
            cameraId,
            timestamp,
            blob,
          })
        }
      }

      const detections = parsed.detecciones ?? []
      if (detections.length === 0) {
        this.emitter.emit('detection', {
          cameraId,
          timestamp,
          birds: [],
          fps: fps ?? undefined,
          frameWidth: frameWidth ?? undefined,
          frameHeight: frameHeight ?? undefined,
        })
        return
      }

      const birds = detections.map((item) => ({
        species: item.especie ?? item.scientificName ?? 'Ave',
        scientificName: item.scientificName ?? item.especie ?? 'Ave',
        confidence: toConfidence(item.confianza ?? item.confianza_detector),
        bbox: item.coordenadas ?? [0, 0, 0, 0],
      }))

      this.emitter.emit('detection', {
        cameraId,
        timestamp,
        birds,
        fps: fps ?? undefined,
        frameWidth: frameWidth ?? undefined,
        frameHeight: frameHeight ?? undefined,
      })
    } catch {
      this.emitError('STREAMING_SOCKET_INVALID_PAYLOAD')
      logError('streaming-socket-adapter', 'invalid_payload', {
        cameraId,
      })
    }
  }

  private scheduleReconnect(cameraId: string, mode: StreamingSocketOptions['mode']): void {
    if (this.retryTimeout) {
      return
    }

    if (!this.shouldReconnect || this.desiredCameraId !== cameraId || this.desiredMode !== mode) {
      return
    }

    this.retryAttempt += 1
    const delay = Math.min(
      REALTIME_CONSTANTS.retryDelayMs * this.retryAttempt,
      REALTIME_CONSTANTS.maxRetryDelayMs,
    )

    this.emitter.emit('lifecycle', {
      state: 'retrying',
      attempt: this.retryAttempt,
    })

    logWarn('streaming-socket-adapter', 'retrying', {
      attempt: this.retryAttempt,
      delay,
      cameraId: this.activeCameraId,
      mode: this.activeMode,
    })

    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null
      if (!this.shouldReconnect || this.desiredCameraId !== cameraId || this.desiredMode !== mode) {
        return
      }

      if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
        return
      }

      this.openConnection()
    }, delay)
  }

  private startViewerHeartbeat(): void {
    if (this.activeMode !== 'viewer') {
      return
    }

    this.stopViewerHeartbeat()
    this.viewerHeartbeat = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return
      }

      this.ws.send('ping')
    }, REALTIME_CONSTANTS.viewerHeartbeatMs)
  }

  private stopViewerHeartbeat(): void {
    if (!this.viewerHeartbeat) {
      return
    }

    clearInterval(this.viewerHeartbeat)
    this.viewerHeartbeat = null
  }

  private startViewerAckTimeout(
    connectionId: number,
    ws: WebSocket,
    cameraId: string,
    mode: StreamingSocketOptions['mode'],
  ): void {
    if (mode !== 'viewer') {
      return
    }

    this.stopViewerAckTimeout()
    this.viewerAckTimeout = setTimeout(() => {
      if (!this.isCurrentConnection(connectionId, ws) || this.viewerAckReceived) {
        return
      }

      this.closeContext = 'ack_timeout'
      this.emitError('STREAMING_SOCKET_ACK_TIMEOUT')
      logWarn('streaming-socket-adapter', 'ack_timeout', {
        cameraId,
        mode,
        timeoutMs: REALTIME_CONSTANTS.viewerAckTimeoutMs,
        url: ws.url,
      })

      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(4408, 'viewer_ack_timeout')
      }
    }, REALTIME_CONSTANTS.viewerAckTimeoutMs)
  }

  private stopViewerAckTimeout(): void {
    if (!this.viewerAckTimeout) {
      return
    }

    clearTimeout(this.viewerAckTimeout)
    this.viewerAckTimeout = null
  }

  private detachAndCloseSocket(context: 'manual_disconnect' | 'switch_intent'): void {
    if (!this.ws) {
      return
    }

    const ws = this.ws
    this.ws = null
    this.closeContext = context

    ws.onopen = null
    ws.onmessage = null
    ws.onerror = null
    ws.onclose = null

    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close(1000, context)
    }
  }

  private isCurrentConnection(connectionId: number, ws: WebSocket | null): boolean {
    return Boolean(ws) && this.connectionVersion === connectionId && this.ws === ws
  }

  private nextConnectionVersion(): number {
    this.connectionVersion += 1
    return this.connectionVersion
  }

  private isViewerRejectedClose(event: CloseEvent): boolean {
    if (event.code === 4400 || event.code === 4401 || event.code === 4403) {
      return true
    }

    const reason = event.reason.toLowerCase()
    return reason.includes('invalid') || reason.includes('reject')
  }

  private emitError(errorCode: StreamingSocketError): void {
    this.emitter.emit('error', errorCode)
  }

  private base64ToBlob(base64Data: string): Blob | null {
    const parts = base64Data.split(',')
    const payload = parts.length > 1 ? parts[1] : parts[0]

    if (!payload) {
      return null
    }

    try {
      const byteCharacters = atob(payload)
      const byteNumbers = new Array(byteCharacters.length)

      for (let index = 0; index < byteCharacters.length; index += 1) {
        byteNumbers[index] = byteCharacters.charCodeAt(index)
      }

      const byteArray = new Uint8Array(byteNumbers)
      return new Blob([byteArray], { type: 'image/jpeg' })
    } catch {
      return null
    }
  }
}
