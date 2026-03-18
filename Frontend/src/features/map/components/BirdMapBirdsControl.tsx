import type { FC } from 'react'
import { Locate } from 'lucide-react'
import { useMap } from 'react-leaflet'

import { Button } from '@/shared/ui/button/Button'
import { MAP_LABELS } from '@/features/map/constants/map.labels'
import type { BirdZone } from '@/features/map/types/map.types'

interface BirdMapBirdsControlProps {
  readonly zones: BirdZone[]
}

export const BirdMapBirdsControl: FC<BirdMapBirdsControlProps> = ({ zones }) => {
  const map = useMap()

  const zonesWithDetections = zones.filter((zone) => zone.totalDetections > 0)
  const hasBirdZones = zonesWithDetections.length > 0

  const handleCenterOnBirds = (): void => {
    if (!hasBirdZones) {
      return
    }

    const points = zonesWithDetections.map((zone) => [zone.center.lat, zone.center.lng] as [number, number])
    if (points.length === 1) {
      const [lat, lng] = points[0]
      map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.8 })
      return
    }

    map.fitBounds(points, { padding: [50, 50], maxZoom: 14 })
  }

  return (
    <div className="bird-map-birds-control" aria-label={MAP_LABELS.mapBirdsControlAria}>
      <Button
        type="button"
        onClick={handleCenterOnBirds}
        disabled={!hasBirdZones}
        aria-label={MAP_LABELS.centerOnBirds}
        title={MAP_LABELS.centerOnBirds}
      >
        <Locate size={16} aria-hidden="true" focusable="false" />
      </Button>
    </div>
  )
}

