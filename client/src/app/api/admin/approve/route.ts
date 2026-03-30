import { NextResponse } from 'next/server'
import { findUserById, findUserByEthereumAddress, updateUser } from '@/lib/db/usersStore'
import { getBearerToken, verifyToken } from '@/lib/auth/jwt'
import { isValidEthAddress } from '@/lib/auth/validation'

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
    const ethereumAddress = String(body.ethereumAddress ?? '').trim()
    if (!targetId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    if (!ethereumAddress || !isValidEthAddress(ethereumAddress)) {
      return NextResponse.json(
        { error: 'A valid Ethereum address (0x…) is required to approve this account.' },
        { status: 400 }
      )
    }

    const target = await findUserById(targetId)
    if (!target || target.role === 'admin') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (target.approved) {
      return NextResponse.json({ error: 'User is already approved.' }, { status: 400 })
    }

    const taken = await findUserByEthereumAddress(ethereumAddress, targetId)
    if (taken) {
      return NextResponse.json(
        { error: 'This Ethereum address is already assigned to another user.' },
        { status: 409 }
      )
    }

    await updateUser(targetId, { approved: true, ethereumAddress })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 })
  }
}
