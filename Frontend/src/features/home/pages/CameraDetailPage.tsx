import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react'
import { CameraOff, ChevronLeft, ChevronRight, LogOut, Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { labels } from '@/constants/labels'
import { Button } from '@/shared/ui/button/Button'
import { Card } from '@/shared/ui/card/Card'
import { CameraSocketAdapter } from '@/features/realtime/adapters/CameraSocketAdapter'
import { StreamingSocketAdapter } from '@/features/realtime/adapters/StreamingSocketAdapter'
import { REALTIME_CONSTANTS } from '@/features/realtime/adapters/realtime.constants'
import type { ConnectionState, DetectionBird } from '@/features/realtime/types/realtime.types'
import { useCameraStreamingAvailability } from '@/features/realtime/hooks/useCameraStreamingAvailability'
import { HomeShell } from '@/features/home/components/HomeShell'
import { getStoredToken } from '@/features/auth/services/auth.service'
import { listCamerasRequest } from '@/features/home/services/cameras.service'
import type { CameraDto } from '@/features/home/types/camera.types'
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

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type FullscreenCapableDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  msExitFullscreen?: () => Promise<void> | void
  webkitFullscreenElement?: Element | null
  msFullscreenElement?: Element | null
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

function toPositiveFrameDimension(value: number | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value)
  }

  return fallback
}

function getFullscreenElement(doc: Document): Element | null {
  const fullscreenDoc = doc as FullscreenCapableDocument
  return doc.fullscreenElement ?? fullscreenDoc.webkitFullscreenElement ?? fullscreenDoc.msFullscreenElement ?? null
}

async function requestElementFullscreen(element: HTMLElement): Promise<void> {
  const fullscreenElement = element as FullscreenCapableElement

  if (typeof fullscreenElement.requestFullscreen === 'function') {
    await fullscreenElement.requestFullscreen()
    return
  }

  if (typeof fullscreenElement.webkitRequestFullscreen === 'function') {
    await fullscreenElement.webkitRequestFullscreen()
    return
  }

  if (typeof fullscreenElement.msRequestFullscreen === 'function') {
    await fullscreenElement.msRequestFullscreen()
  }
}

async function exitDocumentFullscreen(doc: Document): Promise<void> {
  const fullscreenDoc = doc as FullscreenCapableDocument

  if (typeof doc.exitFullscreen === 'function') {
    await doc.exitFullscreen()
    return
  }

  if (typeof fullscreenDoc.webkitExitFullscreen === 'function') {
    await fullscreenDoc.webkitExitFullscreen()
    return
  }

  if (typeof fullscreenDoc.msExitFullscreen === 'function') {
    await fullscreenDoc.msExitFullscreen()
  }
}

