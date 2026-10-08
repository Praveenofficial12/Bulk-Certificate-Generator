import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk, getClientIp } from '@/lib/api-helpers'
import { startJobProcessing, type } from '@/lib/bulk-worker'
import { generateJobId } from '@/lib/auth'
import { validateRecipients } from '@/lib/parse'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const sp = req.nextUrl.searchParams
  const status = sp.get('status') ?? ''
  const search = sp.get('search') ?? ''
  const page = Math.max(1, parseInt(sp.get('page') ?? '1') || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(sp.get('pageSize') ?? '10') || 10))

  const where: any = { userId: user.id }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { jobId: { contains: search } },
      { eventName: { contains: search } },
    ]
  }
  const [total, jobs] = await Promise.all([
    db.generationJob.count({ where }),
    db.generationJob.findMany({
      where,
      include: { template: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])
  return jsonOk({
    items: jobs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonError('INVALID_BODY', 'Request body is not valid JSON.', 400)
  }

  const {
    eventName,
    organizationName,
    certificateTitle,
    description,
    eventDate,
    signatoryName,
    signatoryDesignation,
    venue,
    duration,
    customMessage,
    templateId,
    recipients,
    settings,
  } = body ?? {}

  if (!eventName || !eventName.trim()) return jsonError('MISSING_EVENT', 'Event name is required.', 400)
  if (!organizationName || !organizationName.trim()) return jsonError('MISSING_ORG', 'Organization name is required.', 400)
  if (!certificateTitle || !certificateTitle.trim()) return jsonError('MISSING_TITLE', 'Certificate title is required.', 400)
  if (!templateId) return jsonError('MISSING_TEMPLATE', 'Template is required.', 400)
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return jsonError('NO_RECIPIENTS', 'At least one recipient is required.', 400)
  }
  if (recipients.length > 5000) {
    return jsonError('TOO_MANY', 'Maximum 5000 recipients per job.', 400)
  }

  const template = await db.template.findUnique({ where: { id: templateId } })
  if (!template) return jsonError('TEMPLATE_NOT_FOUND', 'Selected template does not exist.', 404)

  // Backend validation (mirrors frontend) — reject rows without name
  const validation = validateRecipients(recipients)
  if (validation.valid === 0) {
    return jsonError(
      'INVALID_RECIPIENT_DATA',
      'No valid recipient records found. Please fix the data and try again.',
      400,
      { total: validation.total, valid: 0, invalid: validation.invalid, duplicates: validation.duplicates }
    )
  }

  const finalSettings = {
    format: settings?.format ?? 'pdf',
    paperSize: settings?.paperSize ?? 'A4',
    orientation: settings?.orientation ?? template.orientation,
    certificateIdPrefix: (settings?.certificateIdPrefix ?? 'CERT').trim() || 'CERT',
    fileNamingPattern: settings?.fileNamingPattern ?? '{certificate_id}_{recipient_name}.pdf',
    generateZip: settings?.generateZip ?? true,
    includeCsvReport: settings?.includeCsvReport ?? true,
    sendEmailNotification: settings?.sendEmailNotification ?? false,
    generateQrCode: settings?.generateQrCode ?? true,
  }

  const jobCount = await db.generationJob.count()
  const jobId = generateJobId(jobCount + 1)

  // Use only valid rows for processing
  const recipientsToProcess = validation.validRows
  if (recipientsToProcess.length === 0) {
    return jsonError('NO_VALID', 'No valid recipients to generate for.', 400)
  }

  const created = await db.generationJob.create({
    data: {
      jobId,
      userId: user.id,
      eventName: String(eventName).trim(),
      organizationName: String(organizationName).trim(),
      certificateTitle: String(certificateTitle).trim(),
      description: description ?? null,
      eventDate: eventDate ?? null,
      signatoryName: signatoryName ?? null,
      signatoryDesignation: signatoryDesignation ?? null,
      venue: venue ?? null,
      duration: duration ?? null,
      customMessage: customMessage ?? null,
      templateId,
      totalRecipients: recipientsToProcess.length,
      processedCount: 0,
      successfulCount: 0,
      failedCount: 0,
      progressPercentage: 0,
      status: 'PENDING',
      settings: JSON.stringify(finalSettings),
      recipientsSnapshot: JSON.stringify(recipientsToProcess),
    },
  })

  await db.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'GENERATION_STARTED',
      resource: 'Job',
      resourceId: jobId,
      status: 'INFO',
      details: JSON.stringify({
        eventName: created.eventName,
        totalRecipients: recipientsToProcess.length,
        invalidSkipped: validation.invalid + validation.duplicates,
      }),
      ipAddress: getClientIp(req),
    },
  })

  // Fire and forget - returns immediately
  startJobProcessing(created.id)

  return jsonOk({
    id: created.id,
    jobId: created.jobId,
    status: created.status,
    totalRecipients: created.totalRecipients,
    createdAt: created.createdAt,
    skippedInvalid: validation.invalid + validation.duplicates,
  }, 201)
}
