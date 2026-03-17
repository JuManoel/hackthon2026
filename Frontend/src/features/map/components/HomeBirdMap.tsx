import type { FC } from 'react'

import '@/shared/lib/leaflet/leaflet-default-icon'
import '@/features/map/map.css'
import { MAP_LABELS } from '@/features/map/constants/map.labels'
import { useBirdMapData } from '@/features/map/hooks/useBirdMapData'
import { BirdMapEmptyState } from '@/features/map/components/BirdMapEmptyState'
import { BirdMapLoadingState } from '@/features/map/components/BirdMapLoadingState'
import { BirdMapView } from '@/features/map/components/BirdMapView'

export const HomeBirdMap: FC = () => {
  const { zones, state, error, isDelayed, delayMs } = useBirdMapData()

  if (state === 'loading') {
    return <BirdMapLoadingState />
  }

  if (state === 'error') {
    return <BirdMapEmptyState message={error ?? MAP_LABELS.mapLoadError} />
  }

  if (state === 'empty') {
    return <BirdMapEmptyState message={MAP_LABELS.mapNoData} />
  }

  return <BirdMapView zones={zones} isDelayed={isDelayed} delayMs={delayMs} />
}
