import { useEffect, type FC } from 'react'

import { labels } from '../../../constants/labels'
import { useAuth } from '../../auth/hooks/useAuth'
import { HomeShell } from '../components/HomeShell'
import { Card } from '../../../shared/ui/card/Card'
import { Button } from '../../../shared/ui/button/Button'

interface CamerasPageProps {
  readonly __noProps?: never
}

export const CamerasPage: FC<CamerasPageProps> = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    document.title = labels.camerasPageTitle
  }, [])

  return (
    <HomeShell activeTab="cameras">
      <div className="cameras-page-wrap">
        <Card className="cameras-management-card">
          <h1 className="cameras-management-title">{labels.camerasManagementTitle}</h1>
          <p className="cameras-management-description">
            {isAdmin ? labels.camerasAdminDescription : labels.camerasGuideDescription}
          </p>

          {isAdmin ? (
            <div className="cameras-management-actions">
              <Button variant="primary">{labels.camerasCreateAction}</Button>
              <Button>{labels.camerasEditAction}</Button>
              <Button>{labels.camerasDeleteAction}</Button>
            </div>
          ) : null}
        </Card>
      </div>
    </HomeShell>
  )
}
