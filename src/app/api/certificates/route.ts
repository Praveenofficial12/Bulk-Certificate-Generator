import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk, parsePagination } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const sp = req.nextUrl.searchParams
  const search = sp.get('search') ?? ''
  const status = sp.get('status') ?? ''
  const eventName = sp.get('eventName') ?? ''
  const templateId = sp.get('templateId') ?? ''
  const { page, pageSize } = parsePagination(req)
  const where: any = { userId: user.id }
  if (status) where.status = status
  if (eventName) where.eventName = eventName
  if (templateId) where.templateId = templateId
  if (search) {
    where.OR = [
      { certificateId: { contains: search } },
      { recipientName: { contains: search } },
      { recipientEmail: { contains: search } },
    ]
  }
  const [total, items] = await Promise.all([
    db.certificate.count({ where }),
    db.certificate.findMany({
      where,
      include: { template: true, job: { select: { id: true, jobId: true, eventName: true } } },
      orderBy: { generatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])
  return jsonOk({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
