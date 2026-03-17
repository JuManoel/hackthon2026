import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/ui/button/Button'
import { MAP_CONSTANTS } from '@/features/map/constants/map.constants'
import { MAP_LABELS } from '@/features/map/constants/map.labels'
import type { BirdZone } from '@/features/map/types/map.types'
import { formatRelativeDetection } from '@/features/map/utils/date.utils'
import { formatFrequencyPercentage } from '@/features/map/utils/frequency.utils'
import { CameraPopupCard, type CameraPopupDetailItem, type CameraPopupSummaryRow } from '@/features/map/components/CameraPopupCard'

interface BirdZonePopupProps {
  readonly zone: BirdZone
}

export const BirdZonePopup: FC<BirdZonePopupProps> = ({ zone }) => {
  const navigate = useNavigate()

  const handleViewCamera = (): void => {
    navigate(`/cameras/${zone.cameraId}`)
  }

  const summaryRows: readonly CameraPopupSummaryRow[] = [
    {
      label: `${MAP_LABELS.lastDetection}:`,
      value: formatRelativeDetection(zone.lastDetectionAt),
      tone: 'normal',
      italic: true,
    },
    {
      label: `${MAP_LABELS.totalDetections}:`,
      value: String(zone.totalDetections),
      tone: 'accent',
    },
  ]

  const detailItems: readonly CameraPopupDetailItem[] = zone.speciesStats
    .slice(0, MAP_CONSTANTS.maxSpeciesInPopup)
    .map((speciesStat) => ({
      id: speciesStat.speciesId,
      primaryText: speciesStat.commonName,
      secondaryText: formatFrequencyPercentage(speciesStat.frequency),
    }))

  return (
    <CameraPopupCard
      title={zone.cameraName}
      subtitle={`${zone.region}${MAP_LABELS.locationSeparator}${zone.direction}`}
      summaryRows={summaryRows}
      detailsTitle={MAP_LABELS.detectedSpecies}
      detailItems={detailItems}
      action={
        <Button variant="primary" onClick={handleViewCamera}>
          {MAP_LABELS.viewCamera}
        </Button>
      }
    />
  )
}
