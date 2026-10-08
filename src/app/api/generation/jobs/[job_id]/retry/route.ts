import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk, getClientIp } from '@/lib/api-helpers'
import { startJobProcessing } from '@/lib/bulk-worker'

export async function POST(req: NextRequest, { params }: { params: Promise<{ job_id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { job_id } = await params
  const job = await db.generationJob.findFirst({
    where: { OR: [{ id: job_id }, { jobId: job_id }], userId: user.id },
  })
  if (!job) return jsonError('NOT_FOUND', 'Job not found.', 404)

  // Only retry failed certificates in a partially completed/failed job
  if (job.status !== 'FAILED' && job.status !== 'PARTIALLY_COMPLETED') {
    return jsonError('NOT_RETRYABLE', `Only failed or partially completed jobs can be retried (current: ${job.status}).`, 409)
  }

  // Find failed certificates' recipients from snapshot
  const failedCerts = await db.certificate.findMany({
    where: { jobId: job.id, status: 'FAILED' },
    select: { recipientName: true, recipientEmail: true, department: true, registrationId: true, errorMessage: true },
  })

  if (failedCerts.length === 0) {
    return jsonError('NOTHING_TO_RETRY', 'No failed certificates to retry.', 400)
  }

  // Map failed certs to recipient rows
  const recipients = failedCerts.map((c) => ({
    name: c.recipientName,
    email: c.recipientEmail ?? undefined,
    department: c.department ?? undefined,
    registrationId: c.registrationId ?? undefined,
  }))

  // Delete old failed certificate records for this job so we can regenerate
  await db.certificate.deleteMany({ where: { jobId: job.id, status: 'FAILED' } })

  // Create a new retry job
  const jobCount = await db.generationJob.count()
  const retryJobId = `${job.jobId}-R${jobCount + 1}`
  const settings = JSON.parse(job.settings)

  const created = await db.generationJob.create({
    data: {
      jobId: retryJobId,
      userId: user.id,
      eventName: job.eventName,
      organizationName: job.organizationName,
      certificateTitle: job.certificateTitle,
      description: job.description,
      eventDate: job.eventDate,
      signatoryName: job.signatoryName,
      signatoryDesignation: job.signatoryDesignation,
      venue: job.venue,
      duration: job.duration,
      customMessage: job.customMessage,
      templateId: job.templateId,
      totalRecipients: recipients.length,
      status: 'PENDING',
      settings: JSON.stringify({ ...settings }),
      recipientsSnapshot: JSON.stringify(recipients),
    },
  })

  await db.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'JOB_RETRIED',
      resource: 'Job',
      resourceId: retryJobId,
      status: 'INFO',
      details: JSON.stringify({ original: job.jobId, retriedCount: recipients.length }),
      ipAddress: getClientIp(req),
    },
  })

  startJobProcessing(created.id)
  return jsonOk({ id: created.id, jobId: retryJobId, status: 'PENDING', totalRecipients: recipients.length })
}
