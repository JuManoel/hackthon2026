import type { FC } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { labels } from '@/constants/labels'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Spinner } from '@/components/Spinner'

export const ProtectedRoute: FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main
        aria-label={labels.authLoadingAria}
        style={{
          minHeight: '100svh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--color-neutral-100)',
        }}
      >
        <Spinner tone="dark" size="lg" ariaHidden={false} ariaLabel={labels.authLoadingAria} />
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
