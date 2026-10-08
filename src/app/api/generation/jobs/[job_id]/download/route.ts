import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError } from '@/lib/api-helpers'
import path from 'path'
import fs from 'fs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ job_id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { job_id } = await params
  const job = await db.generationJob.findFirst({
    where: { OR: [{ id: job_id }, { jobId: job_id }], userId: user.id },
  })
  if (!job) return jsonError('NOT_FOUND', 'Job not found.', 404)
  if (!job.outputZipPath) {
    return jsonError('NO_ZIP', 'ZIP package is not available for this job.', 404)
  }
  const abs = path.join(process.cwd(), job.outputZipPath)
  if (!fs.existsSync(abs)) {
    return jsonError('FILE_MISSING', 'The ZIP file no longer exists on disk.', 410)
  }
  const buf = fs.readFileSync(abs)
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${job.jobId}.zip"`,
    },
  })
}
