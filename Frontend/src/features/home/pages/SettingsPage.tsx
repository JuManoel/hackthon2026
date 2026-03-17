import { useEffect, type FC } from 'react'

import { labels } from '@/constants/labels'
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { HomeShell } from '@/features/home/components/HomeShell'
import { Card } from '@/shared/ui/card/Card'

interface SettingsPageProps {
  readonly __noProps?: never
}

export const SettingsPage: FC<SettingsPageProps> = () => {
  const { user, logout } = useAuth()

  const translatedRole =
    user?.role === 'ADMIN'
      ? labels.roleAdministrator
      : user?.role === 'GUIDE'
        ? labels.roleTourGuide
        : user?.role ?? '-'

  useEffect(() => {
    document.title = labels.settingsPageTitle
  }, [])

  return (
    <HomeShell activeTab="settings">
      <div className="settings-page-wrap">
        <h1 className="settings-page-title">{labels.settingsHeading}</h1>

        <Card className="settings-card">
          <h2 className="settings-card-title">{labels.settingsProfileTitle}</h2>
          <dl className="settings-profile-grid">
            <div className="settings-profile-item">
              <dt>{labels.settingsUsernameLabel}</dt>
              <dd>{user?.username ?? '-'}</dd>
            </div>
            <div className="settings-profile-item">
              <dt>{labels.settingsRoleLabel}</dt>
              <dd>{translatedRole}</dd>
            </div>
          </dl>
        </Card>

        <Card className="settings-card">
          <h2 className="settings-card-title">{labels.settingsActionsTitle}</h2>
          <div className="settings-actions">
            <AuthSubmitButton
              label={labels.settingsLogoutButton}
              loadingLabel={labels.settingsLogoutButton}
              onClick={logout}
              type="button"
            />
          </div>
        </Card>
      </div>
    </HomeShell>
  )
}
