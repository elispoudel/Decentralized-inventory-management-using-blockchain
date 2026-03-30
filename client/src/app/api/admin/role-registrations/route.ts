import { NextResponse } from 'next/server'
import { readUsers } from '@/lib/db/usersStore'
import { getBearerToken, verifyToken } from '@/lib/auth/jwt'
import type { UserRole } from '@/lib/auth/types'

type Row = {
  email: string
  name: string
  location: string | null
  ethereumAddress: string | null
}

export async function GET(req: Request) {
  const token = getBearerToken(req.headers.get('authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin' || !payload.approved) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const users = await readUsers()
    const mapRole = (r: UserRole): Row[] =>
      users
        .filter((u) => u.role === r && u.approved && u.ethereumAddress)
        .map((u) => ({
          email: u.email,
          name: u.name,
          location: u.location,
          ethereumAddress: u.ethereumAddress,
        }))

    return NextResponse.json({
      manufacturer: mapRole('manufacturer'),
      warehouse: mapRole('warehouse'),
      retailer: mapRole('retailer'),
      admin: mapRole('admin'),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to load registrations' }, { status: 500 })
  }
}
