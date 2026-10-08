import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk, parsePagination } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const sp = req.nextUrl.searchParams
  const search = sp.get('search') ?? ''
  const action = sp.get('action') ?? ''
  const status = sp.get('status') ?? ''
  const { page, pageSize } = parsePagination(req)
  const where: any = { userId: user.id }
  if (action) where.action = action
  if (status) where.status = status
  if (search) {
    where.OR = [
      { userName: { contains: search } },
      { action: { contains: search } },
      { resource: { contains: search } },
      { resourceId: { contains: search } },
    ]
  }
  const [total, items] = await Promise.all([
    db.activityLog.count({ where }),
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])
  return jsonOk({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}
