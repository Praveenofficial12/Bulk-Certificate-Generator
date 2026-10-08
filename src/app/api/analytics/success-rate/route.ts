import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const total = await db.certificate.count({ where: { userId: user.id, status: 'GENERATED' } })
  const failed = await db.certificate.count({ where: { userId: user.id, status: 'FAILED' } })
  const sum = total + failed
  const successRate = sum > 0 ? (total / sum) * 100 : 0
  const failureRate = sum > 0 ? (failed / sum) * 100 : 0
  return jsonOk({ successRate, failureRate, total, failed })
}
