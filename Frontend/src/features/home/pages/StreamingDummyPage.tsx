import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'

import { labels } from '@/constants/labels'
import { getStoredToken } from '@/features/auth/services/auth.service'
import { listCamerasRequest } from '@/features/home/services/cameras.service'
import type { CameraDto } from '@/features/home/types/camera.types'
import { StreamingSocketAdapter } from '@/features/realtime/adapters/StreamingSocketAdapter'
import { REALTIME_CONSTANTS } from '@/features/realtime/adapters/realtime.constants'
import type { DetectionBird } from '@/features/realtime/types/realtime.types'
import {
  clearCameraStreamPresence,
  touchCameraStreamPresence,
} from '@/features/realtime/services/streaming-presence.service'
import { Button } from '@/shared/ui/button/Button'
import './StreamingDummyPage.css'

interface StreamingDummyPageProps {
  readonly __noProps?: never
}

type StreamUiState = 'idle' | 'loading' | 'live' | 'error'

type FrameRenderMetrics = {
  sourceWidth: number
  sourceHeight: number
  offsetX: number
  offsetY: number
  drawWidth: number
  drawHeight: number
}

const DEFAULT_FRAME_WIDTH = 1280
const DEFAULT_FRAME_HEIGHT = 720
const INFLIGHT_TIMEOUT_MS = 1800
const LABEL_COLOURS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#a5d6ff', '#7ee787']

function generateCameraId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `cam-${Date.now()}`
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

function computeCaptureSize(videoWidth: number, videoHeight: number): { width: number; height: number } {
  const safeVideoWidth = Math.max(1, videoWidth)
  const safeVideoHeight = Math.max(1, videoHeight)
  const dpr = Math.max(1, window.devicePixelRatio || 1)
  const viewportWidth = Math.max(1, Math.round(window.innerWidth * dpr))
  const viewportHeight = Math.max(1, Math.round(window.innerHeight * dpr))
  const scale = Math.min(1, Math.min(viewportWidth / safeVideoWidth, viewportHeight / safeVideoHeight))

  return {
    width: Math.max(1, Math.round(safeVideoWidth * scale)),
    height: Math.max(1, Math.round(safeVideoHeight * scale)),
  }
}

function toConfidencePercent(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0
  }

  return confidence <= 1 ? confidence * 100 : confidence
}

