import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'

import type { BirdZone } from '../types/map.types'
import { getBirdZones } from '../services/map.service'
import { useMockBirdMapFeed } from './useMockBirdMapFeed'

type UseBirdMapDataReturn = {
  zones: BirdZone[]
  isLoading: boolean
  error: string | null
}

export function useBirdMapData(): UseBirdMapDataReturn {
  const [zones, setZones] = useState<BirdZone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadZones = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        const loadedZones = await getBirdZones()

        if (!isMounted) {
          return
        }

        setZones(loadedZones)
      } catch {
        if (!isMounted) {
          return
        }

        setError('LOAD_MAP_DATA_ERROR')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadZones()

    return () => {
      isMounted = false
    }
  }, [])

  const handleZonesUpdate = useCallback<Dispatch<SetStateAction<BirdZone[]>>>((updater) => {
    setZones(updater)
  }, [])

  useMockBirdMapFeed({
    zones,
    isEnabled: !isLoading && !error,
    onZonesUpdate: handleZonesUpdate,
  })

  return {
    zones,
    isLoading,
    error,
  }
}
