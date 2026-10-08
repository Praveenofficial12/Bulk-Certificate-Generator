import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ job_id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { job_id } = await params
  // job_id param can be the DB id or the human readable jobId
  const job = await db.generationJob.findFirst({
    where: {
      OR: [{ id: job_id }, { jobId: job_id }],
      userId: user.id,
    },
    include: { template: true, user: { select: { id: true, name: true, email: true } } },
  })
  if (!job) return jsonError('NOT_FOUND', 'Job not found.', 404)
  return jsonOk(job)
}
