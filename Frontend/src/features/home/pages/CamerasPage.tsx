import { useCallback, useEffect, useMemo, useState, type FC, type SyntheticEvent } from 'react'

import { labels } from '../../../constants/labels'
import { Spinner } from '../../../components/Spinner'
import { getStoredToken } from '../../auth/services/auth.service'
import { useAuth } from '../../auth/hooks/useAuth'
import { HomeShell } from '../components/HomeShell'
import { Card } from '../../../shared/ui/card/Card'
import { Button } from '../../../shared/ui/button/Button'
import {
  createCameraRequest,
  deleteCameraRequest,
  getCameraErrorLabel,
  listCamerasRequest,
  mapCameraErrorCode,
  toCameraListItem,
  updateCameraRequest,
} from '../services/cameras.service'
import type { CameraDto, CameraUpsertPayload } from '../types/camera.types'
import { CameraList } from '../components/CameraList'
import { CameraFormField } from '../components/CameraFormField'

interface CamerasPageProps {
  readonly __noProps?: never
}

type CameraFormMode = 'create' | 'edit'

interface CameraFormState {
  readonly name: string
  readonly angleXY: string
  readonly angleXZ: string
  readonly region: string
  readonly address: string
  readonly latitude: string
  readonly longitude: string
  readonly height: string
}

const EMPTY_CAMERA_FORM: CameraFormState = {
  name: '',
  angleXY: '',
  angleXZ: '',
  region: '',
  address: '',
  latitude: '',
  longitude: '',
  height: '',
}

function toCameraFormState(camera: CameraDto): CameraFormState {
  return {
    name: camera.name,
    angleXY: String(camera.angleXY),
    angleXZ: String(camera.angleXZ),
    region: camera.location.region,
    address: camera.location.address,
    latitude: String(camera.location.latitude),
    longitude: String(camera.location.longitude),
    height: String(camera.location.height),
  }
}

function toCameraPayload(state: CameraFormState): CameraUpsertPayload | null {
  const angleXY = Number(state.angleXY)
  const angleXZ = Number(state.angleXZ)
  const latitude = Number(state.latitude)
  const longitude = Number(state.longitude)
  const height = Number(state.height)

  if (
    !state.name.trim() ||
    !state.region.trim() ||
    !state.address.trim() ||
    !Number.isFinite(angleXY) ||
    !Number.isFinite(angleXZ) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(height)
  ) {
    return null
  }

  return {
    name: state.name.trim(),
    angleXY,
    angleXZ,
    location: {
      region: state.region.trim(),
      address: state.address.trim(),
      latitude,
      longitude,
      height,
    },
  }
}

