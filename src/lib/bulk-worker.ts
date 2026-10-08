import { db } from './db'
import {
  TEMPLATES_CONFIG,
  generateCertificatePdf,
  type CertificateData,
} from './certificate-engine'
import { generateVerificationToken } from './auth'
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const OUTPUT_DIR = path.join(process.cwd(), 'storage', 'certificates')
const ZIP_DIR = path.join(process.cwd(), 'storage', 'zips')
const REPORT_DIR = path.join(process.cwd(), 'storage', 'reports')

interface JobRow {
  name: string
  email?: string
  phone?: string
  registrationId?: string
  department?: string
  institution?: string
  event?: string
  role?: string
  customField1?: string
  customField2?: string
}

interface JobSettings {
  format?: string
  paperSize?: 'A4' | 'Letter'
  orientation?: 'landscape' | 'portrait'
  certificateIdPrefix: string
  fileNamingPattern?: string
  generateZip?: boolean
  includeCsvReport?: boolean
  sendEmailNotification?: boolean
  generateQrCode?: boolean
}

function safeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

// In-flight job registry to allow cancellation
const activeJobs = new Map<string, { cancelled: boolean }>()

export function isJobCancelled(jobDbId: string): boolean {
  return activeJobs.get(jobDbId)?.cancelled === true
}

export function cancelJob(jobDbId: string): boolean {
  const entry = activeJobs.get(jobDbId)
  if (entry) {
    entry.cancelled = true
    return true
  }
  return false
}

function ensureDirs() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  if (!fs.existsSync(ZIP_DIR)) fs.mkdirSync(ZIP_DIR, { recursive: true })
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true })
}

async function findNextCertificateIdSeq(prefix: string): Promise<number> {
  const existing = await db.certificate.count({
    where: { certificateId: { startsWith: `${prefix}-` } },
  })
  return existing + 1
}

async function logActivity(params: {
  userId?: string | null
  userName: string
  action: string
  resource?: string
  resourceId?: string
  status: 'SUCCESS' | 'FAILED' | 'INFO'
  details?: Record<string, unknown>
  ipAddress?: string
}) {
  try {
    await db.activityLog.create({
      data: {
        userId: params.userId ?? null,
        userName: params.userName,
        action: params.action,
        resource: params.resource ?? null,
        resourceId: params.resourceId ?? null,
        status: params.status,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress ?? null,
      },
    })
  } catch {
    // ignore log errors
  }
}

