import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError } from '@/lib/api-helpers'
import path from 'path'
import fs from 'fs'
import JSZip from 'jszip'
import Papa from 'papaparse'

export async function GET(req: NextRequest, { params }: { params: Promise<{ job_id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { job_id } = await params
  const job = await db.generationJob.findFirst({
    where: { OR: [{ id: job_id }, { jobId: job_id }], userId: user.id },
    include: { template: true },
  })
  if (!job) return jsonError('NOT_FOUND', 'Job not found.', 404)

  // If a ZIP already exists, serve it
  if (job.outputZipPath) {
    const abs = path.join(process.cwd(), job.outputZipPath)
    if (fs.existsSync(abs)) {
      const buf = fs.readFileSync(abs)
      return new Response(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${job.jobId}.zip"`,
        },
      })
    }
  }

  // Otherwise build on the fly
  const certs = await db.certificate.findMany({
    where: { jobId: job.id, status: 'GENERATED' },
  })
  if (certs.length === 0) {
    return jsonError('NO_CERTS', 'No generated certificates found for this job.', 404)
  }
  const zip = new JSZip()
  const folder = zip.folder('certificates')!
  for (const c of certs) {
    if (!c.filePath) continue
    const abs = path.join(process.cwd(), c.filePath)
    if (fs.existsSync(abs)) {
      folder.file(c.fileName, fs.readFileSync(abs))
    }
  }
  const report = certs.map((c) => ({
    certificateId: c.certificateId,
    recipient: c.recipientName,
    email: c.recipientEmail ?? '',
    status: c.status,
    fileName: c.fileName,
    generatedAt: c.generatedAt.toISOString(),
    error: c.errorMessage ?? '',
  }))
  zip.file('generation_report.csv', Papa.unparse(report))
  const buf = await zip.generateAsync({ type: 'nodebuffer' })
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${job.jobId}.zip"`,
    },
  })
}