export const CamerasPage: FC<CamerasPageProps> = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [cameras, setCameras] = useState<readonly CameraDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<CameraFormMode | null>(null)
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null)
  const [formState, setFormState] = useState<CameraFormState>(EMPTY_CAMERA_FORM)
  const isFormVisible = isAdmin && formMode !== null

  const cameraListItems = useMemo(() => cameras.map(toCameraListItem), [cameras])

  const loadCameras = useCallback(async (): Promise<void> => {
    const token = getStoredToken()

    if (!token) {
      setError(labels.authSessionExpired)
      setIsLoading(false)
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await listCamerasRequest(token)
      setCameras(response)
    } catch (requestError) {
      setError(getCameraErrorLabel(mapCameraErrorCode(requestError)))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleOpenCreateForm = useCallback(() => {
    setFormMode('create')
    setEditingCameraId(null)
    setFormError(null)
    setFormState(EMPTY_CAMERA_FORM)
  }, [])

  const handleOpenEditForm = useCallback(
    (cameraId: string) => {
      if (!isAdmin) {
        return
      }

      const cameraToEdit = cameras.find((camera) => camera.id === cameraId)

      if (!cameraToEdit) {
        setError(labels.camerasErrorNotFound)
        return
      }

      setFormMode('edit')
      setEditingCameraId(cameraToEdit.id)
      setFormError(null)
      setFormState(toCameraFormState(cameraToEdit))
    },
    [cameras, isAdmin],
  )

  const handleDeleteCamera = useCallback(
    async (cameraId: string) => {
      if (!isAdmin || isMutating) {
        return
      }

      if (!globalThis.confirm(labels.camerasDeleteConfirm)) {
        return
      }

      const token = getStoredToken()

      if (!token) {
        setError(labels.authSessionExpired)
        return
      }

      setError(null)
      setIsMutating(true)

      try {
        await deleteCameraRequest(token, cameraId)
        setCameras((currentCameras) => currentCameras.filter((camera) => camera.id !== cameraId))

        if (editingCameraId === cameraId) {
          setFormMode(null)
          setEditingCameraId(null)
          setFormState(EMPTY_CAMERA_FORM)
        }
      } catch (requestError) {
        setError(getCameraErrorLabel(mapCameraErrorCode(requestError)))
      } finally {
        setIsMutating(false)
      }
    },
    [editingCameraId, isAdmin, isMutating],
  )

  const handleFormChange = useCallback(
    (field: keyof CameraFormState, value: string) => {
      setFormState((currentState) => ({
        ...currentState,
        [field]: value,
      }))
    },
    [],
  )

  const handleFormCancel = useCallback(() => {
    setFormMode(null)
    setEditingCameraId(null)
    setFormError(null)
    setFormState(EMPTY_CAMERA_FORM)
  }, [])

  const handleFormSubmit = useCallback(
    async (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!isAdmin || !formMode || isMutating) {
        return
      }

      const payload = toCameraPayload(formState)

      if (!payload) {
        setFormError(labels.camerasFormInvalid)
        return
      }

      const token = getStoredToken()

      if (!token) {
        setError(labels.authSessionExpired)
        return
      }

      setFormError(null)
      setError(null)
      setIsMutating(true)

      try {
        if (formMode === 'create') {
          await createCameraRequest(token, payload)
        } else if (editingCameraId) {
          await updateCameraRequest(token, editingCameraId, payload)
        }

        setFormMode(null)
        setEditingCameraId(null)
        setFormState(EMPTY_CAMERA_FORM)
        await loadCameras()
      } catch (requestError) {
        setFormError(getCameraErrorLabel(mapCameraErrorCode(requestError)))
      } finally {
        setIsMutating(false)
      }
    },
    [editingCameraId, formMode, formState, isAdmin, isMutating, loadCameras],
  )

  useEffect(() => {
    document.title = labels.camerasPageTitle
  }, [])

  useEffect(() => {
    void loadCameras()
  }, [loadCameras])

  return (
    <HomeShell activeTab="cameras" contentClassName="home-shell-content--top">
      <div className="cameras-page-wrap">

        {!isFormVisible ? (
          <>
            <header className="cameras-page-header cameras-page-header--list">
              <h1 className="cameras-page-title">{labels.camerasManagementTitle}</h1>
            </header>

            <div className="cameras-page-summary">
              <p className="cameras-page-description">
                {isAdmin ? labels.camerasAdminDescription : labels.camerasGuideDescription}
              </p>
              {isAdmin ? (
                <div className="cameras-page-actions">
                  <Button type="button" variant="primary" disabled={isMutating} onClick={handleOpenCreateForm}>
                    {labels.camerasCreateAction}
                  </Button>
                </div>
              ) : null}
            </div>

            {error ? (
              <Card className="cameras-feedback-card cameras-feedback-card--error">
                <p className="cameras-feedback-text">{error}</p>
                <Button type="button" disabled={isLoading || isMutating} onClick={() => void loadCameras()}>
                  {labels.camerasRetryAction}
                </Button>
              </Card>
            ) : null}

            {isLoading ? (
              <Card className="cameras-feedback-card">
                <div className="cameras-loading-wrap" aria-label={labels.camerasLoaderAria}>
                  <Spinner size="md" tone="dark" />
                  <p className="cameras-feedback-text">
                    {isMutating ? labels.camerasRefreshingData : labels.camerasLoadingData}
                  </p>
                </div>
              </Card>
            ) : null}

            {!isLoading && cameraListItems.length > 0 ? (
              <CameraList
                cameras={cameraListItems}
                isAdmin={isAdmin}
                isBusy={isMutating}
                onEdit={handleOpenEditForm}
                onDelete={(cameraId) => {
                  void handleDeleteCamera(cameraId)
                }}
              />
            ) : null}

            {!isLoading && !error && cameraListItems.length === 0 ? (
              <Card className="cameras-feedback-card cameras-feedback-card--empty">
                <p className="cameras-feedback-title">{labels.camerasEmptyTitle}</p>
                <p className="cameras-feedback-text">{labels.camerasEmptyDescription}</p>
              </Card>
            ) : null}
          </>
        ) : null}

        {isAdmin && formMode ? (
          <>
            <header className="cameras-page-header cameras-page-header--form">
              <span aria-hidden="true" />
              <h2 className="cameras-page-title">
                {formMode === 'create' ? labels.camerasCreateFormTitle : labels.camerasEditFormTitle}
              </h2>
              <div className="cameras-page-header-end">
                <Button type="button" disabled={isMutating} onClick={handleFormCancel}>
                  {labels.camerasFormCancel}
                </Button>
              </div>
            </header>

            <Card className="cameras-form-card">
              <form className="cameras-form-grid" onSubmit={(event) => void handleFormSubmit(event)}>
                <CameraFormField
                  id="camera-name"
                  label={labels.camerasFormNameLabel}
                  value={formState.name}
                  placeholder={labels.camerasFormNamePlaceholder}
                  onChange={(event) => {
                    handleFormChange('name', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-angle-xy"
                  label={labels.camerasFormAngleXYLabel}
                  type="number"
                  step="any"
                  value={formState.angleXY}
                  onChange={(event) => {
                    handleFormChange('angleXY', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-angle-xz"
                  label={labels.camerasFormAngleXZLabel}
                  type="number"
                  step="any"
                  value={formState.angleXZ}
                  onChange={(event) => {
                    handleFormChange('angleXZ', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-region"
                  label={labels.camerasFormRegionLabel}
                  value={formState.region}
                  placeholder={labels.camerasFormRegionPlaceholder}
                  onChange={(event) => {
                    handleFormChange('region', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-address"
                  label={labels.camerasFormAddressLabel}
                  value={formState.address}
                  placeholder={labels.camerasFormAddressPlaceholder}
                  onChange={(event) => {
                    handleFormChange('address', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-latitude"
                  label={labels.camerasFormLatitudeLabel}
                  type="number"
                  step="any"
                  value={formState.latitude}
                  onChange={(event) => {
                    handleFormChange('latitude', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-longitude"
                  label={labels.camerasFormLongitudeLabel}
                  type="number"
                  step="any"
                  value={formState.longitude}
                  onChange={(event) => {
                    handleFormChange('longitude', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-height"
                  label={labels.camerasFormHeightLabel}
                  type="number"
                  step="any"
                  value={formState.height}
                  onChange={(event) => {
                    handleFormChange('height', event.target.value)
                  }}
                />

                {formError ? <p className="cameras-form-error">{formError}</p> : null}

                <div className="cameras-form-actions">
                  <Button type="submit" variant="primary" disabled={isMutating}>
                    {formMode === 'create' ? labels.camerasFormSubmitCreate : labels.camerasFormSubmitEdit}
                  </Button>
                </div>
              </form>
            </Card>
          </>
        ) : null}

      </div>
    </HomeShell>
  )
}
