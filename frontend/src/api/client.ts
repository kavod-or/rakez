import { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

export type RoleEntry =
  | { id: number; role: string; label: string; scope: 'global' }
  | { id: number; role: string; label: string; scope: 'event'; target: { id: string; name: string } }
  | { id: number; role: string; label: string; scope: 'service'; target: { id: number; name: string } }

export type CurrentUser = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  roles: RoleEntry[]
}

export type UserItem = CurrentUser

export type UserInput = {
  username: string
  first_name: string
  last_name: string
  email: string
  password?: string
}

export type EventItem = {
  id: number
  public_id: string
  name: string
  start: string
  end: string
  timezone: string
  description: string
  display_pin?: string | null
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

let onUnauthenticatedHandler: (() => void) | null = null

export function setOnUnauthenticatedHandler(handler: (() => void) | null) {
  onUnauthenticatedHandler = handler
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
    if (response.status === 401) {
      onUnauthenticatedHandler?.()
    }
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

export async function updateCurrentUser(user: Omit<UserInput, 'username'>): Promise<CurrentUser> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<CurrentUser>('/api/v1/auth/me/', {
    method: 'PATCH',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
    body: JSON.stringify(user.password ? user : {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    }),
  })
}

export async function getUsers(): Promise<UserItem[]> {
  return apiFetch<UserItem[]>('/api/v1/auth/users/')
}

export async function createUser(user: UserInput & {password: string}): Promise<UserItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<UserItem>('/api/v1/auth/users/', {
    method: 'POST',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
    body: JSON.stringify(user),
  })
}

export async function patchUser(id: number, user: Omit<UserInput, 'username'>): Promise<UserItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<UserItem>(`/api/v1/auth/users/${id}/`, {
    method: 'PATCH',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
    body: JSON.stringify(user.password ? user : {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    }),
  })
}

export type RoleScope = 'global' | 'event' | 'service'

export async function addUserRole(userId: number, role: {scope: RoleScope; role: string; target_id?: string}): Promise<UserItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<UserItem>(`/api/v1/auth/users/${userId}/roles/`, {
    method: 'POST',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
    body: JSON.stringify(role),
  })
}

export async function removeUserRole(userId: number, scope: RoleScope, roleId: number): Promise<UserItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<UserItem>(`/api/v1/auth/users/${userId}/roles/${scope}/${roleId}/`, {
    method: 'DELETE',
    headers: {
      ...(csrfToken ? {'X-CSRFToken': csrfToken} : {}),
    },
  })
}

export async function getEvents(): Promise<EventItem[]> {
  return apiFetch<EventItem[]>('/api/v1/events/')
}

export async function createEvent(event: { name: string; start: string; end: string; timezone: string; description?: string; pin: string }): Promise<EventItem> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  return apiFetch<EventItem>('/api/v1/events/', {
    method: 'POST',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
    body: JSON.stringify(event),
  })
}

export function getActiveEventId(): string | null {
  try {
    return localStorage.getItem('active-event')
  } catch {
    return null
  }
}

export function setActiveEventId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem('active-event', id)
    } else {
      localStorage.removeItem('active-event')
    }
  } catch {
    // Ignore storage errors
  }
  window.dispatchEvent(new CustomEvent('active-event-changed', { detail: id }))
}

export function useActiveEventId(): [string | null, (id: string | null) => void] {
  const [activeEventId, setActiveEventIdState] = useState<string | null>(() => getActiveEventId())

  useEffect(() => {
    const handleActiveEventChange = () => {
      setActiveEventIdState(getActiveEventId())
    }

    window.addEventListener('active-event-changed', handleActiveEventChange)
    window.addEventListener('storage', handleActiveEventChange)

    return () => {
      window.removeEventListener('active-event-changed', handleActiveEventChange)
      window.removeEventListener('storage', handleActiveEventChange)
    }
  }, [])

  const setAndSaveActiveEventId = (id: string | null) => {
    setActiveEventId(id)
    setActiveEventIdState(id)
  }

  return [activeEventId, setAndSaveActiveEventId]
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

export function getActiveServiceId(): number | null {
  try {
    const value = localStorage.getItem('active-service')
    const id = value === null ? NaN : Number(value)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export function setActiveServiceId(id: number | null) {
  try {
    if (id === null) {
      localStorage.removeItem('active-service')
    } else {
      localStorage.setItem('active-service', String(id))
    }
  } catch {
    // Ignore storage errors.
  }
  window.dispatchEvent(new CustomEvent('active-service-changed', {detail: id}))
}

export function useActiveServiceId(): [number | null, (id: number | null) => void] {
  const [activeServiceId, setActiveServiceIdState] = useState<number | null>(() => getActiveServiceId())

  useEffect(() => {
    const handleActiveServiceChange = () => setActiveServiceIdState(getActiveServiceId())
    window.addEventListener('active-service-changed', handleActiveServiceChange)
    window.addEventListener('storage', handleActiveServiceChange)

    return () => {
      window.removeEventListener('active-service-changed', handleActiveServiceChange)
      window.removeEventListener('storage', handleActiveServiceChange)
    }
  }, [])

  const setAndSaveActiveServiceId = (id: number | null) => {
    setActiveServiceId(id)
    setActiveServiceIdState(id)
  }

  return [activeServiceId, setAndSaveActiveServiceId]
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

export async function deleteEvent(id: number): Promise<void> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  await apiFetch<void>(`/api/v1/events/${id}/`, {
    method: 'DELETE',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
  })
}

export async function patchEvent(id: number, patch: Partial<{ name: string; start: string; end: string; timezone: string; description: string; pin: string }>): Promise<EventItem> {
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
