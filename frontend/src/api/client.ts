const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

export type CurrentUser = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  roles: string[]
}

export type LoginResponse = {
  detail: string
  user: {
    id: number
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (typeof data === 'object' && data !== null && 'detail' in data) {
      const detail = (data as { detail?: unknown }).detail
      if (typeof detail === 'string') {
        return detail
      }
    }
  } catch {
    // Ignore JSON parsing failures and fall back to a generic message.
  }

  return `Request failed with status ${response.status}`
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch(apiUrl('/api/v1/auth/me/'), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (response.status === 401 || response.status === 403) {
    return null
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as CurrentUser
}

export async function ensureCsrfCookie(): Promise<void> {
  await fetch(apiUrl('/api/v1/auth/csrf/'), {
    credentials: 'include',
  })
}

export function getCookie(name: string): string | undefined {
  const value = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))

  return value ? decodeURIComponent(value.split('=').slice(1).join('=')) : undefined
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')

  return apiFetch<LoginResponse>('/api/v1/auth/login/', {
    method: 'POST',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
    body: JSON.stringify({ username, password }),
  })
}