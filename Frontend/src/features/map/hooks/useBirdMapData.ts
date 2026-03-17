import { useEffect, useMemo, useState } from 'react'

import { MAP_CONSTANTS } from '@/features/map/constants/map.constants'
import type { BirdZone } from '@/features/map/types/map.types'
import { inferActivityLevel } from '@/features/map/utils/activity.utils'
import { toBirdZoneSpeciesStats } from '@/features/map/utils/bird-zone.utils'
import { getStoredToken } from '@/features/auth/services/auth.service'
import { listCamerasRequest } from '@/features/home/services/cameras.service'
import { cameraSocketAdapter, detectionSocketAdapter } from '@/features/realtime/adapters/instances'
import { REALTIME_CONSTANTS } from '@/features/realtime/adapters/realtime.constants'
import type { Camera, ConnectionState, Detection } from '@/features/realtime/types/realtime.types'
import { labels } from '@/constants/labels'
import { useCameraStreamingAvailability } from '@/features/realtime/hooks/useCameraStreamingAvailability'

type UseBirdMapDataReturn = {
  zones: BirdZone[]
  state: ConnectionState
  error: string | null
  isDelayed: boolean
  delayMs: number
}

type DetectionByCamera = Map<string, Detection[]>

function buildZones(
  cameras: Camera[],
  detectionsByCamera: DetectionByCamera,
  activeStreamingIds: ReadonlySet<string>,
): BirdZone[] {
  const now = Date.now()

  return cameras
    .filter((camera) => Number.isFinite(camera.lat) && Number.isFinite(camera.lng))
    .map((camera) => {
      const detections = detectionsByCamera.get(camera.id) ?? []
      const birds = detections.flatMap((detection) => detection.birds)
      const totalDetections = birds.length

      const speciesCounters = new Map<
        string,
        {
          speciesId: string
          commonName: string
          scientificName: string
          count: number
          confidenceTotal: number
        }
      >()

      birds.forEach((bird) => {
        const key = bird.scientificName.toLowerCase()
        const previous = speciesCounters.get(key)

        if (!previous) {
          speciesCounters.set(key, {
            speciesId: key,
            commonName: bird.species,
            scientificName: bird.scientificName,
            count: 1,
            confidenceTotal: bird.confidence,
          })
          return
        }

        speciesCounters.set(key, {
          ...previous,
          count: previous.count + 1,
          confidenceTotal: previous.confidenceTotal + bird.confidence,
        })
      })

      const speciesStats = toBirdZoneSpeciesStats(
        Array.from(speciesCounters.values()).map((entry) => ({
          speciesId: entry.speciesId,
          commonName: entry.commonName,
          scientificName: entry.scientificName,
          count: entry.count,
          confidence: entry.count > 0 ? entry.confidenceTotal / entry.count : 0,
        })),
        totalDetections,
      )

      const lastDetectionAt = detections.length > 0 ? new Date(detections[detections.length - 1].timestamp).toISOString() : null

      return {
        id: camera.id,
        cameraId: camera.id,
        cameraName: `${labels.mapCameraPrefix} ${camera.id.slice(0, 8)}`,
        center: {
          lat: camera.lat,
          lng: camera.lng,
        },
        radiusMeters: MAP_CONSTANTS.defaultZoneRadiusMeters,
        totalDetections,
        lastDetectionAt,
        activityLevel: inferActivityLevel({
          totalDetections,
          lastDetectionAt,
          now: new Date(now),
        }),
        speciesStats,
        hasStreaming: activeStreamingIds.has(camera.id),
      }
    })
}

function pruneDetections(detections: Detection[]): Detection[] {
  const threshold = Date.now() - REALTIME_CONSTANTS.mapDetectionWindowMs

  return detections.filter((detection) => detection.timestamp >= threshold)
}

