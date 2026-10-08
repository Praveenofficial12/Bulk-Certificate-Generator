import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)

  const totalCertificates = await db.certificate.count({ where: { userId: user.id, status: 'GENERATED' } })
  const failedCertificates = await db.certificate.count({ where: { userId: user.id, status: 'FAILED' } })
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const generatedToday = await db.certificate.count({
    where: { userId: user.id, status: 'GENERATED', generatedAt: { gte: startOfDay } },
  })
  const activeJobs = await db.generationJob.count({ where: { userId: user.id, status: 'PROCESSING' } })
  const totalRecipients = await db.recipient.count({ where: { userId: user.id } })
  const totalJobs = await db.generationJob.count({ where: { userId: user.id } })
  const successRate = totalCertificates + failedCertificates > 0
    ? (totalCertificates / (totalCertificates + failedCertificates)) * 100
    : 0
  const failureRate = totalCertificates + failedCertificates > 0
    ? (failedCertificates / (totalCertificates + failedCertificates)) * 100
    : 0

  // average generation time
  const completedJobs = await db.generationJob.findMany({
    where: { userId: user.id, startedAt: { not: null }, completedAt: { not: null } },
    select: { startedAt: true, completedAt: true, totalRecipients: true },
  })
  const durations = completedJobs
    .filter((j) => j.startedAt && j.completedAt)
    .map((j) => (j.completedAt!.getTime() - j.startedAt!.getTime()) / 1000)
  const avgGenerationTimeSec = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0

  return jsonOk({
    totalCertificates,
    generatedToday,
    activeJobs,
    failedCertificates,
    totalRecipients,
    successRate,
    failureRate,
    totalJobs,
    avgGenerationTimeSec,
  })
}
