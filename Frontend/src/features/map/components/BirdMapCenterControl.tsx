import type { FC } from 'react'
import { LocateFixed } from 'lucide-react'
import { useMap } from 'react-leaflet'

import { Button } from '@/shared/ui/button/Button'
import { MAP_CONSTANTS } from '@/features/map/constants/map.constants'
import { MAP_LABELS } from '@/features/map/constants/map.labels'

export const BirdMapCenterControl: FC = () => {
  const map = useMap()

  const handleCenterOnCaldas = (): void => {
    map.flyTo([MAP_CONSTANTS.caldasCenter.lat, MAP_CONSTANTS.caldasCenter.lng], MAP_CONSTANTS.defaultZoom, {
      duration: 0.8,
    })
  }

  return (
    <div className="bird-map-center-control" aria-label={MAP_LABELS.mapCenterControlAria}>
      <Button type="button" onClick={handleCenterOnCaldas} aria-label={MAP_LABELS.centerOnCaldas} title={MAP_LABELS.centerOnCaldas}>
        <LocateFixed size={16} aria-hidden="true" focusable="false" />
      </Button>
    </div>
  )
}
