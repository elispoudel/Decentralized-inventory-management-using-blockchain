import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { findUserByEmail, addUser, deleteUser } from '@/lib/db/usersStore'
import { hashPassword } from '@/lib/auth/password'
import { getBearerToken, verifyToken } from '@/lib/auth/jwt'
import { isValidEmail, isValidEthAddress } from '@/lib/auth/validation'
import type { StoredUser, UserRole } from '@/lib/auth/types'

const SUPPLY_ROLES: UserRole[] = ['manufacturer', 'warehouse', 'retailer']

function requireAdmin(req: Request): { error: NextResponse } | { payload: NonNullable<ReturnType<typeof verifyToken>> } {
  const token = getBearerToken(req.headers.get('authorization'))
  if (!token) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin' || !payload.approved) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { payload }
}

export async function POST(req: Request) {
  const auth = requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const password = String(body.password ?? '')
    const role = String(body.role ?? '').toLowerCase() as UserRole
    const location = String(body.location ?? '').trim()
    const ethereumAddress = String(body.ethereumAddress ?? '').trim()

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid name.' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }
    if (!location || location.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid location.' }, { status: 400 })
    }
    if (!SUPPLY_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role selected.' }, { status: 400 })
    }
    if (!ethereumAddress || !isValidEthAddress(ethereumAddress)) {
      return NextResponse.json(
        { error: 'A valid Ethereum address (0x…) is required.' },
        { status: 400 }
      )
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
    }

    const id = randomUUID()
    const user: StoredUser = {
      id,
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role,
      location,
      ethereumAddress,
      approved: true,
      createdAt: Date.now(),
    }

    await addUser(user)

    return NextResponse.json({ ok: true, userId: id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 })
  }
}

/** Roll back a user row if the on-chain transaction fails after DB insert */
export async function DELETE(req: Request) {
  const auth = requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    const body = await req.json()
    const userId = String(body.userId ?? '').trim()
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    const removed = await deleteUser(userId)
    if (!removed) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Rollback failed' }, { status: 500 })
  }
}