export const StreamingDummyPage: FC<StreamingDummyPageProps> = () => {
  const navigate = useNavigate()
  const adapterRef = useRef(new StreamingSocketAdapter())
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const captureContextRef = useRef<CanvasRenderingContext2D | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const inflightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sendFrameRef = useRef<() => void>(() => undefined)
  const lifecycleUnsubscribeRef = useRef<(() => void) | null>(null)
  const detectionUnsubscribeRef = useRef<(() => void) | null>(null)
  const errorUnsubscribeRef = useRef<(() => void) | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const viewerHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shouldPublishRef = useRef(false)
  const connectedRef = useRef(false)
  const waitingRef = useRef(false)
  const lastBirdsRef = useRef<DetectionBird[]>([])
  const lastFrameWRef = useRef(DEFAULT_FRAME_WIDTH)
  const lastFrameHRef = useRef(DEFAULT_FRAME_HEIGHT)
  const frameMetricsRef = useRef<FrameRenderMetrics>({
    sourceWidth: DEFAULT_FRAME_WIDTH,
    sourceHeight: DEFAULT_FRAME_HEIGHT,
    offsetX: 0,
    offsetY: 0,
    drawWidth: DEFAULT_FRAME_WIDTH,
    drawHeight: DEFAULT_FRAME_HEIGHT,
  })
  const colourMapRef = useRef<Record<string, string>>({})
  const colourIdxRef = useRef(0)
  const fpsTimestampsRef = useRef<number[]>([])
  const connectedCameraIdRef = useRef('')

  const [cameraId, setCameraId] = useState(generateCameraId())
  const [availableCameras, setAvailableCameras] = useState<readonly CameraDto[]>([])
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [height, setHeight] = useState('')
  const [streamState, setStreamState] = useState<StreamUiState>('idle')
  const [fps, setFps] = useState(0)
  const [framesSent, setFramesSent] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const clearInflightTimeout = useCallback((): void => {
    if (!inflightTimeoutRef.current) {
      return
    }

    clearTimeout(inflightTimeoutRef.current)
    inflightTimeoutRef.current = null
  }, [])

  const colourFor = useCallback((label: string): string => {
    const normalizedLabel = label.trim() || labels.streamBoundingBoxFallback
    if (!colourMapRef.current[normalizedLabel]) {
      colourMapRef.current[normalizedLabel] = LABEL_COLOURS[colourIdxRef.current % LABEL_COLOURS.length]
      colourIdxRef.current += 1
    }

    return colourMapRef.current[normalizedLabel]
  }, [])

  const syncOverlaySize = useCallback((): void => {
    const video = videoRef.current
    const overlay = overlayCanvasRef.current

    if (!video || !overlay) {
      return
    }

    const rect = video.getBoundingClientRect()
    const width = Math.max(1, Math.floor(rect.width))
    const height = Math.max(1, Math.floor(rect.height))

    if (overlay.width !== width || overlay.height !== height) {
      overlay.width = width
      overlay.height = height
    }

    frameMetricsRef.current = computeContainMetrics(
      lastFrameWRef.current,
      lastFrameHRef.current,
      overlay.width,
      overlay.height,
    )
  }, [])

  const syncCaptureResolution = useCallback((): void => {
    const video = videoRef.current
    const captureCanvas = captureCanvasRef.current
    if (!video || !captureCanvas || video.videoWidth <= 0 || video.videoHeight <= 0) {
      return
    }

    const { width, height } = computeCaptureSize(video.videoWidth, video.videoHeight)
    if (captureCanvas.width !== width || captureCanvas.height !== height) {
      captureCanvas.width = width
      captureCanvas.height = height
    }
  }, [])

  const drawOverlay = useCallback((): void => {
    const overlay = overlayCanvasRef.current
    if (!overlay) {
      return
    }

    const context = overlay.getContext('2d')
    if (!context) {
      return
    }

    context.clearRect(0, 0, overlay.width, overlay.height)

    const frameMetrics = frameMetricsRef.current

    for (const bird of lastBirdsRef.current) {
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

      const name = bird.scientificName || bird.species || labels.streamBoundingBoxFallback
      const confidence = toConfidencePercent(bird.confidence)
      const colour = colourFor(name)
      const label = `${name} ${confidence.toFixed(1)}%`

      context.strokeStyle = colour
      context.lineWidth = 2
      context.strokeRect(x1, y1, width, height)

      context.font = '600 13px Inter, sans-serif'
      const labelWidth = context.measureText(label).width + 12
      const labelHeight = 22
      const labelY = y1 > labelHeight + 4 ? y1 - 4 : y1 + labelHeight + 4

      context.fillStyle = `${colour}cc`
      context.fillRect(x1, labelY - labelHeight, labelWidth, labelHeight)
      context.fillStyle = '#ffffff'
      context.fillText(label, x1 + 6, labelY - 7)
    }
  }, [colourFor])

  const sendFrame = useCallback((): void => {
    if (waitingRef.current || !connectedRef.current) {
      return
    }

    const video = videoRef.current
    const captureCanvas = captureCanvasRef.current
    const captureContext = captureContextRef.current
    if (!video || !captureCanvas || !captureContext || video.readyState < 2) {
      return
    }

    syncCaptureResolution()
    const targetWidth = captureCanvas.width
    const targetHeight = captureCanvas.height
    if (targetWidth <= 0 || targetHeight <= 0) {
      return
    }

    captureContext.drawImage(video, 0, 0, targetWidth, targetHeight)
    waitingRef.current = true
    clearInflightTimeout()

    captureCanvas.toBlob((blob) => {
      if (!blob || !connectedRef.current) {
        waitingRef.current = false
        return
      }

      const published = adapterRef.current.publishFrame(blob)
      if (!published) {
        waitingRef.current = false
        setTimeout(() => {
          if (connectedRef.current) {
            sendFrameRef.current()
          }
        }, 90)
        return
      }

      setFramesSent((current) => current + 1)
      inflightTimeoutRef.current = setTimeout(() => {
        if (!waitingRef.current || !connectedRef.current) {
          return
        }

        waitingRef.current = false
        sendFrameRef.current()
      }, INFLIGHT_TIMEOUT_MS)
    }, 'image/jpeg', 0.75)
  }, [clearInflightTimeout, syncCaptureResolution])

  useEffect(() => {
    sendFrameRef.current = sendFrame
  }, [sendFrame])

  const stopPublishing = useCallback((): void => {
    shouldPublishRef.current = false
    connectedRef.current = false
    waitingRef.current = false
    clearInflightTimeout()

    lifecycleUnsubscribeRef.current?.()
    lifecycleUnsubscribeRef.current = null
    detectionUnsubscribeRef.current?.()
    detectionUnsubscribeRef.current = null
    errorUnsubscribeRef.current?.()
    errorUnsubscribeRef.current = null

    if (viewerHeartbeatRef.current) {
      clearInterval(viewerHeartbeatRef.current)
      viewerHeartbeatRef.current = null
    }

    adapterRef.current.disconnect()

    if (connectedCameraIdRef.current) {
      clearCameraStreamPresence(connectedCameraIdRef.current)
      connectedCameraIdRef.current = ''
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    lastBirdsRef.current = []
    fpsTimestampsRef.current = []
    setFps(0)
    setFramesSent(0)
    setError(null)
    setStreamState('idle')
    drawOverlay()
  }, [clearInflightTimeout, drawOverlay])

  const startPublishing = useCallback(async (): Promise<void> => {
    if (shouldPublishRef.current) {
      return
    }

    setError(null)

    if (!lat.trim() || !lng.trim()) {
      setError(labels.streamDummyInvalidCoordinates)
      return
    }

    const parsedLat = Number(lat)
    const parsedLng = Number(lng)
    const { minLat, maxLat, minLng, maxLng } = REALTIME_CONSTANTS.caldasBounds

    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      setError(labels.streamDummyInvalidCoordinates)
      return
    }

    if (parsedLat < minLat || parsedLat > maxLat || parsedLng < minLng || parsedLng > maxLng) {
      setError(labels.streamDummyInvalidCoordinatesRange)
      return
    }

    if (!cameraId.trim()) {
      setError(labels.cameraDetailUnknownCamera)
      return
    }

    setStreamState('loading')
    shouldPublishRef.current = true
    waitingRef.current = false
    setFramesSent(0)
    fpsTimestampsRef.current = []
    setFps(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: Math.round(window.screen.width * Math.max(1, window.devicePixelRatio || 1)) },
          height: { ideal: Math.round(window.screen.height * Math.max(1, window.devicePixelRatio || 1)) },
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      })

      mediaStreamRef.current = stream
      const video = videoRef.current
      if (!video) {
        stopPublishing()
        return
      }

      video.srcObject = stream
      await video.play()
      syncCaptureResolution()
      syncOverlaySize()
      drawOverlay()

      lifecycleUnsubscribeRef.current = adapterRef.current.onLifecycle((event) => {
        if (!shouldPublishRef.current) {
          return
        }

        if (event.state === 'connected') {
          connectedRef.current = true
          connectedCameraIdRef.current = cameraId
          touchCameraStreamPresence(cameraId)

          if (viewerHeartbeatRef.current) {
            clearInterval(viewerHeartbeatRef.current)
          }

          viewerHeartbeatRef.current = setInterval(() => {
            touchCameraStreamPresence(cameraId)
          }, 5000)

          setStreamState('live')
          sendFrameRef.current()
        }

        if (event.state === 'retrying') {
          connectedRef.current = false
          setStreamState('loading')
        }

        if (event.state === 'disconnected') {
          connectedRef.current = false
          if (shouldPublishRef.current) {
            setStreamState('error')
          }
        }
      })

      detectionUnsubscribeRef.current = adapterRef.current.onDetection((detection) => {
        if (!shouldPublishRef.current) {
          return
        }

        lastBirdsRef.current = detection.birds
        lastFrameWRef.current = detection.frameWidth ?? captureCanvasRef.current?.width ?? DEFAULT_FRAME_WIDTH
        lastFrameHRef.current = detection.frameHeight ?? captureCanvasRef.current?.height ?? DEFAULT_FRAME_HEIGHT

        frameMetricsRef.current = computeContainMetrics(
          lastFrameWRef.current,
          lastFrameHRef.current,
          overlayCanvasRef.current?.width ?? CAPTURE_WIDTH,
          overlayCanvasRef.current?.height ?? CAPTURE_HEIGHT,
        )
        drawOverlay()

        if (typeof detection.fps === 'number' && Number.isFinite(detection.fps)) {
          setFps(detection.fps)
        } else {
          const now = Date.now()
          fpsTimestampsRef.current.push(now)
          if (fpsTimestampsRef.current.length > 24) {
            fpsTimestampsRef.current.shift()
          }

          if (fpsTimestampsRef.current.length > 1) {
            const first = fpsTimestampsRef.current[0]
            const last = fpsTimestampsRef.current[fpsTimestampsRef.current.length - 1]
            const elapsed = last - first
            if (elapsed > 0) {
              const approxFps = ((fpsTimestampsRef.current.length - 1) * 1000) / elapsed
              setFps(Number(approxFps.toFixed(1)))
            }
          }
        }

        waitingRef.current = false
        clearInflightTimeout()
        sendFrameRef.current()
      })

      errorUnsubscribeRef.current = adapterRef.current.onError(() => {
        connectedRef.current = false
        waitingRef.current = false
        clearInflightTimeout()
        setStreamState('error')
        setError(labels.streamConnectionError)
      })

      adapterRef.current.connect(cameraId, { mode: 'publisher' })
    } catch {
      shouldPublishRef.current = false
      stopPublishing()
      setStreamState('error')
      setError(labels.streamConnectionError)
    }
  }, [cameraId, clearInflightTimeout, drawOverlay, lat, lng, stopPublishing, syncCaptureResolution, syncOverlaySize])

  useEffect(() => {
    document.title = labels.streamDummyPageTitle
  }, [])

  useEffect(() => {
    const captureCanvas = captureCanvasRef.current
    if (!captureCanvas) {
      return
    }

    captureCanvas.width = DEFAULT_FRAME_WIDTH
    captureCanvas.height = DEFAULT_FRAME_HEIGHT
    captureContextRef.current = captureCanvas.getContext('2d')
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadCameras = async (): Promise<void> => {
      const token = getStoredToken()
      if (!token) {
        return
      }

      try {
        const response = await listCamerasRequest(token, { page: 0, size: 200 })
        if (!isMounted) {
          return
        }

        setAvailableCameras(response.content)
        if (response.content.length > 0) {
          setCameraId(response.content[0].id)
        }
      } catch {
        // Si falla, se mantiene la opcion de ID generado manualmente.
      }
    }

    void loadCameras()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    syncOverlaySize()
    drawOverlay()

    const video = videoRef.current
    if (video && 'ResizeObserver' in window) {
      resizeObserverRef.current = new ResizeObserver(() => {
        syncOverlaySize()
        syncCaptureResolution()
        drawOverlay()
      })
      resizeObserverRef.current.observe(video)
    }

    const onResize = (): void => {
      syncOverlaySize()
      syncCaptureResolution()
      drawOverlay()
    }

    window.addEventListener('resize', onResize)

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
      window.removeEventListener('resize', onResize)
    }
  }, [drawOverlay, syncCaptureResolution, syncOverlaySize])

  useEffect(() => {
    return () => {
      stopPublishing()
    }
  }, [stopPublishing])

  const statusLabel =
    streamState === 'live'
      ? labels.streamStateLive
      : streamState === 'loading'
        ? labels.streamStateLoading
        : streamState === 'error'
          ? labels.streamStateError
          : labels.streamDummyStatusDisconnected

  return (
    <main className="streaming-dummy-page">
      <section className="streaming-dummy-card">
        <h1>{labels.streamDummyHeading}</h1>

        <label htmlFor="dummy-camera-id">{labels.streamDummyCameraId}</label>
        <div className="streaming-dummy-inline">
          <select
            id="dummy-camera-id"
            name="camera_id"
            required
            value={cameraId}
            disabled={streamState === 'loading' || streamState === 'live'}
            onChange={(event) => {
              setCameraId(event.target.value)
            }}
          >
            {availableCameras.length === 0 ? (
              <option value="">{labels.streamDummyCameraSelectPlaceholder}</option>
            ) : null}
            {availableCameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {labels.streamDummyCameraOptionLabel(camera.name, camera.id)}
              </option>
            ))}
            {!availableCameras.some((camera) => camera.id === cameraId) ? <option value={cameraId}>{cameraId}</option> : null}
          </select>
          <Button
            type="button"
            disabled={streamState === 'loading' || streamState === 'live'}
            onClick={() => {
              setCameraId(generateCameraId())
            }}
          >
            {labels.streamDummyGenerateCameraId}
          </Button>
        </div>

        <label
          htmlFor="dummy-lat"
          title={labels.streamDummyCoordinatesTooltip(
            REALTIME_CONSTANTS.caldasBounds.minLat,
            REALTIME_CONSTANTS.caldasBounds.maxLat,
            REALTIME_CONSTANTS.caldasBounds.minLng,
            REALTIME_CONSTANTS.caldasBounds.maxLng,
          )}
        >
          {labels.streamDummyLatitude}
        </label>
        <input
          id="dummy-lat"
          name="latitude"
          type="number"
          required
          inputMode="decimal"
          min={REALTIME_CONSTANTS.caldasBounds.minLat}
          max={REALTIME_CONSTANTS.caldasBounds.maxLat}
          step="0.000001"
          placeholder="5.298300"
          value={lat}
          onChange={(event) => {
            setLat(event.target.value)
          }}
        />

        <label
          htmlFor="dummy-lng"
          title={labels.streamDummyCoordinatesTooltip(
            REALTIME_CONSTANTS.caldasBounds.minLat,
            REALTIME_CONSTANTS.caldasBounds.maxLat,
            REALTIME_CONSTANTS.caldasBounds.minLng,
            REALTIME_CONSTANTS.caldasBounds.maxLng,
          )}
        >
          {labels.streamDummyLongitude}
        </label>
        <input
          id="dummy-lng"
          name="longitude"
          type="number"
          required
          inputMode="decimal"
          min={REALTIME_CONSTANTS.caldasBounds.minLng}
          max={REALTIME_CONSTANTS.caldasBounds.maxLng}
          step="0.000001"
          placeholder="-75.247900"
          value={lng}
          onChange={(event) => {
            setLng(event.target.value)
          }}
        />

        <label htmlFor="dummy-height">{labels.streamDummyHeight}</label>
        <input
          id="dummy-height"
          name="height"
          type="number"
          inputMode="decimal"
          step="any"
          value={height}
          onChange={(event) => {
            setHeight(event.target.value)
          }}
        />

        {error ? <p className="streaming-dummy-error">{error}</p> : null}

        <div className="streaming-dummy-actions">
          {streamState !== 'live' ? (
            <Button type="button" variant="primary" disabled={streamState === 'loading'} onClick={() => void startPublishing()}>
              {labels.streamDummyConnect}
            </Button>
          ) : (
            <Button type="button" onClick={stopPublishing}>
              {labels.streamDummyStop}
            </Button>
          )}

          <Button
            type="button"
            onClick={() => {
              navigate('/cameras')
            }}
          >
            {labels.streamExit}
          </Button>
        </div>

        <p>{statusLabel}</p>
        <p>{labels.streamDummyFramesSent(framesSent)}</p>

        <div className="streaming-dummy-preview-shell">
          <video ref={videoRef} autoPlay muted playsInline className="streaming-dummy-preview" />
          <canvas ref={overlayCanvasRef} className="streaming-dummy-preview-overlay" />

          <div className="streaming-dummy-preview-meta">
            <span className={`streaming-dummy-dot streaming-dummy-dot--${streamState}`} />
            <span>{statusLabel}</span>
            <span className="streaming-dummy-fps">{fps.toFixed(1)} FPS</span>
          </div>

          {streamState !== 'live' ? (
            <div className="streaming-dummy-preview-fallback">
              <p>{streamState === 'error' ? labels.streamConnectionError : labels.streamNoSignal}</p>
            </div>
          ) : null}
        </div>

        <canvas ref={captureCanvasRef} className="streaming-dummy-hidden" />
      </section>
    </main>
  )
}
