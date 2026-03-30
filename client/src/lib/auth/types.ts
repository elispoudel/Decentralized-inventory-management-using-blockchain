export type UserRole = 'admin' | 'manufacturer' | 'warehouse' | 'retailer'

export interface StoredUser {
  id: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  /** Required when role is admin at registration */
  ethereumAddress: string | null
  location: string | null
  approved: boolean
  createdAt: number
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
  approved: boolean
  ethereumAddress: string | null
  location: string | null
}

export interface AuthSessionPayload {
  sub: string
  email: string
  role: UserRole
  approved: boolean
}
