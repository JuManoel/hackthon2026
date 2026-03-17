import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { labels } from '@/constants/labels'
import { Button } from '@/shared/ui/button/Button'
import { CameraSocketAdapter } from '@/features/realtime/adapters/CameraSocketAdapter'
import { StreamingSocketAdapter } from '@/features/realtime/adapters/StreamingSocketAdapter'
import { REALTIME_CONSTANTS } from '@/features/realtime/adapters/realtime.constants'
import type { ConnectionState, DetectionBird } from '@/features/realtime/types/realtime.types'
import { useCameraStreamingAvailability } from '@/features/realtime/hooks/useCameraStreamingAvailability'
import './CameraDetailPage.css'

interface CameraDetailPageProps {
  readonly __noProps?: never
}

type FrameRenderMetrics = {
  sourceWidth: number
  sourceHeight: number
  offsetX: number
  offsetY: number
  drawWidth: number
  drawHeight: number
}

function toSourceBbox(
  bbox: [number, number, number, number],
  sourceWidth: number,
  sourceHeight: number,
): [number, number, number, number] {
  const [x1, y1, x2, y2] = bbox

  if (Math.max(Math.abs(x1), Math.abs(y1), Math.abs(x2), Math.abs(y2)) <= 1) {
    return [x1 * sourceWidth, y1 * sourceHeight, x2 * sourceWidth, y2 * sourceHeight]
  }

  return [x1, y1, x2, y2]
}

function computeContainMetrics(
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): FrameRenderMetrics {
  const safeSourceWidth = Math.max(1, sourceWidth)
  const safeSourceHeight = Math.max(1, sourceHeight)
  const safeCanvasWidth = Math.max(1, canvasWidth)
  const safeCanvasHeight = Math.max(1, canvasHeight)

  const scale = Math.min(safeCanvasWidth / safeSourceWidth, safeCanvasHeight / safeSourceHeight)
  const drawWidth = Math.max(1, Math.round(safeSourceWidth * scale))
  const drawHeight = Math.max(1, Math.round(safeSourceHeight * scale))
  const offsetX = Math.floor((safeCanvasWidth - drawWidth) / 2)
  const offsetY = Math.floor((safeCanvasHeight - drawHeight) / 2)

  return {
    sourceWidth: safeSourceWidth,
    sourceHeight: safeSourceHeight,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight,
  }
}

function toConfidencePercent(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0
  }

  return confidence <= 1 ? confidence * 100 : confidence
}

