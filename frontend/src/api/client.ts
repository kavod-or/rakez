const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

export type RoleEntry =
  | { role: string; label: string; scope: 'global' }
  | { role: string; label: string; scope: 'event'; target: { id: string; name: string } }
  | { role: string; label: string; scope: 'service'; target: { id: number; name: string } }

export type CurrentUser = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  roles: RoleEntry[]
}

export type UserItem = CurrentUser

export type EventItem = {
  id: number
  public_id: string
  name: string
  start: string
  end: string
  timezone: string
  description: string
}

export type StaffPosition = {
  id: number
  name: string
  service?: number
}

export type StaffItem = {
  id: number
  public_id: string
  firstname: string
  lastname: string
  positions: StaffPosition[]
}

export type ServiceItem = {
  id: number
  name: string
}

export type PositionItem = {
  id: number
  name: string
  service: number
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

export async function getUsers(): Promise<UserItem[]> {
  return apiFetch<UserItem[]>('/api/v1/auth/users/')
}

export async function getEvents(): Promise<EventItem[]> {
  return apiFetch<EventItem[]>('/api/v1/events/')
}

export async function getStaff(): Promise<StaffItem[]> {
  return apiFetch<StaffItem[]>('/api/v1/staff/')
}

export async function createStaff(firstname: string, lastname: string): Promise<StaffItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<StaffItem>('/api/v1/staff/', {
    method: 'POST',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
    body: JSON.stringify({ firstname, lastname }),
  })
}

export async function patchStaff(id: number, firstname: string, lastname: string): Promise<StaffItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<StaffItem>(`/api/v1/staff/${id}/`, {
    method: 'PATCH',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
    body: JSON.stringify({ firstname, lastname }),
  })
}

export async function assignStaffPosition(staffId: number, positionId: number): Promise<{ staff: number; position: number }> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<{ staff: number; position: number }>(`/api/v1/staff/${staffId}/assign-position/`, {
    method: 'POST',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
    body: JSON.stringify({ position_id: positionId }),
  })
}

export async function removeStaffPosition(staffId: number, positionId: number): Promise<void> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  await apiFetch<void>(`/api/v1/staff/${staffId}/remove-position/${positionId}/`, {
    method: 'DELETE',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
  })
}

export async function getServices(): Promise<ServiceItem[]> {
  return apiFetch<ServiceItem[]>('/api/v1/services/')
}

export async function createService(name: string): Promise<ServiceItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<ServiceItem>('/api/v1/services/', {
    method: 'POST',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
    body: JSON.stringify({ name }),
  })
}

export async function patchService(id: number, name: string): Promise<ServiceItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<ServiceItem>(`/api/v1/services/${id}/`, {
    method: 'PATCH',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
    body: JSON.stringify({ name }),
  })
}

export async function deleteService(id: number): Promise<void> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  await apiFetch<void>(`/api/v1/services/${id}/`, {
    method: 'DELETE',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
  })
}

export async function deleteStaff(id: number): Promise<void> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  await apiFetch<void>(`/api/v1/staff/${id}/`, {
    method: 'DELETE',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
  })
}

export async function getPositions(): Promise<PositionItem[]> {
  return apiFetch<PositionItem[]>('/api/v1/positions/')
}

export async function createPosition(service: number, name: string): Promise<PositionItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<PositionItem>('/api/v1/positions/', {
    method: 'POST',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
    body: JSON.stringify({ service, name }),
  })
}

export async function patchPosition(id: number, name: string): Promise<PositionItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<PositionItem>(`/api/v1/positions/${id}/`, {
    method: 'PATCH',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
    body: JSON.stringify({ name }),
  })
}

export async function deletePosition(id: number): Promise<void> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  await apiFetch<void>(`/api/v1/positions/${id}/`, {
    method: 'DELETE',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
  })
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

export async function logout(): Promise<{ detail: string }> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')

  return apiFetch<{ detail: string }>('/api/v1/auth/logout/', {
    method: 'POST',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
  })
}

export async function patchEvent(id: number, patch: Partial<{ name: string; start: string; end: string; timezone: string; description: string }>): Promise<EventItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<EventItem>(`/api/v1/events/${id}/`, {
    method: 'PATCH',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
    body: JSON.stringify(patch),
  })
}
