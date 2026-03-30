import { NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/db/usersStore'
import { verifyPassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'
import { isValidEmail } from '@/lib/auth/validation'
import type { PublicUser } from '@/lib/auth/types'

function toPublic(u: Awaited<ReturnType<typeof findUserByEmail>>): PublicUser | null {
  if (!u) return null
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    approved: u.approved,
    ethereumAddress: u.ethereumAddress,
    location: u.location,
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email.' }, { status: 400 })
    }
    if (!password) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
    }

    const user = await findUserByEmail(email)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (user.role !== 'admin' && !user.approved) {
      return NextResponse.json(
        { error: 'pending_approval', message: 'Your account is being reviewed. Please wait for approval.' },
        { status: 403 }
      )
    }

    const needsEth =
      user.role !== 'admin' && user.approved && !user.ethereumAddress
    if (needsEth) {
      return NextResponse.json(
        {
          error: 'account_incomplete',
          message: 'Your account is missing an Ethereum address. Please contact the administrator.',
        },
        { status: 403 }
      )
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      approved: user.approved,
    })

    const publicUser = toPublic(user)!
    return NextResponse.json({ token, user: publicUser })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 })
  }
}
