import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk, getClientIp } from '@/lib/api-helpers'
import { cancelJob } from '@/lib/bulk-worker'

export async function POST(req: NextRequest, { params }: { params: Promise<{ job_id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { job_id } = await params
  const job = await db.generationJob.findFirst({
    where: { OR: [{ id: job_id }, { jobId: job_id }], userId: user.id },
  })
  if (!job) return jsonError('NOT_FOUND', 'Job not found.', 404)
  if (job.status === 'COMPLETED' || job.status === 'PARTIALLY_COMPLETED' || job.status === 'FAILED') {
    return jsonError('JOB_NOT_CANCELLABLE', `Job already in terminal status: ${job.status}.`, 409)
  }
  cancelJob(job.id)
  // Also mark in DB for safety if it hasn't started
  if (job.status === 'PENDING') {
    await db.generationJob.update({
      where: { id: job.id },
      data: { status: 'CANCELLED', completedAt: new Date(), errorMessage: 'Cancelled before processing started.' },
    })
  }
  await db.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'JOB_CANCELLED',
      resource: 'Job',
      resourceId: job.jobId,
      status: 'INFO',
      ipAddress: getClientIp(req),
    },
  })
  return jsonOk({ cancelled: true })
}
