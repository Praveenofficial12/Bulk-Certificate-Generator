import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError } from '@/lib/api-helpers'
import path from 'path'
import fs from 'fs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { id } = await params
  const cert = await db.certificate.findFirst({
    where: { OR: [{ id }, { certificateId: id }], userId: user.id },
  })
  if (!cert) return jsonError('NOT_FOUND', 'Certificate not found.', 404)
  if (cert.status !== 'GENERATED' || !cert.filePath) {
    return jsonError('NOT_GENERATED', 'This certificate has not been generated yet.', 409)
  }
  const abs = path.join(process.cwd(), cert.filePath)
  if (!fs.existsSync(abs)) {
    return jsonError('FILE_MISSING', 'The certificate file no longer exists on disk.', 410)
  }
  await db.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'CERTIFICATE_DOWNLOADED',
      resource: 'Certificate',
      resourceId: cert.certificateId,
      status: 'INFO',
      ipAddress: req.headers.get('x-real-ip') ?? 'unknown',
    },
  })
  const buf = fs.readFileSync(abs)
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${cert.fileName}"`,
    },
  })
}
