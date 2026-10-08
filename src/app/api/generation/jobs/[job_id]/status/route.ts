import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ job_id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { job_id } = await params
  const job = await db.generationJob.findFirst({
    where: { OR: [{ id: job_id }, { jobId: job_id }], userId: user.id },
    select: {
      id: true,
      jobId: true,
      status: true,
      totalRecipients: true,
      processedCount: true,
      successfulCount: true,
      failedCount: true,
      progressPercentage: true,
      errorMessage: true,
      outputZipPath: true,
      reportPath: true,
      eventName: true,
    },
  })
  if (!job) return jsonError('NOT_FOUND', 'Job not found.', 404)
  // also fetch the recent certificate statuses for live feed
  const recent = await db.certificate.findMany({
    where: { jobId: job.id },
    orderBy: { generatedAt: 'desc' },
    take: 12,
    select: { certificateId: true, recipientName: true, status: true, errorMessage: true, generatedAt: true },
  })
  return jsonOk({ ...job, recent })
}
