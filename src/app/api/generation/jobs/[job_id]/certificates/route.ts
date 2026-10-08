import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk, parsePagination } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ job_id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { job_id } = await params
  const job = await db.generationJob.findFirst({
    where: { OR: [{ id: job_id }, { jobId: job_id }], userId: user.id },
    select: { id: true, jobId: true, eventName: true, status: true },
  })
  if (!job) return jsonError('NOT_FOUND', 'Job not found.', 404)
  const sp = req.nextUrl.searchParams
  const status = sp.get('status') ?? ''
  const search = sp.get('search') ?? ''
  const { page, pageSize } = parsePagination(req)
  const where: any = { jobId: job.id }
  if (status) where.status = status
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
      include: { template: true },
      orderBy: { generatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])
  return jsonOk({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}
