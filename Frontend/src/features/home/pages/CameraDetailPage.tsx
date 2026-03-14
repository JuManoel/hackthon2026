import { useEffect, type FC } from 'react'
import { useParams } from 'react-router-dom'

import { labels } from '../../../constants/labels'
import { HomeShell } from '../components/HomeShell'

interface CameraDetailPageProps {
  readonly __noProps?: never
}

export const CameraDetailPage: FC<CameraDetailPageProps> = () => {
  const { cameraId } = useParams<{ cameraId: string }>()

  useEffect(() => {
    document.title = labels.cameraDetailPageTitle
  }, [])

  return (
    <HomeShell activeTab="cameras">
      <div className="home-camera-detail-placeholder">
        <p className="home-camera-detail-title">{labels.cameraDetailPlaceholderTitle}</p>
        <p className="home-camera-detail-subtitle">{`${labels.cameraDetailPlaceholderPrefix} ${cameraId ?? labels.cameraDetailUnknownCamera}`}</p>
      </div>
    </HomeShell>
  )
}
