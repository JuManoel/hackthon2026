const STORAGE_KEY = 'stdc_stream_presence_v1'
const EVENT_NAME = 'stdc-stream-presence-updated'
const PRESENCE_TTL_MS = 15000

type PresenceMap = Record<string, number>

function readPresenceMap(): PresenceMap {
  const raw = globalThis.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    const entries = Object.entries(parsed as Record<string, unknown>)
    const result: PresenceMap = {}

    entries.forEach(([cameraId, timestamp]) => {
      if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
        result[cameraId] = timestamp
      }
    })

    return result
  } catch {
    return {}
  }
}

function writePresenceMap(map: PresenceMap): void {
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  globalThis.dispatchEvent(new CustomEvent(EVENT_NAME))
}

function prunePresenceMap(map: PresenceMap): PresenceMap {
  const now = Date.now()
  const next: PresenceMap = {}

  Object.entries(map).forEach(([cameraId, timestamp]) => {
    if (now - timestamp <= PRESENCE_TTL_MS) {
      next[cameraId] = timestamp
    }
  })

  return next
}

export function touchCameraStreamPresence(cameraId: string): void {
  if (!cameraId) {
    return
  }

  const current = prunePresenceMap(readPresenceMap())
  current[cameraId] = Date.now()
  writePresenceMap(current)
}

export function clearCameraStreamPresence(cameraId: string): void {
  const current = prunePresenceMap(readPresenceMap())
  if (!current[cameraId]) {
    return
  }

  delete current[cameraId]
  writePresenceMap(current)
}

export function getActiveCameraStreamPresence(): Set<string> {
  const pruned = prunePresenceMap(readPresenceMap())
  if (Object.keys(pruned).length !== Object.keys(readPresenceMap()).length) {
    writePresenceMap(pruned)
  }

  return new Set(Object.keys(pruned))
}

export function subscribeCameraStreamPresence(listener: () => void): () => void {
  const handlePresenceEvent = (): void => {
    listener()
  }

  const handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY) {
      listener()
    }
  }

  globalThis.addEventListener(EVENT_NAME, handlePresenceEvent)
  globalThis.addEventListener('storage', handleStorageEvent)

  return () => {
    globalThis.removeEventListener(EVENT_NAME, handlePresenceEvent)
    globalThis.removeEventListener('storage', handleStorageEvent)
  }
}

export const STREAM_PRESENCE_TTL_MS = PRESENCE_TTL_MS
