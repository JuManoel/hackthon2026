import type { FC } from 'react'

import type { BirdZone } from '../types/map.types'
import { BirdZoneCircle } from './BirdZoneCircle'

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
