import type { ApiResponse } from './types'

const API_BASE = '/api'

class ApiError extends Error {
  code: string
  details?: unknown
  status: number
  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

export { ApiError }

async function request<T>(
  path: string,
  options: RequestInit = {},
  expectBlob = false
): Promise<T> {
  const url = `${API_BASE}${path}`
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  // Attach auth token
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('bcg_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(url, { ...options, headers })
  } catch (e) {
    throw new ApiError('NETWORK', 'Unable to reach the server. Please check your connection.', 0)
  }

  if (expectBlob) {
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new ApiError(
        data?.error?.code ?? 'UNKNOWN',
        data?.error?.message ?? `Request failed (${res.status})`,
        res.status,
        data?.error?.details
      )
    }
    return (await res.blob()) as unknown as T
  }

  const text = await res.text()
  let data: ApiResponse<T> | null = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError('PARSE', 'Received an invalid response from the server.', res.status)
    }
  }

  if (!res.ok || (data && data.success === false)) {
    const err = data?.error
    throw new ApiError(
      err?.code ?? 'UNKNOWN',
      err?.message ?? `Request failed (${res.status})`,
      res.status,
      err?.details
    )
  }

  // For auth endpoints that return token directly
  if (data && data.data !== undefined) {
    return data.data
  }
  return data as unknown as T
}

export const api = {
  get: <T>(path: string, opts?: RequestInit) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { ...opts, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { ...opts, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { ...opts, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string, opts?: RequestInit) => request<T>(path, { ...opts, method: 'DELETE' }),
  blob: (path: string, opts?: RequestInit) =>
    request<Blob>(path, { ...opts, method: 'GET' }, true),
  postBlob: (path: string, body?: unknown, opts?: RequestInit) =>
    request<Blob>(
      path,
      { ...opts, method: 'POST', body: body ? JSON.stringify(body) : undefined },
      true
    ),
  upload: <T>(path: string, formData: FormData, opts?: RequestInit) =>
    request<T>(path, { ...opts, method: 'POST', body: formData }),
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem('bcg_token', token)
  } else {
    window.localStorage.removeItem('bcg_token')
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('bcg_token')
}
