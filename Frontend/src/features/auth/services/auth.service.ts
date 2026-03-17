import { labels } from '@/constants/labels'
import { TOKEN_STORAGE_KEY } from '@/config'
import { fetchApi, HttpError } from '@/services/http.service'
import type {
  AuthErrorCode,
  AuthMeResponse,
  AuthTokenResponse,
  LoginRequest,
  RegisterRequest,
} from '@/features/auth/types/auth'

const defaultUserRole = 'GUIDE'

export function getStoredToken(): string | null {
  return globalThis.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function storeToken(token: string): void {
  globalThis.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredToken(): void {
  globalThis.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function loginRequest(payload: LoginRequest): Promise<AuthTokenResponse> {
  return fetchApi<AuthTokenResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export async function registerRequest(payload: RegisterRequest): Promise<void> {
  await fetchApi<string>('/user', {
    method: 'POST',
    body: {
      ...payload,
      role: defaultUserRole,
    },
  })
}

export async function meRequest(token: string): Promise<AuthMeResponse> {
  return fetchApi<AuthMeResponse>('/auth/me', {
    method: 'GET',
    token,
  })
}

export function mapAuthErrorCode(error: unknown): AuthErrorCode {
  if (!(error instanceof HttpError)) {
    return 'AUTH_UNKNOWN_ERROR'
  }

  if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
    return 'AUTH_NETWORK_ERROR'
  }

  if (error.status === 401) {
    return 'AUTH_INVALID_CREDENTIALS'
  }

  if (error.status === 403) {
    return 'AUTH_FORBIDDEN'
  }

  const badRequestStatus = 400
  if (error.status === badRequestStatus && error.message.toLowerCase().includes('exists')) {
    return 'AUTH_USERNAME_TAKEN'
  }

  if (error.status === badRequestStatus) {
    return 'AUTH_VALIDATION_ERROR'
  }

  return 'AUTH_UNKNOWN_ERROR'
}

export function getAuthErrorLabel(errorCode: AuthErrorCode): string {
  switch (errorCode) {
    case 'AUTH_INVALID_CREDENTIALS':
      return labels.authInvalidCredentials
    case 'AUTH_FORBIDDEN':
      return labels.authForbidden
    case 'AUTH_NETWORK_ERROR':
      return labels.authNetworkError
    case 'AUTH_USERNAME_TAKEN':
      return labels.authUsernameTaken
    case 'AUTH_VALIDATION_ERROR':
      return labels.authValidationError
    default:
      return labels.authUnexpectedError
  }
}
