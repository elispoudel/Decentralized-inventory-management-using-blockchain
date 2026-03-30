import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { findUserByEmail, addUser } from '@/lib/db/usersStore'
import { hashPassword } from '@/lib/auth/password'
import { isValidEmail, isValidEthAddress } from '@/lib/auth/validation'
import type { StoredUser, UserRole } from '@/lib/auth/types'

const ROLES: UserRole[] = ['admin', 'manufacturer', 'warehouse', 'retailer']

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const password = String(body.password ?? '')
    const role = String(body.role ?? '').toLowerCase() as UserRole
    const location = String(body.location ?? '').trim()
    const ethereumAddress = body.ethereumAddress != null ? String(body.ethereumAddress).trim() : ''

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
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role selected.' }, { status: 400 })
    }

    if (role === 'admin') {
      if (!ethereumAddress || !isValidEthAddress(ethereumAddress)) {
        return NextResponse.json(
          { error: 'Admin registration requires a valid Ethereum address (0x…).' },
          { status: 400 }
        )
      }
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
    }

    const user: StoredUser = {
      id: randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role,
      location,
      ethereumAddress: role === 'admin' ? ethereumAddress : ethereumAddress || null,
      approved: role === 'admin',
      createdAt: Date.now(),
    }

    await addUser(user)

    const messageType = role === 'admin' ? 'admin_created' : 'pending_review'

    return NextResponse.json({
      ok: true,
      messageType,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 })
  }
}