export async function processGenerationJob(jobDbId: string) {
  ensureDirs()
  const entry = { cancelled: false }
  activeJobs.set(jobDbId, entry)

  try {
    const job = await db.generationJob.findUnique({
      where: { id: jobDbId },
      include: { template: true, user: true },
    })
    if (!job) {
      console.error(`Job ${jobDbId} not found`)
      return
    }
    if (job.status === 'CANCELLED' || job.status === 'COMPLETED' || job.status === 'PARTIALLY_COMPLETED') {
      return
    }

    const settings: JobSettings = JSON.parse(job.settings)
    const recipients: JobRow[] = job.recipientsSnapshot ? JSON.parse(job.recipientsSnapshot) : []

    if (recipients.length === 0) {
      await db.generationJob.update({
        where: { id: jobDbId },
        data: {
          status: 'FAILED',
          errorMessage: 'No recipients to process.',
          completedAt: new Date(),
        },
      })
      await logActivity({
        userId: job.userId,
        userName: job.user?.name ?? 'Unknown',
        action: 'GENERATION_FAILED',
        resource: 'Job',
        resourceId: job.jobId,
        status: 'FAILED',
        details: { reason: 'No recipients' },
      })
      return
    }

    // Mark as processing
    await db.generationJob.update({
      where: { id: jobDbId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        totalRecipients: recipients.length,
      },
    })
    await logActivity({
      userId: job.userId,
      userName: job.user?.name ?? 'Unknown',
      action: 'GENERATION_STARTED',
      resource: 'Job',
      resourceId: job.jobId,
      status: 'INFO',
      details: { eventName: job.eventName, totalRecipients: recipients.length },
    })

    const templateSlug = job.template.slug as keyof typeof TEMPLATES_CONFIG
    const baseConfig = TEMPLATES_CONFIG[templateSlug] ?? TEMPLATES_CONFIG['classic-blue']
    // Merge in any custom-template fields from the DB record (backgroundImage, isCustom, accentColor)
    const templateConfig = {
      ...baseConfig,
      accentColor: job.template.accentColor ?? baseConfig.accentColor,
      orientation: (job.template.orientation as 'landscape' | 'portrait') ?? baseConfig.orientation,
      paperSize: (job.template.paperSize as 'A4' | 'Letter') ?? baseConfig.paperSize,
      backgroundImage: job.template.backgroundImage ?? null,
      isCustom: job.template.isCustom || false,
    }
    const prefix = settings.certificateIdPrefix || 'CERT'
    let seq = await findNextCertificateIdSeq(prefix)

    // Job-specific output folder
    const jobOutputDir = path.join(OUTPUT_DIR, jobDbId)
    if (!fs.existsSync(jobOutputDir)) fs.mkdirSync(jobOutputDir, { recursive: true })

    const total = recipients.length
    let processed = 0
    let successful = 0
    let failed = 0
    const reportRows: any[] = []

    const BATCH_SIZE = 5
    for (let i = 0; i < total; i += BATCH_SIZE) {
      if (entry.cancelled) {
        // mark cancelled
        const remaining = total - processed
        await db.generationJob.update({
          where: { id: jobDbId },
          data: {
            status: 'CANCELLED',
            errorMessage: 'Job cancelled by user.',
            completedAt: new Date(),
            processedCount: processed,
            successfulCount: successful,
            failedCount: failed,
            progressPercentage: total > 0 ? Math.round((processed / total) * 100) : 0,
          },
        })
        await logActivity({
          userId: job.userId,
          userName: job.user?.name ?? 'Unknown',
          action: 'JOB_CANCELLED',
          resource: 'Job',
          resourceId: job.jobId,
          status: 'INFO',
          details: { processed, remaining },
        })
        activeJobs.delete(jobDbId)
        return
      }

      const batch = recipients.slice(i, i + BATCH_SIZE)
      for (const r of batch) {
        if (entry.cancelled) break
        try {
          const certificateId = `${prefix}-${String(seq).padStart(4, '0')}`
          seq++
          const verificationToken = generateVerificationToken()
          const verificationUrl = `${process.env.FRONTEND_URL ?? 'https://bulk-cert.example.com'}/?verify=${verificationToken}`

          const certData: CertificateData = {
            recipientName: r.name,
            eventName: job.eventName,
            organizationName: job.organizationName,
            certificateTitle: job.certificateTitle,
            eventDate: job.eventDate ?? undefined,
            certificateId,
            department: r.department,
            role: r.role,
            duration: job.duration ?? undefined,
            signatoryName: job.signatoryName ?? undefined,
            signatoryDesignation: job.signatoryDesignation ?? undefined,
            venue: job.venue ?? undefined,
            customMessage: job.customMessage ?? undefined,
            verificationToken,
            verificationUrl,
          }

          const fileName = settings.fileNamingPattern
            ? settings.fileNamingPattern
                .replace('{certificate_id}', certificateId)
                .replace('{recipient_name}', safeFileName(r.name))
            : `${certificateId}_${safeFileName(r.name)}.pdf`

          const filePath = path.join(jobOutputDir, fileName)
          await generateCertificatePdf(certData, templateConfig, filePath)

          // find or create recipient record
          let recipientId: string | null = null
          if (r.email) {
            const existing = await db.recipient.findFirst({
              where: { email: r.email, userId: job.userId },
            })
            if (existing) {
              recipientId = existing.id
              await db.recipient.update({
                where: { id: existing.id },
                data: {
                  name: r.name,
                  department: r.department ?? existing.department,
                  registrationId: r.registrationId ?? existing.registrationId,
                  role: r.role ?? existing.role,
                  event: r.event ?? existing.event,
                },
              })
            } else {
              const created = await db.recipient.create({
                data: {
                  name: r.name,
                  email: r.email,
                  phone: r.phone,
                  registrationId: r.registrationId,
                  department: r.department,
                  institution: r.institution,
                  event: r.event,
                  role: r.role,
                  customField1: r.customField1,
                  customField2: r.customField2,
                  userId: job.userId,
                },
              })
              recipientId = created.id
            }
          }

          await db.certificate.create({
            data: {
              certificateId,
              jobId: jobDbId,
              templateId: job.templateId,
              userId: job.userId,
              recipientName: r.name,
              recipientEmail: r.email ?? null,
              department: r.department ?? null,
              registrationId: r.registrationId ?? null,
              eventName: job.eventName,
              organizationName: job.organizationName,
              certificateTitle: job.certificateTitle,
              eventDate: job.eventDate ?? null,
              signatoryName: job.signatoryName ?? null,
              signatoryDesignation: job.signatoryDesignation ?? null,
              recipientId,
              filePath: path.relative(process.cwd(), filePath),
              fileName,
              status: 'GENERATED',
              verificationToken,
            },
          })

          reportRows.push({
            certificateId,
            recipient: r.name,
            email: r.email ?? '',
            status: 'GENERATED',
            fileName,
            generatedAt: new Date().toISOString(),
            error: '',
          })
          successful++
        } catch (e: any) {
          failed++
          reportRows.push({
            certificateId: '',
            recipient: r.name,
            email: r.email ?? '',
            status: 'FAILED',
            fileName: '',
            generatedAt: new Date().toISOString(),
            error: e?.message ?? 'Unknown error',
          })
          try {
            await db.certificate.create({
              data: {
                certificateId: `${prefix}-ERR-${String(i + failed).padStart(4, '0')}`,
                jobId: jobDbId,
                templateId: job.templateId,
                userId: job.userId,
                recipientName: r.name,
                recipientEmail: r.email ?? null,
                department: r.department ?? null,
                registrationId: r.registrationId ?? null,
                eventName: job.eventName,
                organizationName: job.organizationName,
                certificateTitle: job.certificateTitle,
                eventDate: job.eventDate ?? null,
                signatoryName: job.signatoryName ?? null,
                signatoryDesignation: job.signatoryDesignation ?? null,
                filePath: '',
                fileName: '',
                status: 'FAILED',
                errorMessage: e?.message ?? 'Unknown error',
                verificationToken: generateVerificationToken(),
              },
            })
          } catch {
            // ignore
          }
        }
        processed++
      }

      // update progress after each batch
      const progress = total > 0 ? Math.round((processed / total) * 100) : 0
      await db.generationJob.update({
        where: { id: jobDbId },
        data: {
          processedCount: processed,
          successfulCount: successful,
          failedCount: failed,
          progressPercentage: progress,
        },
      })
      // small yield to event loop
      await new Promise((r) => setTimeout(r, 10))
    }

    // Build ZIP and report
    let zipPath: string | null = null
    let reportPath: string | null = null

    const finalStatus = failed > 0 ? (successful > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED') : 'COMPLETED'

    if (settings.generateZip !== false && successful > 0) {
      const zip = new JSZip()
      const certsFolder = zip.folder('certificates')!
      const certFiles = fs.readdirSync(jobOutputDir)
      for (const f of certFiles) {
        if (f.endsWith('.pdf')) {
          const buf = fs.readFileSync(path.join(jobOutputDir, f))
          certsFolder.file(f, buf)
        }
      }
      if (settings.includeCsvReport) {
        const csv = Papa.unparse(reportRows)
        zip.file('generation_report.csv', csv)
      }
      const zipName = `${job.jobId}.zip`
      const zp = path.join(ZIP_DIR, zipName)
      const zipBuf = await zip.generateAsync({ type: 'nodebuffer' })
      fs.writeFileSync(zp, zipBuf)
      zipPath = path.relative(process.cwd(), zp)
    }

    if (settings.includeCsvReport) {
      const csv = Papa.unparse(reportRows)
      const rp = path.join(REPORT_DIR, `${job.jobId}_report.csv`)
      fs.writeFileSync(rp, csv)
      reportPath = path.relative(process.cwd(), rp)
    }

    await db.generationJob.update({
      where: { id: jobDbId },
      data: {
        status: finalStatus,
        processedCount: processed,
        successfulCount: successful,
        failedCount: failed,
        progressPercentage: 100,
        completedAt: new Date(),
        outputZipPath: zipPath,
        reportPath,
        ...(finalStatus === 'FAILED' && failed === total ? { errorMessage: 'All recipients failed to generate.' } : {}),
      },
    })

    // increment template usage
    await db.template.update({
      where: { id: job.templateId },
      data: { usageCount: { increment: 1 } },
    })

    // notification
    await db.notification.create({
      data: {
        userId: job.userId,
        type: finalStatus === 'COMPLETED' ? 'SUCCESS' : finalStatus === 'FAILED' ? 'ERROR' : 'WARNING',
        title: finalStatus === 'COMPLETED' ? 'Generation Complete' : finalStatus === 'PARTIALLY_COMPLETED' ? 'Generation Completed with Errors' : 'Generation Failed',
        message:
          finalStatus === 'COMPLETED'
            ? `${successful} certificates generated for "${job.eventName}".`
            : `${successful} succeeded, ${failed} failed for "${job.eventName}".`,
        link: `view=progress&jobId=${jobDbId}`,
      },
    })

    await logActivity({
      userId: job.userId,
      userName: job.user?.name ?? 'Unknown',
      action: 'GENERATION_COMPLETED',
      resource: 'Job',
      resourceId: job.jobId,
      status: finalStatus === 'FAILED' ? 'FAILED' : 'SUCCESS',
      details: { total, successful, failed, finalStatus },
    })
  } catch (e: any) {
    console.error(`Job ${jobDbId} processing failed:`, e)
    try {
      await db.generationJob.update({
        where: { id: jobDbId },
        data: {
          status: 'FAILED',
          errorMessage: e?.message ?? 'Unknown error',
          completedAt: new Date(),
        },
      })
    } catch {
      // ignore
    }
  } finally {
    activeJobs.delete(jobDbId)
  }
}

// Fire and forget
export function startJobProcessing(jobDbId: string) {
  // Use setImmediate to release the request
  if (typeof setImmediate !== 'undefined') {
    setImmediate(() => {
      processGenerationJob(jobDbId).catch((e) =>
        console.error(`Async job ${jobDbId} error:`, e)
      )
    })
  } else {
    setTimeout(() => {
      processGenerationJob(jobDbId).catch((e) =>
        console.error(`Async job ${jobDbId} error:`, e)
      )
    }, 0)
  }
}
