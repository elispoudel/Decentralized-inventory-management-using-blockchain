import { promises as fs } from 'fs'
import path from 'path'
import type { StoredUser } from '@/lib/auth/types'

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json')

interface FileShape {
  users: StoredUser[]
}

async function ensureFile(): Promise<void> {
  const dir = path.dirname(DATA_FILE)
  await fs.mkdir(dir, { recursive: true })
  try {
    await fs.access(DATA_FILE)
  } catch {
    const initial: FileShape = { users: [] }
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8')
  }
}

export async function readUsers(): Promise<StoredUser[]> {
  await ensureFile()
  const raw = await fs.readFile(DATA_FILE, 'utf8')
  const data = JSON.parse(raw) as FileShape
  return data.users || []
}

export async function writeUsers(users: StoredUser[]): Promise<void> {
  await ensureFile()
  await fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), 'utf8')
}

export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  const users = await readUsers()
  const lower = email.trim().toLowerCase()
  return users.find((u) => u.email.toLowerCase() === lower)
}

export async function findUserById(id: string): Promise<StoredUser | undefined> {
  const users = await readUsers()
  return users.find((u) => u.id === id)
}

/** Match normalized 0x address; optional excludeUserId for approve flows */
export async function findUserByEthereumAddress(
  address: string,
  excludeUserId?: string
): Promise<StoredUser | undefined> {
  const users = await readUsers()
  const lower = address.trim().toLowerCase()
  return users.find(
    (u) =>
      u.ethereumAddress &&
      u.ethereumAddress.toLowerCase() === lower &&
      u.id !== excludeUserId
  )
}

export async function addUser(user: StoredUser): Promise<void> {
  const users = await readUsers()
  users.push(user)
  await writeUsers(users)
}

export async function updateUser(id: string, patch: Partial<StoredUser>): Promise<StoredUser | null> {
  const users = await readUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx < 0) return null
  users[idx] = { ...users[idx], ...patch }
  await writeUsers(users)
  return users[idx]
}

export async function deleteUser(id: string): Promise<boolean> {
  const users = await readUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx < 0) return false
  users.splice(idx, 1)
  await writeUsers(users)
  return true
}
