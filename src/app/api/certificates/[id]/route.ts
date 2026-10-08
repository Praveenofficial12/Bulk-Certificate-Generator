import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { id } = await params
  const cert = await db.certificate.findFirst({
    where: {
      OR: [{ id }, { certificateId: id }],
      userId: user.id,
    },
    include: { template: true, job: { select: { id: true, jobId: true, eventName: true } } },
  })
  if (!cert) return jsonError('NOT_FOUND', 'Certificate not found.', 404)
  return jsonOk(cert)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { id } = await params
  const deleted = await db.certificate.deleteMany({
    where: { OR: [{ id }, { certificateId: id }], userId: user.id },
  })
  if (deleted.count === 0) return jsonError('NOT_FOUND', 'Certificate not found.', 404)
  return jsonOk({ deleted: true })
}
