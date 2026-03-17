import { useEffect, useMemo, useState } from 'react'

import { cameraSocketAdapter } from '@/features/realtime/adapters/instances'
import {
  getActiveCameraStreamPresence,
  subscribeCameraStreamPresence,
} from '@/features/realtime/services/streaming-presence.service'

export function useCameraStreamingAvailability(): ReadonlySet<string> {
  const [monitoringActiveCameraIds, setMonitoringActiveCameraIds] = useState<string[]>([])
  const [presenceActiveCameraIds, setPresenceActiveCameraIds] = useState<string[]>(() =>
    Array.from(getActiveCameraStreamPresence()),
  )

  useEffect(() => {
    cameraSocketAdapter.connect()

    const unsubscribeMonitoring = cameraSocketAdapter.onMessage((snapshot) => {
      setMonitoringActiveCameraIds(snapshot.activeCameraIds)
    })

    const syncPresence = (): void => {
      setPresenceActiveCameraIds(Array.from(getActiveCameraStreamPresence()))
    }

    const unsubscribePresence = subscribeCameraStreamPresence(syncPresence)
    const interval = globalThis.setInterval(syncPresence, 3000)

    syncPresence()

    return () => {
      globalThis.clearInterval(interval)
      unsubscribePresence()
      unsubscribeMonitoring()
    }
  }, [])

  return useMemo(() => {
    const merged = new Set<string>()
    monitoringActiveCameraIds.forEach((id) => {
      merged.add(id)
    })
    presenceActiveCameraIds.forEach((id) => {
      merged.add(id)
    })

    return merged
  }, [monitoringActiveCameraIds, presenceActiveCameraIds])
}
