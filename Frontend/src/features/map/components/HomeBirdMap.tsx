import type { FC } from 'react'

import '@/shared/lib/leaflet/leaflet-default-icon'
import '@/features/map/map.css'
import { MAP_LABELS } from '@/features/map/constants/map.labels'
import { useBirdMapData } from '@/features/map/hooks/useBirdMapData'
import { BirdMapEmptyState } from '@/features/map/components/BirdMapEmptyState'
import { BirdMapLoadingState } from '@/features/map/components/BirdMapLoadingState'
import { BirdMapView } from '@/features/map/components/BirdMapView'

export const HomeBirdMap: FC = () => {
  const { zones, isLoading, error } = useBirdMapData()

  if (isLoading) {
    return <BirdMapLoadingState />
  }

  if (error) {
    return <BirdMapEmptyState message={MAP_LABELS.mapLoadError} />
  }

  if (zones.length === 0) {
    return <BirdMapEmptyState message={MAP_LABELS.mapNoData} />
  }

  return <BirdMapView zones={zones} />
}
