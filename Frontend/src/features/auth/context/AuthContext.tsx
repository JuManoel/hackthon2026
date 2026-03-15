import { useCallback, useEffect, useMemo, useState, type FC, type ReactNode } from 'react'

import { labels } from '../../../constants/labels'
import {
  clearStoredToken,
  getAuthErrorLabel,
  getStoredToken,
  loginRequest,
  mapAuthErrorCode,
  meRequest,
  registerRequest,
  storeToken,
} from '../services/auth.service'
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth'
import { AuthContext, type AuthContextValue } from './auth-context'

interface AuthProviderProps {
  readonly children: ReactNode
}

interface JwtPayload {
  readonly exp?: number
}

function getTokenExpiryInMs(token: string): number | null {
  const tokenParts = token.split('.')

  if (tokenParts.length < 2) {
    return null
  }

  try {
    const payload = JSON.parse(globalThis.atob(tokenParts[1])) as JwtPayload

    if (typeof payload.exp !== 'number') {
      return null
    }

    const millisecondsPerSecond = 1000

    return payload.exp * millisecondsPerSecond
  } catch {
    return null
  }
}

function toAuthUser(payload: { id: string; username: string; role: string }): AuthUser {
  return {
    id: payload.id,
    username: payload.username,
    role: payload.role,
  }
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const login = useCallback(async (payload: LoginRequest): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const auth = await loginRequest(payload)
      storeToken(auth.token)
      setToken(auth.token)

      const me = await meRequest(auth.token)
      setUser(toAuthUser(me))

      return true
    } catch (requestError) {
      const errorCode = mapAuthErrorCode(requestError)
      setError(getAuthErrorLabel(errorCode))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (payload: RegisterRequest): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await registerRequest(payload)
      return true
    } catch (requestError) {
      const errorCode = mapAuthErrorCode(requestError)
      setError(getAuthErrorLabel(errorCode))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const restoreSession = async (): Promise<void> => {
      if (!token) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const me = await meRequest(token)

        if (!isMounted) {
          return
        }

        setUser(toAuthUser(me))
      } catch {
        if (!isMounted) {
          return
        }

        clearStoredToken()
        setToken(null)
        setUser(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      isMounted = false
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }

    const expiresAtMs = getTokenExpiryInMs(token)

    if (!expiresAtMs) {
      return
    }

    const remainingMs = expiresAtMs - Date.now()

    if (remainingMs <= 0) {
      logout()
      setError(labels.authSessionExpired)
      return
    }

    const timeoutId = globalThis.setTimeout(() => {
      logout()
      setError(labels.authSessionExpired)
    }, remainingMs)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [logout, token])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [clearError, error, isLoading, login, logout, register, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