export const CameraDetailPage: FC<CameraDetailPageProps> = () => {
  const navigate = useNavigate()
  const params = useParams<{ cameraId: string }>()

  const initialCameraId = params.cameraId ?? ''
  const activeStreamingSet = useCameraStreamingAvailability()
  const [selectedCameraId, setSelectedCameraId] = useState(initialCameraId)
  const [cameraIds, setCameraIds] = useState<string[]>(initialCameraId ? [initialCameraId] : [])
  const [cameraCatalog, setCameraCatalog] = useState<readonly CameraDto[]>([])
  const [connectionState, setConnectionState] = useState<ConnectionState>(initialCameraId ? 'loading' : 'empty')
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [delayMs, setDelayMs] = useState(0)
  const [reloadToken, setReloadToken] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const canvasShellRef = useRef<HTMLDivElement | null>(null)
  const streamCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const cameraFrameSizeByIdRef = useRef<Record<string, { width: number; height: number }>>({})
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

  const fallbackDimensions = useMemo(() => ({ width: 1280, height: 720 }), [])

  const syncCanvasDimensions = useCallback((frameWidth: number, frameHeight: number) => {
    const streamCanvas = streamCanvasRef.current
    const overlayCanvas = overlayCanvasRef.current

    if (!streamCanvas || !overlayCanvas) {
      return
    }

    const width = Math.max(1, Math.floor(frameWidth))
    const height = Math.max(1, Math.floor(frameHeight))

    if (streamCanvas.width !== width || streamCanvas.height !== height) {
      streamCanvas.width = width
      streamCanvas.height = height
    }

    if (overlayCanvas.width !== width || overlayCanvas.height !== height) {
      overlayCanvas.width = width
      overlayCanvas.height = height
    }

    frameMetricsRef.current = computeContainMetrics(width, height, width, height)
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

  useEffect(() => {
    syncCanvasDimensions(fallbackDimensions.width, fallbackDimensions.height)
    drawOverlay()
  }, [drawOverlay, fallbackDimensions, syncCanvasDimensions])

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

      try {
        const bitmap = await createImageBitmap(blob)
        syncCanvasDimensions(bitmap.width, bitmap.height)
        const frameMetrics = computeContainMetrics(bitmap.width, bitmap.height, bitmap.width, bitmap.height)
        frameMetricsRef.current = frameMetrics
        if (selectedCameraId) {
          cameraFrameSizeByIdRef.current[selectedCameraId] = {
            width: bitmap.width,
            height: bitmap.height,
          }
        }
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close()
        hasFrameRef.current = true
        setConnectionState('live')
        drawOverlay()
      } catch {
        setConnectionState('error')
      }
    },
    [drawOverlay, selectedCameraId, syncCanvasDimensions],
  )

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

        setCameraCatalog(response.content)
        setCameraIds((currentIds) => {
          const next = new Set(currentIds)
          response.content.forEach((camera) => {
            next.add(camera.id)
          })

          if (initialCameraId) {
            next.add(initialCameraId)
          }

          return Array.from(next)
        })

        if (!initialCameraId && response.content.length > 0) {
          setSelectedCameraId((current) => current || response.content[0].id)
          setConnectionState((current) => (current === 'empty' ? 'loading' : current))
        }
      } catch {
        // Si falla, se mantiene el listado proveniente de monitoreo en tiempo real.
      }
    }

    void loadCameras()

    return () => {
      isMounted = false
    }
  }, [initialCameraId])

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
    const knownFrameSize = cameraFrameSizeByIdRef.current[selectedCameraId] ?? fallbackDimensions
    syncCanvasDimensions(knownFrameSize.width, knownFrameSize.height)
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
      const frameWidth = toPositiveFrameDimension(detection.frameWidth, frameMetricsRef.current.sourceWidth)
      const frameHeight = toPositiveFrameDimension(detection.frameHeight, frameMetricsRef.current.sourceHeight)
      cameraFrameSizeByIdRef.current[selectedCameraId] = {
        width: frameWidth,
        height: frameHeight,
      }
      syncCanvasDimensions(frameWidth, frameHeight)
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
  }, [drawFrame, drawOverlay, fallbackDimensions, reloadToken, selectedCameraId, syncCanvasDimensions])

  const cameraNameById = useMemo(() => {
    const nextMap = new Map<string, string>()
    cameraCatalog.forEach((camera) => {
      nextMap.set(camera.id, camera.name)
    })
    return nextMap
  }, [cameraCatalog])

  const cameraOptions = useMemo(
    () =>
      cameraIds.map((id) => ({
        id,
        name: cameraNameById.get(id) ?? labels.streamUnnamedCamera,
      })),
    [cameraIds, cameraNameById],
  )

  const hasMultipleCameras = cameraOptions.length > 1

  const switchCamera = useCallback(
    (offset: -1 | 1): void => {
      if (!hasMultipleCameras) {
        return
      }

      const currentIndex = cameraOptions.findIndex((camera) => camera.id === selectedCameraId)
      const baseIndex = currentIndex >= 0 ? currentIndex : 0
      const nextIndex = (baseIndex + offset + cameraOptions.length) % cameraOptions.length
      const nextCameraId = cameraOptions[nextIndex]?.id

      if (!nextCameraId || nextCameraId === selectedCameraId) {
        return
      }

      setSelectedCameraId(nextCameraId)
      setConnectionState('loading')
    },
    [cameraOptions, hasMultipleCameras, selectedCameraId],
  )

  const reloadStream = useCallback((): void => {
    if (!selectedCameraId) {
      return
    }

    hasFrameRef.current = false
    lastBirdsRef.current = []
    setRetryAttempt(0)
    setConnectionState('loading')
    drawOverlay()
    setReloadToken((current) => current + 1)
  }, [drawOverlay, selectedCameraId])

  const toggleFullscreen = useCallback((): void => {
    const shell = canvasShellRef.current
    if (!shell) {
      return
    }

    const activeFullscreenElement = getFullscreenElement(document)

    if (activeFullscreenElement === shell) {
      void exitDocumentFullscreen(document)
      return
    }

    void requestElementFullscreen(shell)
  }, [])

  useEffect(() => {
    const onFullscreenChange = (): void => {
      const shell = canvasShellRef.current
      if (!shell) {
        setIsFullscreen(false)
        return
      }

      setIsFullscreen(getFullscreenElement(document) === shell)
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    document.addEventListener('MSFullscreenChange', onFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
      document.removeEventListener('MSFullscreenChange', onFullscreenChange)
    }
  }, [])

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

  const showNoSignalBadge = !canViewStream || connectionState !== 'live'
  const noConnectionState = connectionState !== 'live'

  const connectionTooltip = useMemo(() => {
    const parts = [showNoSignalBadge ? labels.streamNoSignal : statusLabel]

    if (isDelayed) {
      parts.push(labels.streamDelayLabel(Math.floor(delayMs / 1000)))
    }

    return parts.join(' | ')
  }, [isDelayed, delayMs, showNoSignalBadge, statusLabel])

  return (
    <HomeShell activeTab="cameras" contentClassName="home-shell-content--top">
      <div className="cameras-page-wrap camera-stream-wrap">
        <header className="cameras-page-intro camera-stream-intro">
          <div className="camera-stream-top-actions">
            <Button
              type="button"
              className="camera-stream-top-button"
              onClick={() => {
                navigate('/cameras')
              }}
            >
              <LogOut size={15} aria-hidden="true" />
              <span>{labels.streamExit}</span>
            </Button>

            <h1 className="cameras-page-title">{labels.streamViewerTitle}</h1>

            <Button
              type="button"
              className="camera-stream-top-button"
              disabled={!selectedCameraId}
              onClick={reloadStream}
            >
              <RefreshCw size={15} aria-hidden="true" />
              <span>{labels.streamReloadAction}</span>
            </Button>
          </div>
        </header>

        <div className="camera-stream-stage">
          <div ref={canvasShellRef} className="camera-stream-canvas-shell">
            <Button
              type="button"
              className="camera-stream-canvas-action"
              title={isFullscreen ? labels.streamExitFullscreen : labels.streamEnterFullscreen}
              aria-label={isFullscreen ? labels.streamExitFullscreen : labels.streamEnterFullscreen}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
            </Button>

            <div className="camera-stream-canvas-frame">
              <canvas ref={streamCanvasRef} className="camera-stream-canvas" />
              <canvas ref={overlayCanvasRef} className="camera-stream-overlay" />

              {noConnectionState ? (
                <div className="camera-stream-fallback">
                  <span className="camera-stream-fallback-icon" aria-hidden="true">
                    <CameraOff size={44} strokeWidth={1.8} />
                  </span>
                  <p>{labels.streamNoSignal}</p>
                </div>
              ) : null}
            </div>

            {showNoSignalBadge ? (
              <span
                className="camera-stream-status-badge camera-stream-status-badge--empty"
                title={connectionTooltip}
              >
                {labels.streamNoSignal}
              </span>
            ) : null}
          </div>

          <Card className="camera-stream-controls-card">
            <div className="camera-stream-picker">
              <Button
                type="button"
                className="camera-stream-icon-button"
                disabled={!hasMultipleCameras}
                title={!hasMultipleCameras ? labels.streamSwitchUnavailable : labels.streamPreviousCamera}
                aria-label={labels.streamPreviousCamera}
                onClick={() => {
                  switchCamera(-1)
                }}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </Button>

              <label className="camera-stream-select-wrap" htmlFor="stream-camera-select">
                <span>{labels.streamSelectCamera}</span>
                <select
                  id="stream-camera-select"
                  value={selectedCameraId}
                  onChange={(event) => {
                    const nextCameraId = event.target.value
                    setSelectedCameraId(nextCameraId)
                    setConnectionState(nextCameraId ? 'loading' : 'empty')
                  }}
                >
                  {cameraOptions.length === 0 ? <option value="">{labels.cameraDetailUnknownCamera}</option> : null}
                  {cameraOptions.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.name}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                type="button"
                className="camera-stream-icon-button"
                disabled={!hasMultipleCameras}
                title={!hasMultipleCameras ? labels.streamSwitchUnavailable : labels.streamNextCamera}
                aria-label={labels.streamNextCamera}
                onClick={() => {
                  switchCamera(1)
                }}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>

            <div className="camera-stream-controls-footer">
              <div className="camera-stream-meta">
                {isDelayed ? (
                  <span className="camera-stream-delay">{labels.streamDelayLabel(Math.floor(delayMs / 1000))}</span>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </HomeShell>
  )
}
