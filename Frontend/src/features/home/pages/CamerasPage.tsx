import { useCallback, useEffect, useMemo, useState, type FC, type SyntheticEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CameraOff, ShieldAlert } from 'lucide-react'

import { labels } from '@/constants/labels'
import { Spinner } from '@/components/Spinner'
import { getStoredToken } from '@/features/auth/services/auth.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { HomeShell } from '@/features/home/components/HomeShell'
import { Card } from '@/shared/ui/card/Card'
import { Button } from '@/shared/ui/button/Button'
import {
  createCameraRequest,
  deleteCameraRequest,
  getCameraErrorLabel,
  listCamerasRequest,
  mapCameraErrorCode,
  toCameraListItem,
  updateCameraRequest,
} from '@/features/home/services/cameras.service'
import type { CameraDto, CameraUpsertPayload } from '@/features/home/types/camera.types'
import { CameraList } from '@/features/home/components/CameraList'
import { CameraFormField } from '@/features/home/components/CameraFormField'

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

type CameraFormFieldKey = keyof CameraFormState
type CameraFormErrors = Partial<Record<CameraFormFieldKey, string>>

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

const DESKTOP_BREAKPOINT_QUERY = '(min-width: 768px)'
const MOBILE_CAMERA_PAGE_SIZE = 6
const DESKTOP_CAMERA_PAGE_SIZE = 4

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function parseFiniteNumber(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function validateRequiredText(value: string): string | undefined {
  if (isBlank(value)) {
    return labels.camerasFormRequiredField
  }

  return undefined
}

function validateRequiredNumber(value: string): string | undefined {
  const parsed = parseFiniteNumber(value)

  if (parsed === null) {
    return isBlank(value) ? labels.camerasFormRequiredField : labels.camerasFormNumericInvalid
  }

  return undefined
}

function validateNumberInRange(value: string, min: number, max: number, rangeError: string): string | undefined {
  const requiredNumberError = validateRequiredNumber(value)

  if (requiredNumberError) {
    return requiredNumberError
  }

  const parsed = Number(value)

  if (parsed < min || parsed > max) {
    return rangeError
  }

  return undefined
}

function validateCameraForm(state: CameraFormState): CameraFormErrors {
  const rawErrors: CameraFormErrors = {
    name: validateRequiredText(state.name),
    angleXY: validateNumberInRange(state.angleXY, 0, 360, labels.camerasFormAngleRange),
    angleXZ: validateNumberInRange(state.angleXZ, 0, 360, labels.camerasFormAngleRange),
    region: validateRequiredText(state.region),
    address: validateRequiredText(state.address),
    latitude: validateNumberInRange(state.latitude, -90, 90, labels.camerasFormLatitudeRange),
    longitude: validateNumberInRange(state.longitude, -180, 180, labels.camerasFormLongitudeRange),
    height: validateRequiredNumber(state.height),
  }

  return Object.fromEntries(
    Object.entries(rawErrors).filter(([, message]) => typeof message === 'string' && message.length > 0),
  ) as CameraFormErrors
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
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [cameras, setCameras] = useState<readonly CameraDto[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<CameraFormMode | null>(null)
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null)
  const [formState, setFormState] = useState<CameraFormState>(EMPTY_CAMERA_FORM)
  const [formErrors, setFormErrors] = useState<CameraFormErrors>({})
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof globalThis.matchMedia !== 'function') {
      return false
    }

    return globalThis.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches
  })
  const isFormVisible = isAdmin && formMode !== null
  const pageSize = isDesktop ? DESKTOP_CAMERA_PAGE_SIZE : MOBILE_CAMERA_PAGE_SIZE

  const cameraListItems = useMemo(() => cameras.map(toCameraListItem), [cameras])

  const loadCameras = useCallback(async (page = currentPage): Promise<void> => {
    const token = getStoredToken()

    if (!token) {
      setError(labels.authSessionExpired)
      setIsLoading(false)
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await listCamerasRequest(token, {
        page,
        size: pageSize,
      })

      if (response.totalPages > 0 && page > response.totalPages - 1) {
        setCurrentPage(response.totalPages - 1)
        return
      }

      setCameras(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (requestError) {
      setError(getCameraErrorLabel(mapCameraErrorCode(requestError)))
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize])

  const handleOpenCreateForm = useCallback(() => {
    setFormMode('create')
    setEditingCameraId(null)
    setFormError(null)
    setFormErrors({})
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
      setFormErrors({})
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
        await loadCameras(currentPage)

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
    [currentPage, editingCameraId, isAdmin, isMutating, loadCameras],
  )

  const handleFormChange = useCallback(
    (field: keyof CameraFormState, value: string) => {
      setFormState((currentState) => ({
        ...currentState,
        [field]: value,
      }))

      setFormErrors((currentErrors) => {
        if (!currentErrors[field]) {
          return currentErrors
        }

        const nextErrors = { ...currentErrors }
        delete nextErrors[field]
        return nextErrors
      })

      setFormError(null)
    },
    [],
  )

  const handleFormCancel = useCallback(() => {
    setFormMode(null)
    setEditingCameraId(null)
    setFormError(null)
    setFormErrors({})
    setFormState(EMPTY_CAMERA_FORM)
  }, [])

  const handleFormSubmit = useCallback(
    async (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!isAdmin || !formMode || isMutating) {
        return
      }

      const validationErrors = validateCameraForm(formState)
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors)
        setFormError(labels.camerasFormInvalid)
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

      setFormErrors({})
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
        setFormErrors({})
        setFormState(EMPTY_CAMERA_FORM)
        await loadCameras(currentPage)
      } catch (requestError) {
        setFormError(getCameraErrorLabel(mapCameraErrorCode(requestError)))
      } finally {
        setIsMutating(false)
      }
    },
    [currentPage, editingCameraId, formMode, formState, isAdmin, isMutating, loadCameras],
  )

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((page) => Math.max(0, page - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((page) => {
      if (totalPages === 0) {
        return page
      }

      return Math.min(totalPages - 1, page + 1)
    })
  }, [totalPages])

  useEffect(() => {
    document.title = labels.camerasPageTitle
  }, [])

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

  useEffect(() => {
    setCurrentPage(0)
  }, [pageSize])

  useEffect(() => {
    void loadCameras(currentPage)
  }, [currentPage, loadCameras])

  const handleViewCamera = useCallback((cameraId: string) => {
    navigate(`/cameras/${cameraId}`)
  }, [navigate])

  return (
    <HomeShell activeTab="cameras" contentClassName="home-shell-content--top">
      <div className="cameras-page-wrap">

        {isFormVisible ? null : (
          <>
            <header className="cameras-page-intro">
              <h1 className="cameras-page-title">{labels.camerasManagementTitle}</h1>
            </header>

            <div className="cameras-page-content">
              {error ? (
                <Card className="cameras-feedback-card cameras-feedback-card--error">
                  <span className="cameras-feedback-icon" aria-hidden="true">
                    <ShieldAlert size={44} strokeWidth={1.8} />
                  </span>
                  <p className="cameras-feedback-text">{error}</p>
                  <Button type="button" disabled={isLoading || isMutating} onClick={() => void loadCameras()}>
                    {labels.camerasRetryAction}
                  </Button>
                </Card>
              ) : null}

              {isLoading ? (
                <Card className="cameras-feedback-card cameras-feedback-card--loading">
                  <div className="cameras-loading-wrap" aria-label={labels.camerasLoaderAria}>
                    <Spinner size="md" tone="dark" />
                    <p className="cameras-feedback-text cameras-loading-message">
                      {isMutating ? labels.camerasRefreshingData : labels.camerasLoadingData}
                    </p>
                  </div>
                </Card>
              ) : null}

              {!isLoading && cameraListItems.length > 0 ? (
                <>
                  <CameraList
                    cameras={cameraListItems}
                    isAdmin={isAdmin}
                    isBusy={isMutating}
                    onCreate={handleOpenCreateForm}
                    onView={handleViewCamera}
                    onEdit={handleOpenEditForm}
                    onDelete={(cameraId) => {
                      void handleDeleteCamera(cameraId)
                    }}
                  />
                  <nav className="cameras-pagination" aria-label={labels.camerasPaginationAria}>
                    <Button
                      type="button"
                      disabled={isLoading || currentPage === 0}
                      onClick={handlePreviousPage}
                    >
                      {labels.camerasPaginationPrevious}
                    </Button>
                    <span className="cameras-pagination-status">
                      {labels.camerasPaginationStatus(currentPage + 1, Math.max(1, totalPages), totalElements)}
                    </span>
                    <Button
                      type="button"
                      disabled={isLoading || totalPages === 0 || currentPage >= totalPages - 1}
                      onClick={handleNextPage}
                    >
                      {labels.camerasPaginationNext}
                    </Button>
                  </nav>
                </>
              ) : null}

              {!isLoading && !error && cameraListItems.length === 0 ? (
                <Card className="cameras-feedback-card cameras-feedback-card--empty">
                  <span className="cameras-feedback-icon" aria-hidden="true">
                    <CameraOff size={44} strokeWidth={1.8} />
                  </span>
                  <p className="cameras-feedback-title">{labels.camerasEmptyTitle}</p>
                  {isAdmin ? (
                    <Button type="button" disabled={isMutating} onClick={handleOpenCreateForm}>
                      {labels.camerasCreateAction}
                    </Button>
                  ) : (
                    <p className="cameras-feedback-text">{labels.camerasEmptyDescription}</p>
                  )}
                </Card>
              ) : null}
            </div>
          </>
        )}

        {isAdmin && formMode ? (
          <>
            <header className="cameras-page-header cameras-page-header--form">
              <span aria-hidden="true" />
              <h2 className="cameras-page-title">
                {formMode === 'create' ? labels.camerasCreateFormTitle : labels.camerasEditFormTitle}
              </h2>
              <span aria-hidden="true" />
            </header>

            <Card className="cameras-form-card">
              <form className="cameras-form-grid" noValidate onSubmit={(event) => void handleFormSubmit(event)}>
                <CameraFormField
                  id="camera-name"
                  name="name"
                  label={labels.camerasFormNameLabel}
                  errorMessage={formErrors.name}
                  value={formState.name}
                  placeholder={labels.camerasFormNamePlaceholder}
                  required
                  maxLength={120}
                  onChange={(event) => {
                    handleFormChange('name', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-angle-xy"
                  name="angleXY"
                  label={labels.camerasFormAngleXYLabel}
                  errorMessage={formErrors.angleXY}
                  type="number"
                  step="any"
                  required
                  min={0}
                  max={360}
                  inputMode="decimal"
                  value={formState.angleXY}
                  onChange={(event) => {
                    handleFormChange('angleXY', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-angle-xz"
                  name="angleXZ"
                  label={labels.camerasFormAngleXZLabel}
                  errorMessage={formErrors.angleXZ}
                  type="number"
                  step="any"
                  required
                  min={0}
                  max={360}
                  inputMode="decimal"
                  value={formState.angleXZ}
                  onChange={(event) => {
                    handleFormChange('angleXZ', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-region"
                  name="region"
                  label={labels.camerasFormRegionLabel}
                  errorMessage={formErrors.region}
                  value={formState.region}
                  placeholder={labels.camerasFormRegionPlaceholder}
                  required
                  maxLength={120}
                  onChange={(event) => {
                    handleFormChange('region', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-address"
                  name="address"
                  label={labels.camerasFormAddressLabel}
                  errorMessage={formErrors.address}
                  value={formState.address}
                  placeholder={labels.camerasFormAddressPlaceholder}
                  required
                  maxLength={180}
                  onChange={(event) => {
                    handleFormChange('address', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-latitude"
                  name="latitude"
                  label={labels.camerasFormLatitudeLabel}
                  errorMessage={formErrors.latitude}
                  type="number"
                  step="any"
                  required
                  min={-90}
                  max={90}
                  inputMode="decimal"
                  value={formState.latitude}
                  onChange={(event) => {
                    handleFormChange('latitude', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-longitude"
                  name="longitude"
                  label={labels.camerasFormLongitudeLabel}
                  errorMessage={formErrors.longitude}
                  type="number"
                  step="any"
                  required
                  min={-180}
                  max={180}
                  inputMode="decimal"
                  value={formState.longitude}
                  onChange={(event) => {
                    handleFormChange('longitude', event.target.value)
                  }}
                />
                <CameraFormField
                  id="camera-height"
                  name="height"
                  label={labels.camerasFormHeightLabel}
                  errorMessage={formErrors.height}
                  type="number"
                  step="any"
                  required
                  inputMode="decimal"
                  value={formState.height}
                  onChange={(event) => {
                    handleFormChange('height', event.target.value)
                  }}
                />

                {formError ? <p className="cameras-form-error">{formError}</p> : null}

                <div className="cameras-form-actions">
                  <Button type="button" disabled={isMutating} onClick={handleFormCancel}>
                    {labels.camerasFormCancel}
                  </Button>
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
