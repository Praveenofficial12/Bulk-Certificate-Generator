import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  // Staff can only see themselves
  if (user.role !== 'ADMIN') {
    return jsonOk({ items: [{ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: new Date().toISOString() }], total: 1 })
  }
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return jsonOk({ items: users, total: users.length })
}
