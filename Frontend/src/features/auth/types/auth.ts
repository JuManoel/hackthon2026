export interface LoginFormValues {
  readonly username: string
  readonly password: string
}

export interface RegisterFormValues {
  readonly username: string
  readonly password: string
  readonly confirmPassword: string
}

export interface LoginRequest {
  readonly username: string
  readonly password: string
}

export interface RegisterRequest {
  readonly username: string
  readonly password: string
}

export interface AuthTokenResponse {
  readonly token: string
}

export interface AuthMeResponse {
  readonly id: string
  readonly username: string
  readonly role: string
}

export interface AuthUser {
  readonly id: string
  readonly username: string
  readonly role: string
}

export type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_FORBIDDEN'
  | 'AUTH_NETWORK_ERROR'
  | 'AUTH_USERNAME_TAKEN'
  | 'AUTH_VALIDATION_ERROR'
  | 'AUTH_UNKNOWN_ERROR'