export const CameraDetailPage: FC<CameraDetailPageProps> = () => {
  const navigate = useNavigate()
  const params = useParams<{ cameraId: string }>()

  const initialCameraId = params.cameraId ?? ''
  const activeStreamingSet = useCameraStreamingAvailability()
  const [selectedCameraId, setSelectedCameraId] = useState(initialCameraId)
  const [cameraIds, setCameraIds] = useState<string[]>(initialCameraId ? [initialCameraId] : [])
  const [connectionState, setConnectionState] = useState<ConnectionState>(initialCameraId ? 'loading' : 'empty')
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [delayMs, setDelayMs] = useState(0)
  const [rotationDeg, setRotationDeg] = useState(0)

  const streamCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameMetricsRef = useRef<FrameRenderMetrics>({
    sourceWidth: 1,
    sourceHeight: 1,
    offsetX: 0,
    offsetY: 0,
    drawWidth: 1,
    drawHeight: 1,
  })
  const hasFrameRef = useRef(false)
  const lastBirdsRef = useRef<DetectionBird[]>([])
  const cameraSocketRef = useRef(new CameraSocketAdapter())
  const streamingSocketRef = useRef(new StreamingSocketAdapter())

  useEffect(() => {
    document.title = labels.streamPageTitle
  }, [])

  const syncCanvasSize = useCallback(() => {
    const streamCanvas = streamCanvasRef.current
    const overlayCanvas = overlayCanvasRef.current

    if (!streamCanvas || !overlayCanvas) {
      return
    }

    const rect = streamCanvas.getBoundingClientRect()
    const width = Math.floor(rect.width)
    const height = Math.floor(rect.height)

    if (width <= 0 || height <= 0) {
      return
    }

    if (streamCanvas.width !== width || streamCanvas.height !== height) {
      streamCanvas.width = width
      streamCanvas.height = height
    }

    if (overlayCanvas.width !== width || overlayCanvas.height !== height) {
      overlayCanvas.width = width
      overlayCanvas.height = height
    }

    const previousMetrics = frameMetricsRef.current
    frameMetricsRef.current = computeContainMetrics(
      previousMetrics.sourceWidth,
      previousMetrics.sourceHeight,
      width,
      height,
    )
  }, [])

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    const frameMetrics = frameMetricsRef.current

    lastBirdsRef.current.forEach((bird) => {
      const [srcX1, srcY1, srcX2, srcY2] = toSourceBbox(
        bird.bbox,
        frameMetrics.sourceWidth,
        frameMetrics.sourceHeight,
      )
      const x1 = frameMetrics.offsetX + (srcX1 / frameMetrics.sourceWidth) * frameMetrics.drawWidth
      const y1 = frameMetrics.offsetY + (srcY1 / frameMetrics.sourceHeight) * frameMetrics.drawHeight
      const x2 = frameMetrics.offsetX + (srcX2 / frameMetrics.sourceWidth) * frameMetrics.drawWidth
      const y2 = frameMetrics.offsetY + (srcY2 / frameMetrics.sourceHeight) * frameMetrics.drawHeight
      const width = Math.max(0, x2 - x1)
      const height = Math.max(0, y2 - y1)

      context.strokeStyle = '#c1121f'
      context.lineWidth = 2
      context.strokeRect(x1, y1, width, height)

      const name = bird.scientificName || bird.species || labels.streamBoundingBoxFallback
      const confidence = toConfidencePercent(bird.confidence)
      const label = `${name} ${confidence.toFixed(1)}%`
      context.font = '12px Inter, sans-serif'
      const textWidth = context.measureText(label).width
      const textHeight = 16

      context.fillStyle = 'rgba(31, 31, 31, 0.85)'
      context.fillRect(x1, Math.max(0, y1 - textHeight), textWidth + 10, textHeight)
      context.fillStyle = '#ffffff'
      context.fillText(label, x1 + 5, Math.max(12, y1 - 4))
    })
  }, [])

  const drawFrame = useCallback(
    async (blob: Blob): Promise<void> => {
      const canvas = streamCanvasRef.current
      if (!canvas) {
        return
      }

      const context = canvas.getContext('2d')
      if (!context) {
        return
      }

      syncCanvasSize()

      try {
        const bitmap = await createImageBitmap(blob)
        const frameMetrics = computeContainMetrics(bitmap.width, bitmap.height, canvas.width, canvas.height)
        frameMetricsRef.current = frameMetrics
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(
          bitmap,
          frameMetrics.offsetX,
          frameMetrics.offsetY,
          frameMetrics.drawWidth,
          frameMetrics.drawHeight,
        )
        bitmap.close()
        hasFrameRef.current = true
        setConnectionState('live')
        drawOverlay()
      } catch {
        setConnectionState('error')
      }
    },
    [drawOverlay, syncCanvasSize],
  )

  useEffect(() => {
    const monitoringAdapter = cameraSocketRef.current
    monitoringAdapter.connect()

    const unsubscribeMonitoring = monitoringAdapter.onMessage((snapshot) => {
      setDelayMs(Date.now() - snapshot.generatedAt)
      setCameraIds((currentIds) => {
        const next = new Set(currentIds)
        snapshot.activeCameraIds.forEach((id) => {
          next.add(id)
        })

        if (selectedCameraId) {
          next.add(selectedCameraId)
        }

        return Array.from(next)
      })
    })

    return () => {
      unsubscribeMonitoring()
      monitoringAdapter.disconnect()
    }
  }, [selectedCameraId])

  useEffect(() => {
    if (!selectedCameraId) {
      return
    }

    const streamAdapter = streamingSocketRef.current
    hasFrameRef.current = false
    lastBirdsRef.current = []
    drawOverlay()

    streamAdapter.connect(selectedCameraId, { mode: 'viewer' })

    const unsubscribeLifecycle = streamAdapter.onLifecycle((event) => {
      if (event.state === 'connected') {
        setRetryAttempt(0)
        setConnectionState(hasFrameRef.current ? 'live' : 'empty')
      }

      if (event.state === 'retrying') {
        setRetryAttempt(event.attempt ?? 0)
        setConnectionState('loading')
      }

      if (event.state === 'disconnected') {
        setConnectionState('error')
      }
    })

    const unsubscribeFrame = streamAdapter.onFrame((frame) => {
      void drawFrame(frame.blob)
    })

    const unsubscribeDetection = streamAdapter.onDetection((detection) => {
      lastBirdsRef.current = detection.birds
      drawOverlay()
      if (!hasFrameRef.current) {
        setConnectionState(detection.birds.length > 0 ? 'live' : 'empty')
      }
    })

    const unsubscribeDelay = streamAdapter.onDelay((delay) => {
      setDelayMs(delay)
    })

    const unsubscribeError = streamAdapter.onError(() => {
      setConnectionState('error')
    })

    return () => {
      unsubscribeLifecycle()
      unsubscribeFrame()
      unsubscribeDetection()
      unsubscribeDelay()
      unsubscribeError()
      streamAdapter.disconnect()
    }
  }, [drawFrame, drawOverlay, selectedCameraId])

  useEffect(() => {
    syncCanvasSize()

    const handleResize = (): void => {
      syncCanvasSize()
      drawOverlay()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [drawOverlay, syncCanvasSize])

  const canViewStream = activeStreamingSet.has(selectedCameraId)
  const isDelayed = delayMs > REALTIME_CONSTANTS.highLatencyThresholdMs

  const statusLabel = useMemo(() => {
    if (connectionState === 'loading') {
      return retryAttempt > 0 ? labels.streamRetryLabel(retryAttempt) : labels.streamStateLoading
    }

    if (connectionState === 'error') {
      return labels.streamStateError
    }

    if (connectionState === 'empty') {
      return labels.streamStateEmpty
    }

    return labels.streamStateLive
  }, [connectionState, retryAttempt])

  return (
    <main className="camera-stream-page">
      <header className="camera-stream-controls">
        <label className="camera-stream-select-wrap" htmlFor="stream-camera-select">
          <span>{labels.streamSelectCamera}</span>
          <select
            id="stream-camera-select"
            value={selectedCameraId}
            onChange={(event) => {
              const nextCameraId = event.target.value
              setSelectedCameraId(nextCameraId)
              if (!nextCameraId) {
                setConnectionState('empty')
              }
            }}
          >
            {cameraIds.length === 0 ? <option value="">{labels.cameraDetailUnknownCamera}</option> : null}
            {cameraIds.map((cameraId) => (
              <option key={cameraId} value={cameraId}>
                {cameraId}
              </option>
            ))}
          </select>
        </label>

        <div className="camera-stream-actions">
          <Button
            type="button"
            onClick={() => {
              setRotationDeg((current) => (current + 90) % 360)
            }}
          >
            {labels.streamRotate}
          </Button>
          <Button
            type="button"
            onClick={() => {
              navigate('/cameras')
            }}
          >
            {labels.streamExit}
          </Button>
        </div>
      </header>

      <section className="camera-stream-stage">
        <div className="camera-stream-meta">
          <span className={`camera-stream-status camera-stream-status--${connectionState}`}>{statusLabel}</span>
          {!canViewStream ? <span className="camera-stream-warning">{labels.streamNoSignal}</span> : null}
          {isDelayed ? <span className="camera-stream-delay">{labels.streamDelayLabel(Math.floor(delayMs / 1000))}</span> : null}
        </div>

        <div className="camera-stream-canvas-shell" style={{ transform: `rotate(${rotationDeg}deg)` }}>
          <canvas ref={streamCanvasRef} className="camera-stream-canvas" />
          <canvas ref={overlayCanvasRef} className="camera-stream-overlay" />

          {connectionState !== 'live' ? (
            <div className="camera-stream-fallback">
              <p>{connectionState === 'error' ? labels.streamConnectionError : labels.streamNoSignal}</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
