import jwt from 'jsonwebtoken'
import type { AuthSessionPayload, UserRole } from '@/lib/auth/types'

function getSecret(): string {
  return process.env.JWT_SECRET || 'inventory-dev-secret-change-me'
}

export function signToken(payload: {
  sub: string
  email: string
  role: UserRole
  approved: boolean
}): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthSessionPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as AuthSessionPayload
    return decoded
  } catch {
    return null
  }
}

export function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7).trim() || null
}
