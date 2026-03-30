import { NextResponse } from 'next/server'
import { readUsers } from '@/lib/db/usersStore'
import { getBearerToken, verifyToken } from '@/lib/auth/jwt'
import type { PublicUser } from '@/lib/auth/types'

export async function GET(req: Request) {
  const token = getBearerToken(req.headers.get('authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin' || !payload.approved) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await readUsers()
  const pending: PublicUser[] = users
    .filter((u) => u.role !== 'admin' && !u.approved)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      approved: u.approved,
      ethereumAddress: u.ethereumAddress,
      location: u.location,
    }))

  return NextResponse.json({ pending })
}
