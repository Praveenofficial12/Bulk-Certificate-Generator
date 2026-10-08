import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { ensureSeeded, jsonError, jsonOk } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  await ensureSeeded()
  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonError('INVALID_BODY', 'Request body is not valid JSON.', 400)
  }
  const { name, email, password, role } = body ?? {}
  if (!name || !email || !password) {
    return jsonError('MISSING_FIELDS', 'Name, email and password are required.', 400)
  }
  if (String(password).length < 6) {
    return jsonError('WEAK_PASSWORD', 'Password must be at least 6 characters.', 400)
  }
  const normalized = String(email).toLowerCase().trim()
  const existing = await db.user.findUnique({ where: { email: normalized } })
  if (existing) {
    return jsonError('USER_EXISTS', 'A user with this email already exists.', 409)
  }
  const user = await db.user.create({
    data: {
      name: String(name).trim(),
      email: normalized,
      password: hashPassword(String(password)),
      role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
    },
  })
  const token = signToken({ userId: user.id, role: user.role })
  return jsonOk({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
}
