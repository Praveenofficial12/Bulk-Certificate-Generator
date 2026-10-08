import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, signToken, hashPassword } from '@/lib/auth'
import { ensureSeeded, jsonError, jsonOk, getClientIp } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  await ensureSeeded()
  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonError('INVALID_BODY', 'Request body is not valid JSON.', 400)
  }
  const { email, password } = body ?? {}
  if (!email || !password) {
    return jsonError('MISSING_FIELDS', 'Email and password are required.', 400)
  }
  const user = await db.user.findUnique({ where: { email: String(email).toLowerCase().trim() } })
  if (!user || !verifyPassword(String(password), user.password)) {
    return jsonError('INVALID_CREDENTIALS', 'Invalid email or password.', 401)
  }
  const token = signToken({ userId: user.id, role: user.role })
  await db.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'USER_LOGIN',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
    },
  })
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
