import type { FC } from 'react'
import { Circle, CircleMarker, Popup } from 'react-leaflet'

import { MAP_CONSTANTS } from '../constants/map.constants'
import type { BirdZone } from '../types/map.types'
import { getZoneStyle } from '../utils/activity.utils'
import { buildBirdPoints } from '../utils/bird-points.utils'
import { BirdZonePopup } from './BirdZonePopup'

interface BirdZoneCircleProps {
  readonly zone: BirdZone
}

export const BirdZoneCircle: FC<BirdZoneCircleProps> = ({ zone }) => {
  const zoneStyle = getZoneStyle(zone.activityLevel)
  const birdPoints = buildBirdPoints(zone)

  return (
    <>
      {birdPoints.map((point, index) => (
        <CircleMarker
          key={`${zone.id}-bird-point-${index}`}
          center={[point.lat, point.lng]}
          radius={MAP_CONSTANTS.birdPointRadiusPixels}
          pathOptions={{
            fillColor: MAP_CONSTANTS.birdPointColor,
            fillOpacity: MAP_CONSTANTS.birdPointFillOpacity,
            stroke: false,
          }}
          interactive={false}
          className="bird-zone-point"
        />
      ))}

      <Circle
        center={[zone.center.lat, zone.center.lng]}
        radius={Math.min(zone.radiusMeters, MAP_CONSTANTS.maxZoneRadiusMeters)}
        pathOptions={{
          color: zoneStyle.color,
          fillColor: zoneStyle.color,
          fillOpacity: zoneStyle.fillOpacity,
          opacity: 0.42,
          weight: zoneStyle.weight,
        }}
        className={`bird-zone-circle bird-zone-circle--${zone.activityLevel}`}
      >
        <Popup>
          <BirdZonePopup zone={zone} />
        </Popup>
      </Circle>
    </>
  )
}
