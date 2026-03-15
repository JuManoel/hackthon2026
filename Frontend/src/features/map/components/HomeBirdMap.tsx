import type { FC } from 'react'

import '../../../shared/lib/leaflet/leaflet-default-icon'
import '../map.css'
import { MAP_LABELS } from '../constants/map.labels'
import { useBirdMapData } from '../hooks/useBirdMapData'
import { BirdMapEmptyState } from './BirdMapEmptyState'
import { BirdMapLoadingState } from './BirdMapLoadingState'
import { BirdMapView } from './BirdMapView'

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
