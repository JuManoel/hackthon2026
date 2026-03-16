import { Camera, Eye, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState, type FC } from 'react'

import { labels } from '../../../constants/labels'
import { Badge } from '../../../shared/ui/badge/Badge'
import { Button } from '../../../shared/ui/button/Button'
import { Card } from '../../../shared/ui/card/Card'
import type { CameraListItem } from '../types/camera.types'

interface CameraListProps {
  readonly cameras: readonly CameraListItem[]
  readonly isAdmin: boolean
  readonly isBusy?: boolean
  readonly onEdit: (cameraId: string) => void
  readonly onDelete: (cameraId: string) => void
}

interface CameraPreviewProps {
  readonly cameraName: string
  readonly previewUrl?: string | null
}

const CameraPreview: FC<CameraPreviewProps> = ({ cameraName, previewUrl }) => {
  const [hasImageError, setHasImageError] = useState(false)
  const showImage = Boolean(previewUrl) && !hasImageError

  if (showImage) {
    return (
      <img
        src={previewUrl ?? undefined}
        alt={cameraName}
        className="camera-list-item-preview-image"
        onError={() => {
          setHasImageError(true)
        }}
      />
    )
  }

  return (
    <div className="camera-list-item-preview-fallback" aria-hidden="true">
      <Camera size={20} />
    </div>
  )
}

export const CameraList: FC<CameraListProps> = ({ cameras, isAdmin, isBusy = false, onEdit, onDelete }) => {
  const countLabel = useMemo(() => labels.camerasCountLabel(cameras.length), [cameras.length])

  return (
    <Card className="cameras-list-card">
      <div className="cameras-list-header">
        <h2 className="cameras-list-title">{labels.camerasListTitle}</h2>
        <Badge label={countLabel} />
      </div>

      <ul className="cameras-list" aria-label={labels.camerasListAria}>
        {cameras.map((camera) => (
          <li key={camera.id} className="camera-list-item">
            <div className="camera-list-item-preview">
              <CameraPreview cameraName={camera.name} previewUrl={camera.previewUrl} />
            </div>

            <div className="camera-list-item-info">
              <p className="camera-list-item-title">{camera.name}</p>
              <p className="camera-list-item-subtitle">{`${camera.region} · ${camera.address}`}</p>
            </div>

            <div className="camera-list-item-actions">
              <Button
                type="button"
                title={labels.camerasViewDisabledTooltip}
                disabled
                aria-label={`${labels.camerasViewAction} ${camera.name}`}
              >
                <Eye size={15} />
              </Button>

              {isAdmin ? (
                <>
                  <Button
                    type="button"
                    disabled={isBusy}
                    aria-label={`${labels.camerasEditAction} ${camera.name}`}
                    onClick={() => {
                      onEdit(camera.id)
                    }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    type="button"
                    disabled={isBusy}
                    aria-label={`${labels.camerasDeleteAction} ${camera.name}`}
                    onClick={() => {
                      onDelete(camera.id)
                    }}
                  >
                    <Trash2 size={15} />
                  </Button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
