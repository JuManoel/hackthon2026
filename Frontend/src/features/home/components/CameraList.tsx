import { Camera, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FC } from 'react'

import { labels } from '@/constants/labels'
import { Badge } from '@/shared/ui/badge/Badge'
import { Button } from '@/shared/ui/button/Button'
import { Card } from '@/shared/ui/card/Card'
import type { CameraListItem } from '@/features/home/types/camera.types'

const DESKTOP_BREAKPOINT_QUERY = '(min-width: 768px)'
const MOBILE_TITLE_MAX_LENGTH = 5
const MOBILE_DESCRIPTION_MAX_LENGTH = 10
const DESKTOP_DESCRIPTION_MAX_LENGTH = 120

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength)}...`
}

interface CameraListProps {
  readonly cameras: readonly CameraListItem[]
  readonly isAdmin: boolean
  readonly isBusy?: boolean
  readonly onCreate?: () => void
  readonly onView: (cameraId: string) => void
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

export const CameraList: FC<CameraListProps> = ({
  cameras,
  isAdmin,
  isBusy = false,
  onCreate,
  onView,
  onEdit,
  onDelete,
}) => {
  const countLabel = useMemo(() => labels.camerasCountLabel(cameras.length), [cameras.length])
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof globalThis.matchMedia !== 'function') {
      return false
    }

    return globalThis.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches
  })

  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') {
      return
    }

    const mediaQuery = globalThis.matchMedia(DESKTOP_BREAKPOINT_QUERY)

    const handleMediaQueryChange = (event: MediaQueryListEvent): void => {
      setIsDesktop(event.matches)
    }

    setIsDesktop(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleMediaQueryChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange)
    }
  }, [])

  const descriptionMaxLength = isDesktop ? DESKTOP_DESCRIPTION_MAX_LENGTH : MOBILE_DESCRIPTION_MAX_LENGTH

  return (
    <Card className="cameras-list-card">
      <div className="cameras-list-header">
        <h2 className="cameras-list-title">{labels.camerasListTitle}</h2>
        <div className="cameras-list-header-actions">
          <Badge label={countLabel} />
          {isAdmin ? (
            <Button
              type="button"
              variant="primary"
              disabled={isBusy}
              title={labels.camerasCreateAction}
              aria-label={labels.camerasCreateAction}
              onClick={onCreate}
            >
              <Plus size={15} />
            </Button>
          ) : null}
        </div>
      </div>

      <ul className="cameras-list" aria-label={labels.camerasListAria}>
        {cameras.map((camera) => (
          <li key={camera.id} className="camera-list-item">
            <div className="camera-list-item-preview">
              <CameraPreview cameraName={camera.name} previewUrl={camera.previewUrl} />
            </div>

            <div className="camera-list-item-info">
              <p className="camera-list-item-title">
                {isDesktop ? camera.name : truncateText(camera.name, MOBILE_TITLE_MAX_LENGTH)}
              </p>
              <p className="camera-list-item-subtitle">
                {truncateText(`${camera.region} · ${camera.address}`, descriptionMaxLength)}
              </p>
            </div>

            <div className="camera-list-item-actions">
              <Button
                type="button"
                aria-label={`${labels.camerasViewAction} ${camera.name}`}
                onClick={() => onView(camera.id)}
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
