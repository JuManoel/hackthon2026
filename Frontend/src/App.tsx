import type { FC } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { CameraDetailPage } from '@/features/home/pages/CameraDetailPage'
import { CamerasPage } from '@/features/home/pages/CamerasPage'
import { HomePage } from '@/features/home/pages/HomePage'
import { SettingsPage } from '@/features/home/pages/SettingsPage'

interface AppProps {
  readonly __noProps?: never
}

const routes = {
  home: '/home',
  settings: '/settings',
  cameras: '/cameras',
  login: '/login',
  register: '/register',
} as const

const App: FC<AppProps> = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={routes.home} replace />} />

      <Route element={<ProtectedRoute />}>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.settings} element={<SettingsPage />} />
        <Route path={routes.cameras} element={<CamerasPage />} />
        <Route path={`${routes.cameras}/:cameraId`} element={<CameraDetailPage />} />
      </Route>

      <Route path={routes.login} element={<LoginPage />} />
      <Route path={routes.register} element={<RegisterPage />} />
      <Route path="*" element={<Navigate to={routes.login} replace />} />
    </Routes>
  )
}

export default App
