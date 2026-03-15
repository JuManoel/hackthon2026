import type { FC } from 'react'

import { Spinner } from '../../../components/Spinner'
import { MAP_LABELS } from '../constants/map.labels'

export const BirdMapLoadingState: FC = () => {
  return (
    <div className="bird-map-state bird-map-state--loading">
      <Spinner ariaHidden={false} ariaLabel={MAP_LABELS.mapLoadingAria} size="lg" tone="dark" />
    </div>
  )
}
