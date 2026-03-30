'use client'

import type { PublicUser, UserRole } from '@/lib/auth/types'

const KEY = 'inventory_auth_session_v1'

export interface ClientSession {
  token: string
  user: PublicUser
}

export function saveSession(session: ClientSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function loadSession(): ClientSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as ClientSession
  } catch {
    return null
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

export function roleDashboardPath(role: UserRole, approved: boolean): string {
  if (role === 'admin') return '/admin'
  if (!approved) return '/'
  if (role === 'manufacturer') return '/dashboard/manufacturer'
  if (role === 'warehouse') return '/dashboard/warehouse'
  if (role === 'retailer') return '/dashboard/retailer'
  return '/dashboard'
}

/** Use for “Home” / back navigation from feature pages */
export function dashboardHomePath(): string {
  const s = loadSession()
  if (!s?.token) return '/'
  if (s.user.role === 'admin') return '/admin'
  if (s.user.approved) return roleDashboardPath(s.user.role, true)
  return '/'
}
