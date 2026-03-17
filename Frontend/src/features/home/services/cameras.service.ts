import { labels } from '@/constants/labels'
import { fetchApi, HttpError } from '@/services/http.service'
import type {
  CameraDto,
  CameraListItem,
  CameraPageResponse,
  CameraUpsertPayload,
} from '@/features/home/types/camera.types'

const CAMERAS_ENDPOINT = '/camera'

type CameraErrorCode =
  | 'CAMERA_NETWORK_ERROR'
  | 'CAMERA_BAD_REQUEST'
  | 'CAMERA_FORBIDDEN'
  | 'CAMERA_UNAUTHORIZED'
  | 'CAMERA_NOT_FOUND'
  | 'CAMERA_CONFLICT'
  | 'CAMERA_UNKNOWN_ERROR'

interface CameraListQuery {
  readonly page: number
  readonly size: number
}

function buildCameraListQueryString(query: CameraListQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
  })

  return params.toString()
}

export async function listCamerasRequest(
  token: string,
  query: CameraListQuery,
): Promise<CameraPageResponse> {
  const queryString = buildCameraListQueryString(query)

  return fetchApi<CameraPageResponse>(`${CAMERAS_ENDPOINT}?${queryString}`, {
    method: 'GET',
    token,
  })
}

export async function createCameraRequest(token: string, payload: CameraUpsertPayload): Promise<CameraDto> {
  return fetchApi<CameraDto>(CAMERAS_ENDPOINT, {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function updateCameraRequest(
  token: string,
  cameraId: string,
  payload: CameraUpsertPayload,
): Promise<CameraDto> {
  return fetchApi<CameraDto>(`${CAMERAS_ENDPOINT}/${cameraId}`, {
    method: 'PUT',
    token,
    body: payload,
  })
}

export async function deleteCameraRequest(token: string, cameraId: string): Promise<void> {
  await fetchApi<void>(`${CAMERAS_ENDPOINT}/${cameraId}`, {
    method: 'DELETE',
    token,
  })
}

export function toCameraListItem(camera: CameraDto): CameraListItem {
  return {
    id: camera.id,
    name: camera.name,
    region: camera.location.region,
    address: camera.location.address,
    previewUrl: null,
  }
}

export function mapCameraErrorCode(error: unknown): CameraErrorCode {
  if (!(error instanceof HttpError)) {
    return 'CAMERA_UNKNOWN_ERROR'
  }

  if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
    return 'CAMERA_NETWORK_ERROR'
  }

  if (error.status === 400) {
    return 'CAMERA_BAD_REQUEST'
  }

  if (error.status === 401) {
    return 'CAMERA_UNAUTHORIZED'
  }

  if (error.status === 403) {
    return 'CAMERA_FORBIDDEN'
  }

  if (error.status === 404) {
    return 'CAMERA_NOT_FOUND'
  }

  if (error.status === 409) {
    return 'CAMERA_CONFLICT'
  }

  return 'CAMERA_UNKNOWN_ERROR'
}

export function getCameraErrorLabel(code: CameraErrorCode): string {
  switch (code) {
    case 'CAMERA_NETWORK_ERROR':
      return labels.camerasErrorNetwork
    case 'CAMERA_BAD_REQUEST':
      return labels.camerasErrorBadRequest
    case 'CAMERA_UNAUTHORIZED':
      return labels.camerasErrorUnauthorized
    case 'CAMERA_FORBIDDEN':
      return labels.camerasErrorForbidden
    case 'CAMERA_NOT_FOUND':
      return labels.camerasErrorNotFound
    case 'CAMERA_CONFLICT':
      return labels.camerasErrorConflict
    default:
      return labels.camerasErrorUnexpected
  }
}
