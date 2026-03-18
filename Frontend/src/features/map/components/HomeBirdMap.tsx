import type { FC } from 'react'

import '@/shared/lib/leaflet/leaflet-default-icon'
import '@/features/map/map.css'
import { useBirdMapData } from '@/features/map/hooks/useBirdMapData'
import { BirdMapLoadingState } from '@/features/map/components/BirdMapLoadingState'
import { BirdMapView } from '@/features/map/components/BirdMapView'

export const HomeBirdMap: FC = () => {
  const { zones, state, isDelayed, delayMs, socketState, detectedBirds } = useBirdMapData()

  if (state === 'loading') {
    return <BirdMapLoadingState />
  }

  if (state === 'error' && zones.length === 0) {
    return (
      <BirdMapView
        zones={[]}
        isDelayed={isDelayed}
        delayMs={delayMs}
        socketState={socketState}
        detectedBirds={detectedBirds}
      />
    )
  }

  return (
    <BirdMapView
      zones={zones}
      isDelayed={isDelayed}
      delayMs={delayMs}
      socketState={socketState}
      detectedBirds={detectedBirds}
    />
  )
}
