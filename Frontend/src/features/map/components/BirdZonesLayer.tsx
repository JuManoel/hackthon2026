import type { FC } from 'react'

import type { BirdZone } from '@/features/map/types/map.types'
import { BirdZoneCircle } from '@/features/map/components/BirdZoneCircle'

interface BirdZonesLayerProps {
  readonly zones: BirdZone[]
}

export const BirdZonesLayer: FC<BirdZonesLayerProps> = ({ zones }) => {
  return (
    <>
      {zones.map((zone) => (
        <BirdZoneCircle key={zone.id} zone={zone} />
      ))}
    </>
  )
}
