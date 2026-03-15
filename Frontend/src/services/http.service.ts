import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config'

interface ApiErrorPayload {
  readonly message?: string
  readonly error?: string
}

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  readonly body?: unknown
  readonly headers?: Record<string, string>
  readonly token?: string | null
  readonly timeoutMs?: number
}

export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

function buildUrl(endpoint: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/$/, '')
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  return `${normalizedBase}${normalizedEndpoint}`
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const payload = value as ApiErrorPayload

  return typeof payload.message === 'string' || typeof payload.error === 'string'
}

async function parseErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  try {
    const payload: unknown = await response.json()

    if (isApiErrorPayload(payload)) {
      return payload
    }
  } catch {
    return null
  }

  return null
}

export async function fetchApi<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  try {
    const response = await fetch(buildUrl(endpoint), {
      ...options,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      const payload = await parseErrorPayload(response)
      const code = payload?.error ?? String(response.status)
      const message = payload?.message ?? response.statusText

      throw new HttpError(response.status, code, message)
    }

    const noContentStatus = 204
    if (response.status === noContentStatus) {
      return undefined as T
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return (await response.json()) as T
    }

    return (await response.text()) as T
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new HttpError(408, 'REQUEST_TIMEOUT', 'Request timeout')
    }

    throw new HttpError(0, 'NETWORK_ERROR', 'Network error')
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}
