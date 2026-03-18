import { createContext } from 'react'

import type { AuthUser, LoginRequest, RegisterRequest } from '@/features/auth/types/auth'

export interface AuthContextValue {
  readonly user: AuthUser | null
  readonly isAuthenticated: boolean
  readonly isLoading: boolean
  readonly error: string | null
  login(payload: LoginRequest): Promise<boolean>
  register(payload: RegisterRequest): Promise<boolean>
  logout(): void
  clearError(): void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