export function useBirdMapData(): UseBirdMapDataReturn {
  const activeStreamingIds = useCameraStreamingAvailability()
  const [state, setState] = useState<ConnectionState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [delayMs, setDelayMs] = useState(0)
  const [cameras, setCameras] = useState<Map<string, Camera>>(new Map())
  const [detectionsByCamera, setDetectionsByCamera] = useState<DetectionByCamera>(new Map())

  useEffect(() => {
    let isMounted = true

    const loadInitialCameras = async (): Promise<void> => {
      const token = getStoredToken()

      if (!token) {
        setError(labels.authSessionExpired)
        setState('error')
        return
      }

      try {
        const response = await listCamerasRequest(token, { page: 0, size: 200 })

        if (!isMounted) {
          return
        }

        const cameraMap = new Map<string, Camera>()

        response.content.forEach((camera) => {
          cameraMap.set(camera.id, {
            id: camera.id,
            lat: camera.location.latitude,
            lng: camera.location.longitude,
            hasStreaming: false,
          })
        })

        setCameras(cameraMap)
        setState(cameraMap.size === 0 ? 'empty' : 'loading')
      } catch {
        if (!isMounted) {
          return
        }

        setError(labels.mapSocketConnectionError)
        setState('error')
      }
    }

    void loadInitialCameras()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    cameraSocketAdapter.connect()
    detectionSocketAdapter.connect()

    const unsubscribeCameraLifecycle = cameraSocketAdapter.onLifecycle((event) => {
      if (event.state === 'connected') {
        setState((currentState) => (currentState === 'error' ? 'live' : currentState))
      }

      if (event.state === 'disconnected') {
        setError(labels.mapSocketDisconnected)
        setState('error')
      }
    })

    const unsubscribeDetectionLifecycle = detectionSocketAdapter.onLifecycle((event) => {
      if (event.state === 'connected') {
        setState((currentState) => (currentState === 'loading' ? 'live' : currentState))
      }

      if (event.state === 'disconnected') {
        setError(labels.mapSocketDisconnected)
        setState('error')
      }
    })

    const unsubscribeCameraError = cameraSocketAdapter.onError(() => {
      setError(labels.mapSocketConnectionError)
      setState('error')
    })

    const unsubscribeDetectionError = detectionSocketAdapter.onError(() => {
      setError(labels.mapSocketConnectionError)
      setState('error')
    })

    const unsubscribeMonitoring = cameraSocketAdapter.onMessage((snapshot) => {
      setDelayMs(Date.now() - snapshot.generatedAt)

      setCameras((currentMap) => {
        const nextMap = new Map(currentMap)

        snapshot.activeCameraIds.forEach((cameraId) => {
          if (!nextMap.has(cameraId)) {
            nextMap.set(cameraId, {
              id: cameraId,
              lat: NaN,
              lng: NaN,
              hasStreaming: false,
            })
          }
        })

        return nextMap
      })

      setState((currentState) => (currentState === 'error' ? currentState : 'live'))
      setError(null)
    })

    const unsubscribeDetection = detectionSocketAdapter.onMessage((detection) => {
      setDetectionsByCamera((currentMap) => {
        const nextMap = new Map(currentMap)
        const currentDetections = nextMap.get(detection.cameraId) ?? []
        nextMap.set(detection.cameraId, pruneDetections([...currentDetections, detection]))
        return nextMap
      })

      setState('live')
      setError(null)
    })

    return () => {
      unsubscribeCameraLifecycle()
      unsubscribeDetectionLifecycle()
      unsubscribeCameraError()
      unsubscribeDetectionError()
      unsubscribeMonitoring()
      unsubscribeDetection()
    }
  }, [])

  const zones = useMemo(
    () => buildZones(Array.from(cameras.values()), detectionsByCamera, activeStreamingIds),
    [activeStreamingIds, cameras, detectionsByCamera],
  )

  const resolvedState = useMemo<ConnectionState>(() => {
    if (state === 'error' || state === 'loading') {
      return state
    }

    if (zones.length === 0) {
      return 'empty'
    }

    return 'live'
  }, [state, zones.length])

  return {
    zones,
    state: resolvedState,
    error,
    isDelayed: delayMs > REALTIME_CONSTANTS.highLatencyThresholdMs,
    delayMs,
  }
}
