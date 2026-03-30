import { NextResponse } from 'next/server'
import { findUserById, deleteUser } from '@/lib/db/usersStore'
import { getBearerToken, verifyToken } from '@/lib/auth/jwt'

export async function POST(req: Request) {
  const token = getBearerToken(req.headers.get('authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin' || !payload.approved) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const targetId = String(body.userId ?? '')
    if (!targetId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const target = await findUserById(targetId)
    if (!target || target.role === 'admin') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (target.approved) {
      return NextResponse.json(
        { error: 'Only pending registrations can be removed.' },
        { status: 400 }
      )
    }

    await deleteUser(targetId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Remove failed' }, { status: 500 })
  }
}
